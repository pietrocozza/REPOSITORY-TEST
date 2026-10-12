'use client'

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useState } from 'react'

const RAGGIO = 19
const CIRCONFERENZA = 2 * Math.PI * RAGGIO

/** Cerchietto in basso a sinistra che si riempie mentre scorri: dice quanto manca alla fine. Toccandolo torni su */
export default function BarraScorrimento() {
  const { scrollYProgress } = useScroll()
  const avanzamento = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  const tratto = useTransform(avanzamento, (v) => CIRCONFERENZA * (1 - v))
  const [percento, setPercento] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPercento(Math.round(v * 100)))
  const visibile = percento > 3

  return (
    <motion.button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={`Hai letto il ${percento}% della pagina. Torna su`}
      className="fixed bottom-5 left-4 z-40 flex size-12 items-center justify-center rounded-full bg-white/90 text-inchiostro shadow-[0_10px_30px_-10px_rgba(29,34,54,0.5)] backdrop-blur md:bottom-6 md:left-6 md:size-14"
      initial={false}
      animate={{ opacity: visibile ? 1 : 0, scale: visibile ? 1 : 0.6, pointerEvents: visibile ? 'auto' : 'none' }}
      transition={{ duration: 0.3 }}
    >
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={RAGGIO} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
        <motion.circle cx="22" cy="22" r={RAGGIO} fill="none" stroke="#d9481f" strokeWidth="3" strokeLinecap="round" strokeDasharray={CIRCONFERENZA} style={{ strokeDashoffset: tratto }} />
      </svg>
      <span className="font-display text-xs font-bold tabular-nums md:text-sm">{percento}%</span>
    </motion.button>
  )
}
