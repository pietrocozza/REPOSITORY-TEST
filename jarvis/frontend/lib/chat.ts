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

export type Chiedi = (
  messaggio: string,
  opzioni: { onTesto: (pezzo: string) => void; onStato?: (e: Extract<EventoAgente, { tipo: 'stato' }>) => void; signal: AbortSignal },
) => Promise<void>

export const chiediAlServer: Chiedi = async (messaggio, { onTesto, onStato, signal }) => {
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
    throw new Error('Il backend di Jarvis non risponde. È acceso? (avvialo con: npm start)')
  }
  if (!res.ok || !res.body) {
    const dati = await res.json().catch(() => null)
    throw new Error(
      dati?.errore ?? (res.status >= 500 ? 'Il backend di Jarvis non risponde. È acceso? (avvialo con: npm start)' : `Errore ${res.status}.`),
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
