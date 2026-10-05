// ⚠️ PLACEHOLDER: tutti i dati qui sotto sono INVENTATI.
// Il locale non esiste: sostituisci indirizzo, telefono, email e orari con quelli reali.

export const INFO = {
  nome: 'Brace & Peperino',
  payoff: 'Smash burger nel cuore della Tuscia',
  // PLACEHOLDER: indirizzo fittizio
  indirizzo: 'Via dei Pellegrini Immaginari 00',
  citta: '01100 Viterbo (VT)',
  quartiere: 'Quartiere medievale di San Pellegrino',
  // PLACEHOLDER: numero fittizio
  telefono: '+39 0761 000 000',
  telefonoHref: 'tel:+390761000000',
  // PLACEHOLDER: email fittizia (dominio .example, non riceve posta)
  email: 'ciao@braceepeperino.example',
  // PLACEHOLDER: profili social fittizi
  social: [
    { nome: 'Instagram', href: '#', handle: '@braceepeperino' },
    { nome: 'TikTok', href: '#', handle: '@braceepeperino' },
    { nome: 'Facebook', href: '#', handle: 'Brace & Peperino' },
  ],
} as const

// PLACEHOLDER: orari fittizi
export const ORARI = [
  { giorni: 'Lunedì', orario: 'Chiuso (la piastra riposa)' },
  { giorni: 'Martedì – Venerdì', orario: '12:30–14:30 · 19:00–23:30' },
  { giorni: 'Sabato – Domenica', orario: '12:00–15:00 · 19:00–00:00' },
] as const

/** Fasce orarie per la consegna, tutte dentro l'orario di apertura */
export const FASCE_CONSEGNA = [
  '12:30–13:00',
  '13:00–13:30',
  '13:30–14:00',
  '14:00–14:30',
  '19:00–19:30',
  '19:30–20:00',
  '20:00–20:30',
  '20:30–21:00',
  '21:00–21:30',
  '21:30–22:00',
  '22:00–22:30',
  '22:30–23:00',
] as const
