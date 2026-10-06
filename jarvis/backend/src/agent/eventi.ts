// Cosa il backend comunica all'interfaccia durante un turno di conversazione.
// Viaggiano come una riga JSON per evento (NDJSON) e fanno reagire l'animazione.

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
  /** un pezzo di testo della risposta */
  | { tipo: 'testo'; testo: string }
  /** cambio di stato: per esempio Claude sta usando uno strumento */
  | { tipo: 'stato'; stato: StatoAgente; strumento?: string; descrizione?: string }
  /** fine del turno */
  | { tipo: 'fine'; sessione: string; durataMs: number; strumentiUsati: string[] }
  /** errore spiegato in italiano */
  | { tipo: 'errore'; messaggio: string }
