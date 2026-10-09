'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'

function Parola({ parola, progresso, da, a }: { parola: string; progresso: MotionValue<number>; da: number; a: number }) {
  const opacita = useTransform(progresso, [da, a], [0.14, 1])
  return (
    <motion.span style={{ opacity: opacita }} className="inline">
      {parola}{' '}
    </motion.span>
  )
}

/** Frase che si "accende" parola per parola mentre scorri la pagina */
export default function TestoAScorrimento({ testo, className = '' }: { testo: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const parole = testo.split(' ')
  return (
    <p ref={ref} className={className} aria-label={testo}>
      <span aria-hidden="true">
        {parole.map((p, i) => (
          <Parola key={i} parola={p} progresso={scrollYProgress} da={i / parole.length} a={(i + 1) / parole.length} />
        ))}
      </span>
    </p>
  )
}
