// Gli strati del panino che si apre, dall'alto verso il basso.
// Ogni foto (public/images/strati/…) è larga il doppio di quanto è alta (es. 1600×800),
// con l'ingrediente centrato e lo sfondo trasparente.
// "spessore" = quanto è alto l'ingrediente nella foto, rispetto alla larghezza dell'immagine:
// serve per impilare gli strati quando il panino è chiuso. Se con le foto vere gli strati
// risultano troppo distanti o sovrapposti, si regola solo questo numero.

export type Strato = {
  id: string
  foto: string
  testo: string
  spessore: number
  /** tinta del segnaposto finché la foto non c'è */
  tinta: [string, string]
  forma: 'cupola' | 'base' | 'disco' | 'foglia' | 'fetta'
}

export const STRATI: Strato[] = [
  { id: 'pane-sopra', foto: 'strati/pane-sopra.webp', testo: 'Pane al burro, tostato', spessore: 0.25, tinta: ['#d18a3a', '#7a4517'], forma: 'cupola' },
  { id: 'lattuga', foto: 'strati/lattuga.webp', testo: 'Lattuga croccante', spessore: 0.05, tinta: ['#9bc46a', '#3f6b25'], forma: 'foglia' },
  { id: 'pomodoro', foto: 'strati/pomodoro.webp', testo: 'Pomodoro di stagione', spessore: 0.045, tinta: ['#ef5a3a', '#8e1d10'], forma: 'fetta' },
  { id: 'cipolla', foto: 'strati/cipolla.webp', testo: 'Cipolla caramellata', spessore: 0.035, tinta: ['#e4b98a', '#8a5a33'], forma: 'fetta' },
  { id: 'formaggio', foto: 'strati/formaggio.webp', testo: 'Pecorino della Tuscia', spessore: 0.04, tinta: ['#ffc95a', '#c47a0c'], forma: 'fetta' },
  { id: 'carne', foto: 'strati/carne.webp', testo: 'Manzo maremmano, 180 g', spessore: 0.1, tinta: ['#6b3a22', '#2a140b'], forma: 'disco' },
  { id: 'bacon', foto: 'strati/bacon.webp', testo: 'Bacon affumicato', spessore: 0.04, tinta: ['#c4553a', '#5e1d12'], forma: 'foglia' },
  { id: 'pane-sotto', foto: 'strati/pane-sotto.webp', testo: 'Pane lievitato 48 ore', spessore: 0.11, tinta: ['#c9812e', '#6d3d12'], forma: 'base' },
]

/** Posizione verticale (in frazione della larghezza) del centro di ogni strato, panino chiuso */
export const centriChiusi = (() => {
  const SOVRAPPOSIZIONE = 0.012
  let y = 0
  return STRATI.map((s) => {
    const c = y + s.spessore / 2
    y += s.spessore - SOVRAPPOSIZIONE
    return c
  })
})()

/** Altezza totale del panino chiuso (frazione della larghezza) */
export const ALTEZZA_CHIUSO = STRATI.reduce((s, x) => s + x.spessore, 0) - 0.012 * (STRATI.length - 1)
