'use client'

import { motion, useScroll, useSpring } from 'motion/react'

/** Sottile barra in cima allo schermo: mostra quanto della pagina hai letto e quanto manca alla fine */
export default function BarraScorrimento() {
  const { scrollYProgress } = useScroll()
  const avanzamento = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[3px] bg-inchiostro/10">
      <motion.div
        className="h-full origin-left rounded-r-full bg-gradient-to-r from-corallo to-sole shadow-[0_0_8px_rgba(217,72,31,0.45)]"
        style={{ scaleX: avanzamento }}
      />
    </div>
  )
}
