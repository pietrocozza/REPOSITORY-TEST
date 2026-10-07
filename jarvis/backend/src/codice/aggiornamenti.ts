import { execFile } from 'node:child_process'

// Gli aggiornamenti del codice di Jarvis, letti da git: servono alla sezione "Codice" dell'interfaccia,
// che li mostra mentre "si scrivono". Solo lettura: qui non si installa e non si modifica nulla.
// "In arrivo" = aggiornamenti già su GitHub ma non ancora scaricati con git pull: per vederli basta
// un "git fetch", che usa il login di GitHub già salvato sul PC (nessun token nel codice).

export type Aggiornamento = {
  sha: string
  breve: string
  data: string
  titolo: string
  /** la spiegazione in italiano scritta nel messaggio dell'aggiornamento */
  spiegazione: string
  inArrivo: boolean
}

export type Riga = { tipo: 'aggiunta' | 'tolta' | 'uguale' | 'salto'; testo: string; numero?: number }
export type FileCambiato = {
  percorso: string
  stato: 'nuovo' | 'modificato' | 'eliminato' | 'rinominato'
  aggiunte: number
  tolte: number
  /** vuoto se il file è binario o troppo grande da mostrare */
  righe: Riga[]
  nota?: string
}

const SEP_CAMPO = '\x1f'
const SEP_VOCE = '\x1e'
const MAX_RIGHE_FILE = 900
const MAX_RIGHE_TOTALI = 4000
// file generati automaticamente: non ha senso guardarli "scrivere"
const GENERATI = /(^|\/)(package-lock\.json|.*\.min\.(js|css)|.*\.ico|.*\.png|.*\.jpe?g)$/

export const shaValido = (s: string) => /^[0-9a-f]{7,40}$/.test(s)

export class Aggiornamenti {
  private cartella: string
  private ultimoControllo = 0
  private controlloInCorso: Promise<boolean> | null = null
  private esitoControllo: boolean | null = null

  constructor(cartella: string) {
    this.cartella = cartella
  }

  private git(argomenti: string[], timeoutMs = 10_000) {
    return new Promise<string>((risolvi, rifiuta) => {
      execFile(
        'git',
        ['-c', 'core.quotepath=off', '-c', 'color.ui=never', ...argomenti],
        {
          cwd: this.cartella,
          timeout: timeoutMs,
          maxBuffer: 32 * 1024 * 1024,
          windowsHide: true,
          // mai finestre o domande di password: se serve il login, il controllo semplicemente non riesce
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never', GIT_ASKPASS: '', LC_ALL: 'C' },
        },
        (err, stdout) => (err ? rifiuta(err) : risolvi(stdout)),
      )
    })
  }

  /** Chiede a GitHub se ci sono aggiornamenti nuovi (al massimo una volta al minuto). */
  private controllaGithub(): Promise<boolean> {
    if (this.controlloInCorso) return this.controlloInCorso
    if (Date.now() - this.ultimoControllo < 60_000 && this.esitoControllo !== null) return Promise.resolve(this.esitoControllo)
    this.controlloInCorso = this.git(['fetch', '--quiet', '--no-tags', '--no-recurse-submodules'], 25_000)
      .then(() => true)
      .catch(() => false)
      .then((ok) => {
        this.ultimoControllo = Date.now()
        this.esitoControllo = ok
        this.controlloInCorso = null
        return ok
      })
    return this.controlloInCorso
  }

  private async log(intervallo: string, inArrivo: boolean, n: number): Promise<Aggiornamento[]> {
    const formato = ['%H', '%h', '%aI', '%s', '%b'].join(SEP_CAMPO) + SEP_VOCE
    const uscita = await this.git(['log', `--format=${formato}`, '-n', String(n), intervallo, '--', '.'])
    return uscita
      .split(SEP_VOCE)
      .map((v) => v.replace(/^\s+/, ''))
      .filter(Boolean)
      .map((v) => {
        const [sha, breve, data, titolo, corpo = ''] = v.split(SEP_CAMPO)
        // le righe di firma in fondo non sono spiegazioni
        const spiegazione = unisciRighe(
          corpo
            .split('\n')
            .filter((r) => !/^(Co-Authored-By|Claude-Session|Signed-off-by):/i.test(r.trim()))
            .join('\n'),
        )
        return { sha, breve, data, titolo, spiegazione, inArrivo }
      })
  }

  /** Elenco degli aggiornamenti: prima quelli in arrivo da GitHub, poi gli ultimi installati. */
  async elenco(controlla = false) {
    try {
      await this.git(['rev-parse', '--is-inside-work-tree'])
    } catch {
      return { disponibile: false as const, motivo: 'Questa cartella non è collegata a git: non posso mostrare gli aggiornamenti.' }
    }
    const github = controlla ? await this.controllaGithub() : this.esitoControllo
    let inArrivo: Aggiornamento[] = []
    try {
      inArrivo = await this.log('HEAD..@{upstream}', true, 30)
    } catch {
      // ramo senza collegamento a GitHub: solo gli aggiornamenti installati
    }
    const installati = await this.log('HEAD', false, 30)
    const ramo = (await this.git(['rev-parse', '--abbrev-ref', 'HEAD']).catch(() => '')).trim()
    return { disponibile: true as const, ramo, github, inArrivo, installati }
  }

  /** Le modifiche di un aggiornamento, file per file. */
  async dettaglio(sha: string) {
    if (!shaValido(sha)) throw new Error('codice di aggiornamento non valido')
    // --relative: percorsi a partire dalla cartella di Jarvis; -M: riconosce i file rinominati
    const testo = await this.git(['show', '--format=', '--no-ext-diff', '-M', '-U3', '--relative', sha, '--', '.'])
    return { sha, file: leggiDiff(testo) }
  }
}

/** I messaggi degli aggiornamenti vanno a capo ogni ~70 lettere: qui si riuniscono le frasi, tenendo paragrafi ed elenchi. */
export function unisciRighe(testo: string) {
  return testo
    .split(/\n\s*\n/)
    .map((paragrafo) =>
      paragrafo
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .reduce((acc, r) => (!acc ? r : /^[-•*]\s/.test(r) ? `${acc}\n${r}` : `${acc} ${r}`), ''),
    )
    .filter(Boolean)
    .join('\n\n')
}

/** Trasforma l'uscita di "git show" (formato diff unificato) in file e righe. */
export function leggiDiff(testo: string): FileCambiato[] {
  const file: FileCambiato[] = []
  let attuale: FileCambiato | null = null
  let numero = 0
  let totale = 0
  let dentroBlocco = false

  const chiudi = () => {
    if (!attuale) return
    if (GENERATI.test(attuale.percorso) && attuale.righe.length) {
      attuale.righe = []
      attuale.nota = 'File generato automaticamente: non viene mostrato.'
    }
    file.push(attuale)
  }

  for (const riga of testo.split('\n')) {
    const testa = riga.match(/^diff --git a\/(.*) b\/(.*)$/)
    if (testa) {
      chiudi()
      attuale = { percorso: testa[2], stato: 'modificato', aggiunte: 0, tolte: 0, righe: [] }
      dentroBlocco = false
      continue
    }
    if (!attuale) continue
    if (!dentroBlocco) {
      if (riga.startsWith('new file mode')) attuale.stato = 'nuovo'
      else if (riga.startsWith('deleted file mode')) attuale.stato = 'eliminato'
      else if (riga.startsWith('rename to ')) attuale.stato = 'rinominato'
      else if (riga.startsWith('Binary files')) attuale.nota = 'File binario (immagine o simile): non viene mostrato.'
    }
    const blocco = riga.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/)
    if (blocco) {
      dentroBlocco = true
      numero = Number(blocco[1])
      if (attuale.righe.length) attuale.righe.push({ tipo: 'salto', testo: blocco[2].trim() })
      continue
    }
    if (!dentroBlocco || riga.startsWith('\\')) continue

    const segno = riga[0]
    const contenuto = riga.slice(1)
    if (segno === '+') attuale.aggiunte++
    else if (segno === '-') attuale.tolte++
    else if (segno !== ' ') continue

    if (attuale.righe.length >= MAX_RIGHE_FILE || totale >= MAX_RIGHE_TOTALI) {
      attuale.nota = 'Il resto del file è troppo lungo da mostrare.'
      continue
    }
    totale++
    if (segno === '+') attuale.righe.push({ tipo: 'aggiunta', testo: contenuto, numero: numero++ })
    else if (segno === '-') attuale.righe.push({ tipo: 'tolta', testo: contenuto })
    else attuale.righe.push({ tipo: 'uguale', testo: contenuto, numero: numero++ })
  }
  chiudi()
  return file
}
