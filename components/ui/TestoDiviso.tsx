'use client'

import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

/**
 * Titolo che entra parola per parola, ognuna da sotto una "maschera".
 * Le parole tra *asterischi* vanno in corsivo terracotta.
 */
export default function TestoDiviso({
  testo,
  className,
  as = 'h2',
  ritardo = 0,
  subito = false,
  accento = 'text-terracotta',
}: {
  testo: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
  ritardo?: number
  /** anima al caricamento invece che all'ingresso nello schermo */
  subito?: boolean
  accento?: string
}) {
  const Tag = as
  // ogni parola sa se cade dentro un tratto *in corsivo*
  const parole: { testo: string; corsivo: boolean }[] = []
  let dentro = false
  for (const p of testo.split(' ')) {
    if (p.startsWith('*')) dentro = true
    parole.push({ testo: p.replaceAll('*', ''), corsivo: dentro })
    if (p.endsWith('*')) dentro = false
  }
  const trigger = subito
    ? { animate: 'visibile' as const }
    : { whileInView: 'visibile' as const, viewport: { once: true, margin: '0px 0px -10% 0px' } }

  return (
    <Tag className={className} aria-label={testo.replaceAll('*', '')}>
      <motion.span aria-hidden="true" initial="nascosto" {...trigger} transition={{ staggerChildren: 0.06, delayChildren: ritardo }} className="inline">
        {parole.map((p, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
            <motion.span
              className={`inline-block ${p.corsivo ? `italic ${accento}` : ''}`}
              variants={{ nascosto: { y: '110%', rotate: 4 }, visibile: { y: '0%', rotate: 0 } }}
              transition={{ duration: 1.1, ease: EASE_LUSSO }}
            >
              {p.testo}
            </motion.span>
            {i < parole.length - 1 && '\u00A0'}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
