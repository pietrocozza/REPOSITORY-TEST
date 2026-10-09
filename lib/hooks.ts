'use client'

import { useSyncExternalStore } from 'react'

/** Vero se la media query è soddisfatta (es. schermo piccolo, dispositivo touch) */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

export const usePuntatoreFine = () => useMediaQuery('(hover: hover) and (pointer: fine)')

/**
 * "Riduci movimento" attivo nelle impostazioni del dispositivo.
 * Durante il primo disegno vale sempre false (come sul server), poi si aggiorna.
 */
export const useRiduciMovimento = () => useMediaQuery('(prefers-reduced-motion: reduce)')
