'use client'

import { AnimatePresence, motion } from 'motion/react'
import { LAYERS, Layer, overlapMargin, type LayerId } from './layers'
import { useRiduciMovimento } from '@/lib/hooks'

/**
 * Panino illustrato composto dagli strati indicati (dall'alto verso il basso).
 * - "separa": distanza in px tra gli strati (0 = chiuso), per l'effetto hover
 * - quando la ricetta cambia, gli strati nuovi cadono dall'alto e quelli tolti volano via
 */
export default function Burger({
  strati,
  separa = 0,
  className,
  label,
}: {
  strati: LayerId[]
  separa?: number
  className?: string
  label?: string
}) {
  const reduce = useRiduciMovimento()
  const visti: Record<string, number> = {}
  const chiavi = strati.map((id) => {
    visti[id] = (visti[id] ?? 0) + 1
    return `${id}-${visti[id]}`
  })
  const centro = (strati.length - 1) / 2

  return (
    <div
      // label="" = illustrazione decorativa, ignorata dagli screen reader
      role={label === '' ? undefined : 'img'}
      aria-hidden={label === '' ? true : undefined}
      aria-label={label === '' ? undefined : (label ?? `Panino con ${strati.map((s) => LAYERS[s].nome.toLowerCase()).join(', ')}`)}
      className={`relative flex flex-col ${className ?? ''}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {strati.map((id, i) => (
          <motion.div
            key={chiavi[i]}
            layout={!reduce}
            className="relative"
            style={{ marginTop: overlapMargin(id, i === 0), zIndex: strati.length - i }}
            initial={reduce ? { opacity: 0 } : { y: -90, opacity: 0, scaleY: 1.2 }}
            animate={{ y: (i - centro) * separa, opacity: 1, scaleY: 1, rotate: separa ? (i % 2 ? 2 : -2) * (separa / 10) : 0 }}
            exit={reduce ? { opacity: 0 } : { x: i % 2 ? 80 : -80, y: -30, opacity: 0, rotate: i % 2 ? 25 : -25, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 360, damping: 15, mass: 0.7 }}
          >
            <Layer id={id} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
