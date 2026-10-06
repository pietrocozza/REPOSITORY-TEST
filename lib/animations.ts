// Valori delle animazioni in un unico posto.

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

/** Molle morbide, senza rimbalzi */
export const SPRING_MORBIDA = { stiffness: 120, damping: 26, mass: 0.9 } as const
export const SPRING_TILT = { stiffness: 140, damping: 18, mass: 0.6 } as const
export const SPRING_CURSOR = { stiffness: 350, damping: 30, mass: 0.6 } as const
export const SPRING_MAGNET = { stiffness: 220, damping: 18, mass: 0.4 } as const

/** Schermata di caricamento (secondi, totale ≤ 1,5) */
export const PRELOADER = { riempimento: 1.05, dissolvenza: 0.4, ridotta: 0.4 } as const

/**
 * Hero + panino che si apre: come si divide lo scroll della sezione (0 → 1).
 * La sezione è alta 350vh: i primi istanti sono la hero, poi il panino si apre e si richiude.
 */
export const APERTURA = {
  heroFine: 0.1, // titolo e pulsante escono, il panino si prepara ad aprirsi
  inizio: 0.12, // il primo strato inizia a staccarsi
  sfasamento: 0.045, // ritardo tra uno strato e il successivo
  durata: 0.2, // quanto impiega ogni strato ad aprirsi
  chiusuraInizio: 0.8,
  chiusuraFine: 0.92,
  pulsante: 0.9, // da qui compare "Lo voglio"
} as const

export const VIEWPORT_ONCE = { once: true, margin: '-10% 0px -10% 0px' } as const
