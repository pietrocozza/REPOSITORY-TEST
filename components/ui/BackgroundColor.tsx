'use client'

import { useEffect } from 'react'
import { motion, useMotionValue } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a: string, b: string, t: number) => {
  const A = hex(a)
  const B = hex(b)
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`
}

/**
 * Sfondo fisso dietro a tutta la pagina. Ogni sezione dichiara il suo colore con data-bg;
 * mentre scorri, il colore sfuma in modo continuo da una sezione alla successiva.
 */
export default function BackgroundColor() {
  const reduce = useRiduciMovimento()
  const bg = useMotionValue('#FFF4E0')

  useEffect(() => {
    let sezioni: { top: number; colore: string }[] = []
    const misura = () => {
      sezioni = [...document.querySelectorAll<HTMLElement>('[data-bg]')].map((el) => ({
        top: el.getBoundingClientRect().top + window.scrollY,
        colore: el.dataset.bg!,
      }))
    }
    const aggiorna = () => {
      if (!sezioni.length) return
      const vh = window.innerHeight
      const centro = window.scrollY + vh / 2
      let i = 0
      while (i < sezioni.length - 1 && sezioni[i + 1].top <= centro) i++
      const corrente = sezioni[i]
      const prossima = sezioni[i + 1]
      if (!prossima) return bg.set(corrente.colore)
      // la sfumatura avviene nell'ultimo tratto prima del confine
      const fascia = reduce ? 1 : vh * 0.22
      const t = Math.min(1, Math.max(0, (centro - (prossima.top - fascia)) / fascia))
      bg.set(t === 0 ? corrente.colore : mix(corrente.colore, prossima.colore, t))
    }
    misura()
    aggiorna()
    const ro = new ResizeObserver(() => {
      misura()
      aggiorna()
    })
    ro.observe(document.body)
    window.addEventListener('scroll', aggiorna, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', aggiorna)
    }
  }, [bg, reduce])

  return <motion.div aria-hidden="true" className="fixed inset-0 -z-10" style={{ backgroundColor: bg }} />
}
