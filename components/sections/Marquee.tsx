'use client'

import { useRef } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

const wrap = (min: number, max: number, v: number) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

/** Una riga di testo che scorre all'infinito e accelera quando scorri veloce */
function Riga({ testo, velocita, className }: { testo: string; velocita: number; className: string }) {
  const reduce = useRiduciMovimento()
  const base = useMotionValue(0)
  const { scrollY } = useScroll()
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const fattore = useTransform(vel, [-1000, 0, 1000], [-4, 0, 4], { clamp: false })
  const x = useTransform(base, (v) => `${wrap(-25, 0, v)}%`)
  const direzione = useRef(1)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    let spostamento = direzione.current * velocita * (delta / 1000)
    // il verso segue la direzione dello scroll
    if (fattore.get() < 0) direzione.current = -1
    else if (fattore.get() > 0) direzione.current = 1
    spostamento += direzione.current * spostamento * Math.abs(fattore.get())
    base.set(base.get() + spostamento)
  })

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <motion.div className={`flex shrink-0 ${className}`} style={{ x }}>
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="block pr-8" aria-hidden={k > 0}>
            {testo}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export default function Marquee() {
  return (
    <section aria-label="Smash, Tuscia, brace, fatto a mano" data-bg="#FFC53D" className="relative z-10 overflow-hidden py-20 md:py-28">
      <div className="-rotate-2 scale-105 bg-nero py-4 text-crema md:py-6">
        <Riga
          testo="Smash ✦ Tuscia ✦ Brace ✦ Fatto a mano ✦ "
          velocita={-3}
          className="font-display text-5xl italic md:text-8xl"
        />
      </div>
      <div className="mt-6 rotate-1 md:mt-8">
        <Riga
          testo="Manzo maremmano — Pecorino della Tuscia — Nocciole dei Cimini — Olio di Canino — "
          velocita={2}
          className="eyebrow text-sm md:text-base"
        />
      </div>
    </section>
  )
}
