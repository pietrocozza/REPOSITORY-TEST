'use client'

import { useLayoutEffect } from 'react'
import { scrollInCima } from '@/lib/scroll'

// Transizione tra le pagine: un sipario corallo si ritira verso l'alto e svela la nuova pagina.
// L'animazione è in CSS: la pagina si scopre anche se il JavaScript arriva tardi.
// Ogni pagina nuova riparte sempre dall'inizio.
export default function Template({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    if (window.location.hash) return
    scrollInCima()
  }, [])

  return (
    <>
      <div aria-hidden="true" className="sipario pointer-events-none fixed inset-0 z-[60] bg-corallo" />
      {children}
    </>
  )
}
