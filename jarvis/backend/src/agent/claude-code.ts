import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import type { Eseguibile } from './eseguibile.ts'
import type { EventoAgente } from './eventi.ts'

// Esegue UN turno di conversazione con Claude Code installato sul PC (modalità "headless", -p).
// Claude Code usa l'account con cui hai fatto il login: nessuna chiave API nel progetto.
// Il messaggio passa da stdin (non dalla riga di comando), così nessun testo può diventare un comando.

export type OpzioniTurno = {
  messaggio: string
  sessione: { id: string; avviata: boolean }
  eseguibile: Eseguibile
  cartellaLavoro: string
  istruzioni: string
  /** strumenti integrati di Claude Code concessi (es. WebSearch). Tutti gli altri restano spenti. */
  strumenti: string[]
  modello?: string
  timeoutMs: number
  consentiApiAConsumo: boolean
  signal?: AbortSignal
  onEvento: (e: EventoAgente) => void
  /** chiamato appena Claude Code ha creato/aperto la sessione */
  onSessioneAperta?: () => void
}

export type EsitoTurno = 'ok' | 'errore' | 'interrotto' | 'sessione-mancante'

// Variabili che farebbero usare a Claude Code un servizio a consumo invece del tuo abbonamento
const VARIABILI_A_CONSUMO = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CODE_USE_FOUNDRY',
]

const DESCRIZIONI_STRUMENTI: Record<string, string> = {
  WebSearch: 'Ricerca sul web',
  WebFetch: 'Lettura di una pagina web',
}

export const descriviStrumento = (nome: string) =>
  DESCRIZIONI_STRUMENTI[nome] ?? nome.replace(/^mcp__[^_]+__/, '').replace(/_/g, ' ')

export function spiegaErrore(testo: string): string {
  const t = testo.trim()
  if (/not logged in|please run \/login|\/login|invalid api key|authenticat|oauth token/i.test(t))
    return 'Claude Code non è collegato al tuo account. Apri PowerShell, scrivi claude, premi Invio e poi scrivi /login.'
  if (/usage limit|limit reached|rate.?limit|too many requests|overloaded/i.test(t))
    return 'Il tuo abbonamento Claude ha raggiunto il limite di utilizzo per ora, oppure i server sono occupati. Riprova tra un po’.'
  if (/ENOENT|not recognized|non è riconosciuto/i.test(t))
    return 'Non trovo Claude Code su questo computer. Controlla che sia installato (comando: claude --version).'
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch failed/i.test(t))
    return 'Claude Code non riesce a collegarsi a Internet. Controlla la connessione.'
  return `Claude Code ha restituito un errore: ${t.slice(0, 300) || 'motivo sconosciuto'}`
}

const sessioneMancante = (testo: string) => /no conversation found|session.{0,40}not found|could not find session/i.test(testo)

export function costruisciArgomenti(o: Pick<OpzioniTurno, 'sessione' | 'strumenti' | 'modello'>, fileIstruzioni: string) {
  const args = [
    '-p',
    '--output-format', 'stream-json',
    '--verbose',
    '--include-partial-messages',
    // solo gli strumenti concessi; niente Bash, niente modifica di file, niente impostazioni personali
    '--tools', o.strumenti.join(','),
    '--setting-sources', '',
    '--strict-mcp-config',
    '--system-prompt-file', fileIstruzioni,
  ]
  if (o.strumenti.length) args.push('--allowedTools', ...o.strumenti)
  args.push(...(o.sessione.avviata ? ['--resume', o.sessione.id] : ['--session-id', o.sessione.id]))
  if (o.modello) args.push('--model', o.modello)
  return args
}

type Riga = Record<string, unknown> & { type?: string }

export function eseguiTurno(o: OpzioniTurno): Promise<EsitoTurno> {
  return new Promise((resolve) => {
    fs.mkdirSync(o.cartellaLavoro, { recursive: true })
    const fileIstruzioni = path.join(o.cartellaLavoro, 'istruzioni-jarvis.txt')
    fs.writeFileSync(fileIstruzioni, o.istruzioni)

    const env = { ...process.env }
    if (!o.consentiApiAConsumo) for (const v of VARIABILI_A_CONSUMO) delete env[v]

    let args = [...o.eseguibile.prefisso, ...costruisciArgomenti(o, fileIstruzioni)]
    // solo nel caso estremo in cui serve il prompt dei comandi: ogni argomento tra virgolette
    if (o.eseguibile.shell) args = args.map((a) => `"${a.replace(/"/g, '')}"`)

    let figlio: ReturnType<typeof spawn>
    try {
      figlio = spawn(o.eseguibile.comando, args, {
        cwd: o.cartellaLavoro,
        env,
        shell: o.eseguibile.shell,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (err) {
      o.onEvento({ tipo: 'errore', messaggio: spiegaErrore(String(err)) })
      return resolve('errore')
    }

    let concluso = false
    let interrotto = false
    let bloccato = false
    let esitoFinale: EsitoTurno | null = null
    let stderr = ''
    let testoEmesso = false
    let separatore = false
    let vistiParziali = false
    const strumentiAnnunciati = new Set<string>()

    const termina = () => {
      if (figlio.exitCode !== null || figlio.killed) return
      if (process.platform === 'win32' && figlio.pid) {
        // chiude anche eventuali processi figli
        spawn('taskkill', ['/pid', String(figlio.pid), '/T', '/F'], { windowsHide: true }).on('error', () => figlio.kill())
      } else {
        figlio.kill()
      }
    }

    const suInterruzione = () => {
      interrotto = true
      termina()
    }
    o.signal?.addEventListener('abort', suInterruzione, { once: true })
    if (o.signal?.aborted) suInterruzione()

    const timer = setTimeout(() => {
      o.onEvento({ tipo: 'errore', messaggio: `Claude Code non ha risposto entro ${Math.round(o.timeoutMs / 1000)} secondi.` })
      esitoFinale = 'errore'
      termina()
    }, o.timeoutMs)

    const emettiTesto = (testo: string) => {
      if (!testo) return
      if (separatore && testoEmesso) testo = '\n\n' + testo
      separatore = false
      testoEmesso = true
      o.onEvento({ tipo: 'testo', testo })
    }

    const annunciaStrumento = (nome: string, id: string) => {
      if (strumentiAnnunciati.has(id)) return
      strumentiAnnunciati.add(id)
      o.onEvento({ tipo: 'stato', stato: 'WORKING', strumento: nome, descrizione: descriviStrumento(nome) })
    }

    const gestisci = (r: Riga) => {
      switch (r.type) {
        case 'system': {
          if (r.subtype !== 'init') return
          o.onSessioneAperta?.()
          const fonte = typeof r.apiKeySource === 'string' ? r.apiKeySource : 'none'
          if (fonte !== 'none' && !o.consentiApiAConsumo) {
            // Regola sui costi: mai usare chiavi API a consumo senza autorizzazione esplicita
            bloccato = true
            o.onEvento({
              tipo: 'errore',
              messaggio: `Ho fermato la richiesta: Claude Code stava per usare una chiave API a consumo (${fonte}) invece del tuo abbonamento. Se vuoi davvero usarla, scrivi JARVIS_CONSENTI_API_A_CONSUMO=1 nel file .env.`,
            })
            termina()
          }
          return
        }
        case 'stream_event': {
          vistiParziali = true
          const ev = r.event as Record<string, unknown> | undefined
          if (!ev) return
          if (ev.type === 'message_start') separatore = true
          if (ev.type === 'content_block_start') {
            const blocco = ev.content_block as { type?: string; name?: string; id?: string } | undefined
            if (blocco && (blocco.type === 'tool_use' || blocco.type === 'server_tool_use') && blocco.name)
              annunciaStrumento(blocco.name, blocco.id ?? blocco.name + Math.random())
          }
          if (ev.type === 'content_block_delta') {
            const delta = ev.delta as { type?: string; text?: string } | undefined
            if (delta?.type === 'text_delta' && delta.text) emettiTesto(delta.text)
          }
          return
        }
        case 'assistant': {
          const contenuto = ((r.message as { content?: unknown[] })?.content ?? []) as { type?: string; text?: string; name?: string; id?: string }[]
          for (const b of contenuto) {
            if (b.type === 'tool_use' && b.name) annunciaStrumento(b.name, b.id ?? b.name)
            // se la versione di Claude Code non manda i pezzi parziali, usa il messaggio intero
            if (!vistiParziali && b.type === 'text' && b.text) {
              separatore = true
              emettiTesto(b.text)
            }
          }
          return
        }
        case 'user':
          // risultati degli strumenti: Claude torna a ragionare
          o.onEvento({ tipo: 'stato', stato: 'THINKING' })
          return
        case 'result': {
          const testo = typeof r.result === 'string' ? r.result : ''
          const errore = r.is_error === true || (typeof r.subtype === 'string' && r.subtype !== 'success')
          if (!errore) {
            if (!testoEmesso && testo) emettiTesto(testo)
            esitoFinale = 'ok'
          } else if (sessioneMancante(testo)) {
            esitoFinale = 'sessione-mancante'
          } else {
            esitoFinale = 'errore'
            o.onEvento({ tipo: 'errore', messaggio: spiegaErrore(testo || String(r.subtype ?? '')) })
          }
          return
        }
      }
    }

    readline.createInterface({ input: figlio.stdout! }).on('line', (riga) => {
      const pulita = riga.trim()
      if (!pulita.startsWith('{')) return
      try {
        gestisci(JSON.parse(pulita))
      } catch {
        // riga non JSON: ignorata
      }
    })
    figlio.stderr!.on('data', (d) => {
      stderr = (stderr + d.toString()).slice(-4000)
    })

    figlio.stdin!.on('error', () => {})
    figlio.stdin!.end(o.messaggio)

    const chiudi = (codice: number | null, erroreAvvio?: Error) => {
      if (concluso) return
      concluso = true
      clearTimeout(timer)
      o.signal?.removeEventListener('abort', suInterruzione)
      if (interrotto) return resolve('interrotto')
      if (bloccato) return resolve('errore')
      if (esitoFinale) return resolve(esitoFinale)
      const motivo = erroreAvvio ? String(erroreAvvio) : stderr || `uscita con codice ${codice}`
      if (sessioneMancante(motivo)) return resolve('sessione-mancante')
      o.onEvento({ tipo: 'errore', messaggio: spiegaErrore(motivo) })
      resolve('errore')
    }
    figlio.on('error', (err) => chiudi(null, err))
    figlio.on('close', (codice) => chiudi(codice))
  })
}
