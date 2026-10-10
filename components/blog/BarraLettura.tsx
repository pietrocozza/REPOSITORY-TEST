'use client'

import { motion, useScroll } from 'motion/react'

/** Barra in cima che si riempie mentre leggi l'articolo */
export default function BarraLettura() {
  const { scrollYProgress } = useScroll()
  return <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[55] h-1 origin-left bg-corallo" style={{ scaleX: scrollYProgress }} />
}
