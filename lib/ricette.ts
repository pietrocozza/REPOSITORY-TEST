// Ricette dei panini 3D: gli strati dall'alto verso il basso.
// Ogni strato è un ingrediente modellato in 3D nel codice (components/three/ingredienti.tsx).

export type Ingrediente =
  | 'paneSopra'
  | 'lattuga'
  | 'pomodoro'
  | 'cipolla'
  | 'formaggio'
  | 'carne'
  | 'vegetale'
  | 'bacon'
  | 'uovo'
  | 'nocciole'
  | 'salsa'
  | 'paneSotto'

/** Spessore di ogni ingrediente (unità 3D: il pane è largo 2) */
export const SPESSORE: Record<Ingrediente, number> = {
  paneSopra: 0.66,
  lattuga: 0.07,
  pomodoro: 0.09,
  cipolla: 0.06,
  formaggio: 0.05,
  carne: 0.3,
  vegetale: 0.3,
  bacon: 0.07,
  uovo: 0.12,
  nocciole: 0.07,
  salsa: 0.04,
  paneSotto: 0.34,
}

export const RICETTE: Record<string, Ingrediente[]> = {
  peperino: ['paneSopra', 'lattuga', 'pomodoro', 'formaggio', 'carne', 'formaggio', 'carne', 'salsa', 'paneSotto'],
  papale: ['paneSopra', 'uovo', 'bacon', 'formaggio', 'carne', 'formaggio', 'carne', 'salsa', 'paneSotto'],
  cimino: ['paneSopra', 'nocciole', 'cipolla', 'formaggio', 'carne', 'salsa', 'paneSotto'],
  pellegrino: ['paneSopra', 'lattuga', 'pomodoro', 'cipolla', 'bacon', 'carne', 'paneSotto'],
  macchina: ['paneSopra', 'formaggio', 'carne', 'formaggio', 'carne', 'formaggio', 'carne', 'bacon', 'paneSotto'],
  orto: ['paneSopra', 'lattuga', 'pomodoro', 'cipolla', 'vegetale', 'salsa', 'paneSotto'],
}

/** Il panino che si apre nella prima sezione, con la scritta accanto a ogni strato */
export const APERTO: { ingrediente: Ingrediente; testo: string }[] = [
  { ingrediente: 'paneSopra', testo: 'Pane al burro, tostato' },
  { ingrediente: 'lattuga', testo: 'Lattuga croccante' },
  { ingrediente: 'pomodoro', testo: 'Pomodoro di stagione' },
  { ingrediente: 'cipolla', testo: 'Cipolla caramellata' },
  { ingrediente: 'formaggio', testo: 'Pecorino della Tuscia' },
  { ingrediente: 'carne', testo: 'Manzo maremmano, 180 g' },
  { ingrediente: 'bacon', testo: 'Bacon affumicato' },
  { ingrediente: 'paneSotto', testo: 'Pane lievitato 48 ore' },
]

const SOVRAPPOSIZIONE = 0.015

/** Altezza (base) di ogni strato con il panino chiuso, partendo dal pane di sotto */
export function altezzeChiuse(strati: Ingrediente[]) {
  const y: number[] = new Array(strati.length)
  let acc = 0
  for (let i = strati.length - 1; i >= 0; i--) {
    y[i] = acc
    acc += SPESSORE[strati[i]] - SOVRAPPOSIZIONE
  }
  return { y, totale: acc + SOVRAPPOSIZIONE }
}
