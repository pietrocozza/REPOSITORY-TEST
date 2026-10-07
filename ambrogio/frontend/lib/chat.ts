// Come l'interfaccia parla con l'agente.
// L'app invia il messaggio al backend locale (/api/chat), che usa Claude Code;
// la conversazione è ricordata dal backend, quindi qui basta mandare l'ultimo messaggio.
// La demo online usa un'altra implementazione con la stessa forma.

export type StatoAgente =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'WORKING'
  | 'WAITING_FOR_CONFIRMATION'
  | 'SUCCESS'
  | 'ERROR'

export type EventoAgente =
  | { tipo: 'testo'; testo: string }
  | { tipo: 'stato'; stato: StatoAgente; strumento?: string; descrizione?: string }
  | { tipo: 'fine'; sessione: string; durataMs: number; strumentiUsati: string[] }
  | { tipo: 'errore'; messaggio: string }
  | { tipo: 'conferma'; id: number; strumento: string; descrizione: string; livello: 2 | 3 }
  | { tipo: 'conferma-chiusa'; id: number; esito: 'concessa' | 'negata' | 'scaduta' }

export type RichiestaConferma = Extract<EventoAgente, { tipo: 'conferma' }>

export type Chiedi = (
  messaggio: string,
  opzioni: {
    onTesto: (pezzo: string) => void
    onStato?: (e: Extract<EventoAgente, { tipo: 'stato' }>) => void
    /** richieste di permesso e loro chiusura */
    onConferma?: (e: Extract<EventoAgente, { tipo: 'conferma' | 'conferma-chiusa' }>) => void
    signal: AbortSignal
  },
) => Promise<void>

export const chiediAlServer: Chiedi = async (messaggio, { onTesto, onStato, onConferma, signal }) => {
  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaggio }),
      signal,
    })
  } catch (err) {
    if (signal.aborted) throw err
    throw new Error('Il backend di Ambrogio non risponde. È acceso? (avvialo con: npm start)')
  }
  if (!res.ok || !res.body) {
    const dati = await res.json().catch(() => null)
    throw new Error(
      dati?.errore ?? (res.status >= 500 ? 'Il backend di Ambrogio non risponde. È acceso? (avvialo con: npm start)' : `Errore ${res.status}.`),
    )
  }

  // Una riga JSON per evento
  const lettore = res.body.getReader()
  const decoder = new TextDecoder()
  let resto = ''
  let errore: string | null = null
  const gestisci = (riga: string) => {
    if (!riga.trim()) return
    let e: EventoAgente
    try {
      e = JSON.parse(riga)
    } catch {
      return
    }
    if (e.tipo === 'testo') onTesto(e.testo)
    else if (e.tipo === 'stato') onStato?.(e)
    else if (e.tipo === 'errore') errore = e.messaggio
    else if (e.tipo === 'conferma' || e.tipo === 'conferma-chiusa') onConferma?.(e)
  }
  for (;;) {
    const { done, value } = await lettore.read()
    if (done) break
    const righe = (resto + decoder.decode(value, { stream: true })).split('\n')
    resto = righe.pop() ?? ''
    righe.forEach(gestisci)
  }
  gestisci(resto + decoder.decode())
  if (errore) throw new Error(errore)
}

/** Stato del backend e di Claude Code (per avvisare se manca il login, ecc.) */
export type StatoBackend = { ok: boolean; controlli: { nome: string; ok: boolean; dettaglio: string; aiuto?: string }[] }

export async function leggiStatoBackend(): Promise<StatoBackend | null> {
  try {
    const res = await fetch('/api/stato', { cache: 'no-store' })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export async function nuovaConversazione() {
  await fetch('/api/conversazione/nuova', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
}

/** Personalità di Ambrogio (decide il modo di parlare; vive nel backend) */
export type Personalita = { id: string; nome: string; descrizione: string }
export type ImpostazioniAgente = { personalita: string; personalitaDisponibili: Personalita[] }

export async function impostazioniAgente(personalita?: string): Promise<ImpostazioniAgente | null> {
  try {
    const res = await fetch(
      '/api/impostazioni',
      personalita ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personalita }) } : { cache: 'no-store' },
    )
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

// ───────── Memoria, pratiche, registro, permessi ─────────

export type MessaggioSalvato = { id: number; ruolo: 'user' | 'assistant'; testo: string; creato: string }
export type Memoria = { id: number; tipo: string; titolo: string; contenuto: string; aggiornata: string }
export type Pratica = { id: number; titolo: string; descrizione: string; stato: 'aperta' | 'in_attesa' | 'chiusa'; note: string; aggiornata: string }
export type VoceRegistro = { id: number; quando: string; tipo: string; descrizione: string }
export type Autorizzazione = { id: number; strumento: string; descrizione: string; livello: 2 | 3 }

async function leggi<T>(percorso: string): Promise<T | null> {
  try {
    const res = await fetch(percorso, { cache: 'no-store' })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

async function invia(percorso: string, metodo: 'POST' | 'DELETE', corpo?: object) {
  try {
    const res = await fetch(percorso, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo ?? {}) })
    return res.ok
  } catch {
    return false
  }
}

export const caricaConversazione = () => leggi<{ sessione: string; messaggi: MessaggioSalvato[] }>('/api/conversazione')
export const caricaMemorie = () => leggi<{ memorie: Memoria[] }>('/api/memorie')
export const cancellaMemoria = (id: number) => invia(`/api/memorie/${id}`, 'DELETE')
export const caricaPratiche = () => leggi<{ pratiche: Pratica[] }>('/api/pratiche')
export const caricaRegistro = () => leggi<{ voci: VoceRegistro[] }>('/api/registro')
export const caricaAutorizzazioni = () =>
  leggi<{ inAttesa: Autorizzazione[]; permanenti: { strumento: string; concesso: string }[] }>('/api/autorizzazioni')
export const decidiAutorizzazione = (id: number, concedi: boolean, sempre = false) =>
  invia(`/api/autorizzazioni/${id}`, 'POST', { decisione: concedi ? 'concedi' : 'nega', sempre })
export const revocaPermesso = (strumento: string) => invia(`/api/permessi/${strumento}`, 'DELETE')

// ───────── Codice: gli aggiornamenti di Ambrogio ─────────

export type Aggiornamento = { sha: string; breve: string; data: string; titolo: string; spiegazione: string; inArrivo: boolean }
export type RigaCodice = { tipo: 'aggiunta' | 'tolta' | 'uguale' | 'salto'; testo: string; numero?: number }
export type FileCambiato = {
  percorso: string
  stato: 'nuovo' | 'modificato' | 'eliminato' | 'rinominato'
  aggiunte: number
  tolte: number
  righe: RigaCodice[]
  nota?: string
}
export type ElencoAggiornamenti =
  | { disponibile: false; motivo: string }
  | { disponibile: true; ramo: string; github: boolean | null; inArrivo: Aggiornamento[]; installati: Aggiornamento[] }

/** controlla = chiedi anche a GitHub se ci sono aggiornamenti nuovi */
export const caricaAggiornamenti = (controlla = false) => leggi<ElencoAggiornamenti>(`/api/codice${controlla ? '?controlla=1' : ''}`)
export const caricaModifiche = (sha: string) => leggi<{ sha: string; file: FileCambiato[] }>(`/api/codice/${sha}`)

// ───────── Voce di Ambrogio con Gemini ─────────

export type StatoVoce = {
  /** chi presta la voce ad Ambrogio: ElevenLabs, Gemini o nessuno (allora parla Edge) */
  fornitore: 'elevenlabs' | 'gemini' | null
  disponibile: boolean
  /** Gemini con pagamento a consumo: nessun limite giornaliero */
  pagamento?: boolean
  problema?: string | null
  voci: { id: string; descrizione: string; clonata?: boolean }[]
  sospesaFinoA: string | null
  crediti?: { usati: number; limite: number; rinnovo: string | null } | null
}
export const caricaStatoVoce = () => leggi<StatoVoce>('/api/voce')
