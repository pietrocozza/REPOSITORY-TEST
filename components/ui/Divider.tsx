'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

/**
 * Divisori tra le sezioni:
 * - "colata": salsa che cola dal bordo e si allunga con lo scroll
 * - "morso": bordo morsicato, i morsi si allargano con lo scroll
 * Il colore è quello della sezione precedente, che "invade" la successiva.
 */
export default function Divider({ variante, colore }: { variante: 'colata' | 'morso'; colore: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useRiduciMovimento()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.35'] })
  const allunga = useTransform(scrollYProgress, [0, 1], [0.15, 1])
  const morso = useTransform(scrollYProgress, [0, 1], [0.2, 1])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none relative z-10 -mb-px h-0">
      {variante === 'colata' ? (
        <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[80px] w-full md:h-[150px]">
          <rect width="1440" height="24" fill={colore} />
          {[
            [60, 50, 90],
            [210, 34, 60],
            [330, 60, 140],
            [520, 40, 70],
            [690, 70, 120],
            [880, 36, 50],
            [1010, 56, 150],
            [1190, 44, 80],
            [1340, 64, 110],
          ].map(([x, w, h], k) => (
            <motion.path
              key={k}
              d={`M${x - w / 2} 20 C${x - w / 2} ${h * 0.6}, ${x - w / 3} ${h}, ${x} ${h} C${x + w / 3} ${h}, ${x + w / 2} ${h * 0.6}, ${x + w / 2} 20 Z`}
              fill={colore}
              style={{ scaleY: reduce ? 1 : allunga, originY: '0px' }}
            />
          ))}
        </svg>
      ) : (
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[50px] w-full md:h-[80px]">
          <defs>
            <mask id={`morso-${colore.slice(1)}`}>
              <rect width="1440" height="90" fill="white" />
              {Array.from({ length: 13 }, (_, k) => (
                <motion.circle key={k} cx={60 + k * 110} cy={86} r={60} fill="black" style={{ scale: reduce ? 1 : morso }} />
              ))}
            </mask>
          </defs>
          <rect width="1440" height="90" fill={colore} mask={`url(#morso-${colore.slice(1)})`} />
        </svg>
      )}
    </div>
  )
}
