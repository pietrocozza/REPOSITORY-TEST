// In che fase si trova Ambrogio: decide colori, animazioni ed etichette dell'interfaccia
export type Stato = 'pronto' | 'ascolto' | 'elaborazione' | 'lavoro' | 'conferma' | 'successo' | 'risposta'

export type Voce = { id: number; ruolo: 'user' | 'assistant'; testo: string; errore?: boolean }
