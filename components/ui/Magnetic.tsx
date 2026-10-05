'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useSpring } from 'motion/react'
import { SPRING_MAGNET } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

/** Avvolge un pulsante: quando il cursore si avvicina, il pulsante si sposta leggermente verso di lui */
export default function Magnetic({ children, forza = 0.35, className }: { children: ReactNode; forza?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useRiduciMovimento()
  const x = useSpring(0, SPRING_MAGNET)
  const y = useSpring(0, SPRING_MAGNET)

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ''}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse' || !ref.current) return
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * forza)
        y.set((e.clientY - (r.top + r.height / 2)) * forza)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}
