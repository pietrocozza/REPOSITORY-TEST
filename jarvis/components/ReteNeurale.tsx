'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { creaReteNeurale, type ReteNeurale as Rete } from '@/lib/rete-neurale'
import type { Stato } from '@/lib/stato'

// Collega il motore 3D (lib/rete-neurale.ts) all'interfaccia React
export default function ReteNeurale({ stato, livelloRef }: { stato: Stato; livelloRef: RefObject<number> }) {
  const contenitore = useRef<HTMLDivElement>(null)
  const rete = useRef<Rete | null>(null)

  useEffect(() => {
    const el = contenitore.current
    if (!el) return
    let r: Rete
    try {
      r = creaReteNeurale(el)
    } catch {
      el.dataset.senzaWebgl = 'true' // WebGL non disponibile: resta lo sfondo
      return
    }
    rete.current = r
    // il volume della voce arriva a ogni fotogramma
    let raf = 0
    const ciclo = () => {
      r.setLivello(livelloRef.current ?? 0)
      raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    return () => {
      cancelAnimationFrame(raf)
      r.distruggi()
      rete.current = null
    }
  }, [livelloRef])

  useEffect(() => {
    rete.current?.setStato(stato)
  }, [stato])

  return <div ref={contenitore} className="scena" aria-hidden="true" />
}
