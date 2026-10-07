import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import type { Eseguibile } from './eseguibile.ts'
import type { EventoAgente } from './eventi.ts'

// Collegamento con Claude Code installato sul PC (modalità "headless", -p).
// Claude Code usa l'account con cui hai fatto il login: nessuna chiave API nel progetto.
// Il messaggio passa da stdin (non dalla riga di comando), così nessun testo può diventare un comando.
//
// Due modalità:
//  - ProcessoClaude: Claude Code resta acceso e riceve i messaggi uno dopo l'altro (veloce, predefinita)
//  - eseguiTurno:    Claude Code viene avviato da zero per ogni messaggio (più lento, usato come riserva)

export type Avvio = {
  sessione: { id: string; avviata: boolean }
  eseguibile: Eseguibile
  cartellaLavoro: string
  istruzioni: string
  /** strumenti integrati di Claude Code concessi (es. WebSearch). Tutti gli altri restano spenti. */
  strumenti: string[]
  modello?: string
  /** quanto "ragionare" prima di rispondere: low è il più rapido */
  effort?: string
  consentiApiAConsumo: boolean
  /** chiamato appena Claude Code ha creato/aperto la sessione */
  onSessioneAperta?: () => void
  /** strumenti di Ambrogio (server MCP del backend): indirizzo, chiave segreta e nomi degli strumenti */
  mcp?: { url: string; chiave: string; strumenti: string[] }
}

export type OpzioniTurno = Avvio & {
  messaggio: string
  timeoutMs: number
  signal?: AbortSignal
  onEvento: (e: EventoAgente) => void
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

export const sessioneMancante = (testo: string) => /no conversation found|session.{0,40}not found|could not find session/i.test(testo)

export function costruisciArgomenti(
  o: Pick<Avvio, 'sessione' | 'strumenti' | 'modello' | 'effort' | 'mcp'>,
  fileIstruzioni: string,
  persistente = false,
  fileMcp?: string,
) {
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
  if (persistente) args.push('--input-format', 'stream-json')
  if (fileMcp) args.push('--mcp-config', fileMcp)
  // strumenti pre-approvati: gli integrati concessi e quelli di Ambrogio (che hanno già il loro controllo dei permessi)
  const consentiti = [...o.strumenti, ...(o.mcp?.strumenti ?? []).map((n) => `mcp__ambrogio__${n}`)]
  if (consentiti.length) args.push('--allowedTools', ...consentiti)
  args.push(...(o.sessione.avviata ? ['--resume', o.sessione.id] : ['--session-id', o.sessione.id]))
  if (o.modello) args.push('--model', o.modello)
  if (o.effort) args.push('--effort', o.effort)
  return args
}

/** Avvia il processo di Claude Code con l'ambiente ripulito dalle chiavi a consumo. */
function avviaClaude(o: Avvio, persistente: boolean): ChildProcess {
  fs.mkdirSync(o.cartellaLavoro, { recursive: true })
  const fileIstruzioni = path.join(o.cartellaLavoro, 'istruzioni-ambrogio.txt')
  fs.writeFileSync(fileIstruzioni, o.istruzioni)

  // configurazione del server MCP di Ambrogio (contiene la chiave segreta: sta in data/, fuori da git)
  let fileMcp: string | undefined
  if (o.mcp) {
    fileMcp = path.join(o.cartellaLavoro, 'mcp-ambrogio.json')
    const config = { mcpServers: { ambrogio: { type: 'http', url: o.mcp.url, headers: { Authorization: `Bearer ${o.mcp.chiave}` } } } }
    fs.writeFileSync(fileMcp, JSON.stringify(config, null, 2))
  }

  const env: NodeJS.ProcessEnv = { ...process.env }
  if (!o.consentiApiAConsumo) for (const v of VARIABILI_A_CONSUMO) delete env[v]
  // uno strumento può restare in attesa del tuo permesso anche per diversi minuti
  env.MCP_TOOL_TIMEOUT ??= String(15 * 60 * 1000)

  let args = [...o.eseguibile.prefisso, ...costruisciArgomenti(o, fileIstruzioni, persistente, fileMcp)]
  // solo nel caso estremo in cui serve il prompt dei comandi: ogni argomento tra virgolette
  if (o.eseguibile.shell) args = args.map((a) => `"${a.replace(/"/g, '')}"`)

  return spawn(o.eseguibile.comando, args, {
    cwd: o.cartellaLavoro,
    env,
    shell: o.eseguibile.shell,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function termina(figlio: ChildProcess) {
  if (figlio.exitCode !== null || figlio.killed) return
  if (process.platform === 'win32' && figlio.pid) {
    // chiude anche eventuali processi figli
    spawn('taskkill', ['/pid', String(figlio.pid), '/T', '/F'], { windowsHide: true }).on('error', () => figlio.kill())
  } else {
    figlio.kill()
  }
}

type Riga = Record<string, unknown> & { type?: string }

const messaggioBlocco = (fonte: string) =>
  `Ho fermato la richiesta: Claude Code stava per usare una chiave API a consumo (${fonte}) invece del tuo abbonamento. Se vuoi davvero usarla, scrivi AMBROGIO_CONSENTI_API_A_CONSUMO=1 nel file .env.`

/** Controlla la riga iniziale di Claude Code: restituisce un messaggio di blocco se userebbe un servizio a consumo. */
function controllaInit(r: Riga, consentiApiAConsumo: boolean): string | null {
  const fonte = typeof r.apiKeySource === 'string' ? r.apiKeySource : 'none'
  return fonte !== 'none' && !consentiApiAConsumo ? messaggioBlocco(fonte) : null
}

/**
 * Traduce le righe di Claude Code di UN turno in eventi per l'interfaccia.
 * Restituisce l'esito quando arriva la riga finale ("result").
 */
function creaInterprete(onEvento: (e: EventoAgente) => void) {
  let testoEmesso = false
  let separatore = false
  let vistiParziali = false
  const strumentiAnnunciati = new Set<string>()

  const emettiTesto = (testo: string) => {
    if (!testo) return
    if (separatore && testoEmesso) testo = '\n\n' + testo
    separatore = false
    testoEmesso = true
    onEvento({ tipo: 'testo', testo })
  }
  const annunciaStrumento = (nome: string, id: string) => {
    // gli strumenti di Ambrogio si annunciano da soli (dal gestore dei permessi, con una descrizione migliore)
    if (nome.startsWith('mcp__ambrogio__')) return
    if (strumentiAnnunciati.has(id)) return
    strumentiAnnunciati.add(id)
    onEvento({ tipo: 'stato', stato: 'WORKING', strumento: nome, descrizione: descriviStrumento(nome) })
  }

  return (r: Riga): EsitoTurno | null => {
    switch (r.type) {
      case 'stream_event': {
        vistiParziali = true
        const ev = r.event as Record<string, unknown> | undefined
        if (!ev) return null
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
        return null
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
        return null
      }
      case 'user': {
        // risultati degli strumenti: Claude torna a ragionare (le eco dei messaggi utente non hanno tool_result)
        const contenuto = ((r.message as { content?: unknown })?.content ?? []) as unknown
        if (Array.isArray(contenuto) && contenuto.some((b) => (b as { type?: string })?.type === 'tool_result'))
          onEvento({ tipo: 'stato', stato: 'THINKING' })
        return null
      }
      case 'result': {
        const testo = typeof r.result === 'string' ? r.result : ''
        const errore = r.is_error === true || (typeof r.subtype === 'string' && r.subtype !== 'success')
        if (!errore) {
          if (!testoEmesso && testo) emettiTesto(testo)
          return 'ok'
        }
        if (sessioneMancante(testo)) return 'sessione-mancante'
        onEvento({ tipo: 'errore', messaggio: spiegaErrore(testo || String(r.subtype ?? '')) })
        return 'errore'
      }
    }
    return null
  }
}

function leggiRighe(figlio: ChildProcess, suRiga: (r: Riga) => void) {
  readline.createInterface({ input: figlio.stdout! }).on('line', (riga) => {
    const pulita = riga.trim()
    if (!pulita.startsWith('{')) return
    let r: Riga
    try {
      r = JSON.parse(pulita)
    } catch {
      return // riga non JSON: ignorata
    }
    suRiga(r)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Modalità veloce: Claude Code resta acceso
// ─────────────────────────────────────────────────────────────────────────────

type TurnoInCorso = {
  interpreta: (r: Riga) => EsitoTurno | null
  onEvento: (e: EventoAgente) => void
  fine: (esito: EsitoTurno) => void
}

export class ProcessoClaude {
  private avvio: Avvio
  private figlio: ChildProcess | null = null
  private turno: TurnoInCorso | null = null
  private stderr = ''
  private blocco: string | null = null
  private avviatoAlle = 0
  /** true se il processo si è chiuso subito dopo l'avvio: la modalità veloce non funziona su questo PC */
  fallito = false

  constructor(avvio: Avvio) {
    this.avvio = avvio
  }

  get acceso() {
    return !!this.figlio && this.figlio.exitCode === null && !this.figlio.killed
  }

  /** età del processo in millisecondi (le istruzioni, con data e ora, si aggiornano riavviandolo) */
  get eta() {
    return this.acceso ? Date.now() - this.avviatoAlle : Infinity
  }

  /** Accende Claude Code in anticipo, così il primo messaggio non aspetta l'avvio. */
  accendi(avvio?: Avvio) {
    if (avvio) this.avvio = avvio
    if (this.acceso) return
    this.stderr = ''
    this.blocco = null
    this.avviatoAlle = Date.now()
    let figlio: ChildProcess
    try {
      figlio = avviaClaude(this.avvio, true)
    } catch (err) {
      this.fallito = true
      this.stderr = String(err)
      return
    }
    this.figlio = figlio
    figlio.stdin!.on('error', () => {})
    figlio.stderr!.on('data', (d) => {
      this.stderr = (this.stderr + d.toString()).slice(-4000)
    })
    leggiRighe(figlio, (r) => {
      // righe di un processo vecchio (già chiuso o sostituito): ignorate
      if (this.figlio !== figlio) return
      if (r.type === 'system' && r.subtype === 'init') {
        this.avvio.onSessioneAperta?.()
        this.blocco = controllaInit(r, this.avvio.consentiApiAConsumo)
        if (this.blocco) {
          this.turno?.onEvento({ tipo: 'errore', messaggio: this.blocco })
          this.turno?.fine('errore')
          termina(figlio)
        }
        return
      }
      const t = this.turno
      if (!t) return
      const esito = t.interpreta(r)
      if (esito) t.fine(esito)
    })
    figlio.on('error', (err) => {
      this.stderr += String(err)
    })
    figlio.on('close', () => {
      // la chiusura di un processo vecchio (es. dopo un'interruzione) non riguarda il turno attuale
      if (this.figlio !== figlio) return
      this.figlio = null
      const durata = Date.now() - this.avviatoAlle
      const t = this.turno
      if (t) {
        const motivo = this.stderr || 'Claude Code si è chiuso inaspettatamente.'
        if (sessioneMancante(motivo)) t.fine('sessione-mancante')
        else {
          // se si chiude entro pochi secondi dall'avvio senza aver mai risposto, la modalità veloce non va
          if (durata < 15000) this.fallito = true
          t.onEvento({ tipo: 'errore', messaggio: spiegaErrore(motivo) })
          t.fine('errore')
        }
      }
    })
  }

  spegni() {
    if (this.figlio) termina(this.figlio)
    this.figlio = null
  }

  /** Invia un messaggio a Claude Code già acceso e attende la fine della risposta. */
  invia(messaggio: string, opzioni: { timeoutMs: number; signal?: AbortSignal; onEvento: (e: EventoAgente) => void }): Promise<EsitoTurno> {
    return new Promise((resolve) => {
      if (!this.acceso) this.accendi()
      const figlio = this.figlio
      if (!figlio) {
        opzioni.onEvento({ tipo: 'errore', messaggio: spiegaErrore(this.stderr) })
        return resolve('errore')
      }
      if (this.blocco) {
        opzioni.onEvento({ tipo: 'errore', messaggio: this.blocco })
        return resolve('errore')
      }

      let finito = false
      const fine = (esito: EsitoTurno) => {
        if (finito) return
        finito = true
        clearTimeout(timer)
        opzioni.signal?.removeEventListener('abort', interrompi)
        if (this.turno === turno) this.turno = null
        resolve(esito)
      }
      const interrompi = () => {
        // per fermare Claude a metà risposta si chiude il processo; al prossimo messaggio riparte con --resume
        this.spegni()
        fine('interrotto')
      }
      const timer = setTimeout(() => {
        opzioni.onEvento({ tipo: 'errore', messaggio: `Claude Code non ha risposto entro ${Math.round(opzioni.timeoutMs / 1000)} secondi.` })
        this.spegni()
        fine('errore')
      }, opzioni.timeoutMs)

      const turno: TurnoInCorso = { interpreta: creaInterprete(opzioni.onEvento), onEvento: opzioni.onEvento, fine }
      this.turno = turno
      opzioni.signal?.addEventListener('abort', interrompi, { once: true })
      if (opzioni.signal?.aborted) return interrompi()

      const riga = { type: 'user', message: { role: 'user', content: [{ type: 'text', text: messaggio }] } }
      figlio.stdin!.write(JSON.stringify(riga) + '\n')
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modalità di riserva: un avvio di Claude Code per ogni messaggio
// ─────────────────────────────────────────────────────────────────────────────

export function eseguiTurno(o: OpzioniTurno): Promise<EsitoTurno> {
  return new Promise((resolve) => {
    let figlio: ChildProcess
    try {
      figlio = avviaClaude(o, false)
    } catch (err) {
      o.onEvento({ tipo: 'errore', messaggio: spiegaErrore(String(err)) })
      return resolve('errore')
    }

    let concluso = false
    let interrotto = false
    let bloccato = false
    let esitoFinale: EsitoTurno | null = null
    let stderr = ''
    const interpreta = creaInterprete(o.onEvento)

    const suInterruzione = () => {
      interrotto = true
      termina(figlio)
    }
    o.signal?.addEventListener('abort', suInterruzione, { once: true })
    if (o.signal?.aborted) suInterruzione()

    const timer = setTimeout(() => {
      o.onEvento({ tipo: 'errore', messaggio: `Claude Code non ha risposto entro ${Math.round(o.timeoutMs / 1000)} secondi.` })
      esitoFinale = 'errore'
      termina(figlio)
    }, o.timeoutMs)

    leggiRighe(figlio, (r) => {
      if (r.type === 'system' && r.subtype === 'init') {
        o.onSessioneAperta?.()
        const blocco = controllaInit(r, o.consentiApiAConsumo)
        if (blocco) {
          // Regola sui costi: mai usare chiavi API a consumo senza autorizzazione esplicita
          bloccato = true
          o.onEvento({ tipo: 'errore', messaggio: blocco })
          termina(figlio)
        }
        return
      }
      const esito = interpreta(r)
      if (esito && !esitoFinale) esitoFinale = esito
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
