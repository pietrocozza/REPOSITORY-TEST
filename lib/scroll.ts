'use client'

import type Lenis from 'lenis'

// Istanza di Lenis condivisa: la crea Providers, la usano menu e pulsanti.
let lenis: Lenis | null = null
export const setLenis = (l: Lenis | null) => {
  lenis = l
}
export const getLenis = () => lenis

/** Torna in cima alla pagina (usato al cambio pagina) */
export function scrollInCima() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}

/** Ferma / riattiva lo scroll (menu a tutto schermo aperto) */
export function bloccaScroll(blocca: boolean) {
  if (lenis) {
    if (blocca) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = blocca ? 'hidden' : ''
}
