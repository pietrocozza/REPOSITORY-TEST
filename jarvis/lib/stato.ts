// In che fase si trova Jarvis: decide colori, animazioni ed etichette dell'interfaccia
export type Stato = 'pronto' | 'ascolto' | 'elaborazione' | 'risposta'

export type Voce = { id: number; ruolo: 'user' | 'assistant'; testo: string; errore?: boolean }
