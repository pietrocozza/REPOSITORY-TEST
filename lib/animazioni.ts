// Curve e tempi condivisi: tutto il sito si muove con lo stesso "respiro"
export const EASE_LUSSO = [0.22, 1, 0.36, 1] as const // uscita morbida, lunga
export const EASE_SIPARIO = [0.76, 0, 0.24, 1] as const // ingresso e uscita decisi

export const DURATA = { breve: 0.5, media: 0.9, lunga: 1.3 } as const

export const SPRING_MAGNETE = { stiffness: 220, damping: 18, mass: 0.4 } as const
