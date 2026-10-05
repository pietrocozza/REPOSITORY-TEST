'use client'

import { motion, useScroll, useSpring, useTransform } from 'motion/react'

/** Barra di avanzamento dello scroll: una patatina sottile che si allunga */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const p = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 })
  const x = useTransform(p, (v) => `${(v - 1) * 100}%`)
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[5px] overflow-hidden">
      <motion.div className="relative h-full w-full" style={{ x }}>
        <div className="absolute inset-0 rounded-r-full bg-cheddar" />
        {/* puntina dorata della patatina */}
        <div className="absolute right-0 top-0 h-full w-6 rounded-r-full bg-pane" />
      </motion.div>
    </div>
  )
}
