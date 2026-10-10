'use client'

import { useSyncExternalStore } from 'react'

// Consenso ai cookie pubblicitari (Google Ads), salvato nel browser del visitatore.
// Senza un ID Google Ads configurato il sito non usa cookie e il banner non compare.

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? ''
export const GOOGLE_ADS_CONVERSIONE = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSIONE ?? ''

export type Consenso = 'si' | 'no' | null

const CHIAVE = 'consenso-cookie'
const EVENTO = 'consenso-cookie'

function leggi(): Consenso {
  try {
    const v = localStorage.getItem(CHIAVE)
    return v === 'si' || v === 'no' ? v : null
  } catch {
    return null
  }
}

export function salvaConsenso(v: Exclude<Consenso, null>) {
  try {
    localStorage.setItem(CHIAVE, v)
  } catch {
    // archivio non disponibile (es. navigazione privata): vale solo per questa visita
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: v }))
}

/** Riapre il banner per cambiare scelta */
export function riapriConsenso() {
  try {
    localStorage.removeItem(CHIAVE)
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO))
}

/** Scelta del visitatore: null finché non ha risposto (e sempre null durante il primo disegno) */
export function useConsenso(): Consenso | undefined {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(EVENTO, cb)
      window.addEventListener('storage', cb)
      return () => {
        window.removeEventListener(EVENTO, cb)
        window.removeEventListener('storage', cb)
      }
    },
    leggi,
    () => undefined,
  )
}
