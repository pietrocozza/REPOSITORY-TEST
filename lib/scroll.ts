'use client'

import type Lenis from 'lenis'

// Istanza di Lenis condivisa: la crea il Providers, la usano link e pulsanti.
let lenis: Lenis | null = null
export const setLenis = (l: Lenis | null) => {
  lenis = l
}
export const getLenis = () => lenis

/** Scorre in modo fluido fino alla sezione con quell'id */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) {
    lenis.scrollTo(el, { offset: -8, duration: 1.4 })
  } else {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }
  // sposta anche il focus, per chi naviga con la tastiera o lo screen reader
  el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}
