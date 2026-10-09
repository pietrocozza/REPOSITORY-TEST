'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useSpring } from 'motion/react'
import { SPRING_MAGNETE } from '@/lib/animazioni'
import { useRiduciMovimento } from '@/lib/hooks'

/** Quando il cursore si avvicina, l'elemento si sposta leggermente verso di lui */
export default function Magnete({ children, forza = 0.3, className }: { children: ReactNode; forza?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const riduci = useRiduciMovimento()
  const x = useSpring(0, SPRING_MAGNETE)
  const y = useSpring(0, SPRING_MAGNETE)

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ''}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (riduci || e.pointerType !== 'mouse' || !ref.current) return
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
