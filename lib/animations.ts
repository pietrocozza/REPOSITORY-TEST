// Valori delle animazioni raccolti in un unico posto:
// cambiandoli qui cambia il "carattere" di tutto il sito.

/** Curve di andamento (easing) */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const
/** Curva con "rimbalzo oltre il bersaglio", stile cartone animato */
export const EASE_BACK = [0.34, 1.56, 0.64, 1] as const

/** Molle (spring) */
export const SPRING_BOUNCY = { type: 'spring', stiffness: 420, damping: 14, mass: 0.8 } as const
export const SPRING_SOFT = { type: 'spring', stiffness: 160, damping: 22 } as const
export const SPRING_SCROLL = { stiffness: 260, damping: 20, mass: 0.6 } as const
export const SPRING_CURSOR_RING = { stiffness: 350, damping: 28, mass: 0.6 } as const
export const SPRING_MAGNET = { stiffness: 220, damping: 15, mass: 0.4 } as const

/** Durate */
export const DURATION = {
  fast: 0.25,
  base: 0.6,
  slow: 1,
} as const

/** Schermata di caricamento: tempi in secondi (totale ≤ 2,5 s) */
export const PRELOADER = {
  countDuration: 1.75,
  winkAt: 1.8,
  biteAt: 2.0,
  biteDuration: 0.45,
  reducedDuration: 0.5,
} as const

/** Panino esploso: come si divide lo scroll della sezione (da 0 a 1) */
export const EXPLODE = {
  start: 0.06, // il panino resta chiuso fino a qui
  stagger: 0.065, // ritardo tra uno strato e il successivo
  layerDuration: 0.14, // quanto impiega ogni strato a raggiungere la posizione
  recombineStart: 0.86, // da qui gli strati tornano a chiudersi
  recombineEnd: 0.97,
  overshoot: 1.18, // quanto supera la posizione finale prima di rimbalzare
  undershoot: 0.94,
} as const

/** Rivelazione delle sezioni quando entrano nello schermo */
export const VIEWPORT_ONCE = { once: true, margin: '-12% 0px -12% 0px' } as const
