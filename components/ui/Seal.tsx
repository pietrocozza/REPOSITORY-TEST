'use client'

import { useId, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

/**
 * "Adesivo" trascinabile: un sigillo rotondo con testo che gira.
 * Si può prendere con il mouse o con il dito; lasciato andare, torna al suo posto rimbalzando.
 */
export default function Seal({
  testo,
  centro,
  colore = '#1A1A1A',
  sfondo = '#FFF4E0',
  rotazione = -8,
  size = 132,
  className,
  label,
}: {
  testo: string
  centro: ReactNode
  colore?: string
  sfondo?: string
  rotazione?: number
  size?: number
  className?: string
  label: string
}) {
  const id = useId().replace(/:/g, '')
  const reduce = useRiduciMovimento()
  return (
    <motion.div
      data-cursor="grab"
      role="img"
      aria-label={label}
      className={`z-30 touch-none select-none ${className ?? ''}`}
      style={{ width: size, height: size, rotate: rotazione }}
      drag={!reduce}
      dragSnapToOrigin
      dragElastic={0.5}
      dragTransition={{ bounceStiffness: 380, bounceDamping: 9 }}
      whileHover={reduce ? undefined : { scale: 1.06, rotate: rotazione + 10 }}
      whileDrag={{ scale: 1.15, rotate: 0, cursor: 'grabbing' }}
      initial={{ scale: 0, rotate: rotazione - 60 }}
      whileInView={{ scale: 1, rotate: rotazione }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
    >
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-[0_10px_18px_rgba(26,26,26,0.18)]">
        <defs>
          <path id={`cerchio-${id}`} d="M100 100 m-72 0 a72 72 0 1 1 144 0 a72 72 0 1 1 -144 0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill={sfondo} />
        <circle cx="100" cy="100" r="88" fill="none" stroke={colore} strokeWidth="1" />
        <circle cx="100" cy="100" r="52" fill="none" stroke={colore} strokeWidth="1" />
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
          style={{ originX: '100px', originY: '100px' }}
        >
          <text fill={colore} fontSize="15" fontFamily="var(--font-sans)" fontWeight="600" letterSpacing="4.2">
            <textPath href={`#cerchio-${id}`}>{testo}</textPath>
          </text>
        </motion.g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{centro}</div>
    </motion.div>
  )
}
