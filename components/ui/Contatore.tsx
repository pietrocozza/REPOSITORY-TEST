'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

/** Numero che conta da 0 al valore quando entra nello schermo */
export default function Contatore({ a, prefisso = '', suffisso = '', durata = 2.2 }: { a: number; prefisso?: string; suffisso?: string; durata?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visto = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const riduci = useRiduciMovimento()
  const [valore, setValore] = useState(0)

  useEffect(() => {
    if (!visto || riduci) return
    const c = animate(0, a, { duration: durata, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValore(Math.round(v)) })
    return () => c.stop()
  }, [visto, riduci, a, durata])

  return (
    <span ref={ref} aria-label={`${prefisso}${a}${suffisso}`}>
      <span aria-hidden="true">
        {prefisso}
        {riduci ? a : valore}
        {suffisso}
      </span>
    </span>
  )
}
