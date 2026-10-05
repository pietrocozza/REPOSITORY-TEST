// Menu del locale (inventato). Prezzi in euro.
// "foto" è il percorso dentro public/images/ (vedi README per le foto da fornire).

export type Prodotto = {
  id: string
  nome: string
  descrizione: string
  prezzo: number
  foto: string
  tipo: 'burger' | 'contorno'
}

export const BURGERS: Prodotto[] = [
  { id: 'peperino', nome: 'Il Peperino', descrizione: 'Doppio smash maremmano, pecorino fuso, salsa della casa.', prezzo: 11.5, foto: 'menu/burger-1.webp', tipo: 'burger' },
  { id: 'papale', nome: 'Il Papale', descrizione: 'Bacon, uovo, doppio formaggio. Senza mezze misure.', prezzo: 14, foto: 'menu/burger-2.webp', tipo: 'burger' },
  { id: 'cimino', nome: 'Il Cimino', descrizione: 'Nocciole dei Cimini, cipolla caramellata, pecorino.', prezzo: 13, foto: 'menu/burger-3.webp', tipo: 'burger' },
  { id: 'pellegrino', nome: 'Il Pellegrino', descrizione: 'Lattuga, pomodoro, bacon croccante. Il classico.', prezzo: 12, foto: 'menu/burger-4.webp', tipo: 'burger' },
  { id: 'macchina', nome: 'La Macchina', descrizione: 'Tre smash, tre formaggi. Solo per grandi appetiti.', prezzo: 16.5, foto: 'menu/burger-5.webp', tipo: 'burger' },
  { id: 'orto', nome: "L'Orto", descrizione: 'Burger di legumi, verdure, olio di Canino. Vegetariano.', prezzo: 11, foto: 'menu/burger-6.webp', tipo: 'burger' },
]

export const CONTORNI: Prodotto[] = [
  { id: 'patatine', nome: 'Patatine', descrizione: "Patate dell'Alto Viterbese, fritte due volte.", prezzo: 4.5, foto: 'menu/patatine.webp', tipo: 'contorno' },
  { id: 'anelli', nome: 'Anelli di cipolla', descrizione: 'Pastella croccante, cuore dolce.', prezzo: 5, foto: 'menu/anelli-cipolla.webp', tipo: 'contorno' },
]

export const PRODOTTI = [...BURGERS, ...CONTORNI]
export const trovaProdotto = (id: string) => PRODOTTI.find((p) => p.id === id)

/** Il panino protagonista (hero + panino che si apre) e quello della sezione 3 */
export const PROTAGONISTA = { id: 'peperino', foto: 'hero-burger.webp' }
export const SECONDO = {
  id: 'papale',
  foto: 'secondo-burger.webp',
  ingredienti: ['Bacon affumicato', 'Uovo al tegamino', 'Doppio pecorino'],
}

/** Zone di consegna a Viterbo (costi fittizi) */
export const ZONE = [
  { id: 'centro', nome: 'Centro storico', costo: 1.5 },
  { id: 'sanfaustino', nome: 'San Faustino / Pianoscarano', costo: 2 },
  { id: 'murialto', nome: 'Murialto / Ellera', costo: 2.5 },
  { id: 'santabarbara', nome: 'Santa Barbara / Villanova', costo: 3 },
  { id: 'laquercia', nome: 'La Quercia / Bagnaia', costo: 4 },
] as const

/** Sopra questa cifra la consegna è gratuita */
export const SOGLIA_CONSEGNA_GRATIS = 30

export const euro = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

// ───────── Calcoli (usati sia nel browser sia dalla route API) ─────────

export type Riga = { id: string; qty: number }

export const subtotale = (righe: Riga[]) => righe.reduce((s, r) => s + (trovaProdotto(r.id)?.prezzo ?? 0) * r.qty, 0)

export function costoConsegna(zonaId: string | undefined, sub: number) {
  if (sub >= SOGLIA_CONSEGNA_GRATIS) return 0
  return ZONE.find((z) => z.id === zonaId)?.costo ?? 0
}
