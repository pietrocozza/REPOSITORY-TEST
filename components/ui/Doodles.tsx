'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

// Piccoli disegni a linea sottile sparsi nella pagina (semi di sesamo, stelline, gocce),
// che si muovono a velocità diverse mentre scorri: un parallax lento e discreto.
const DOODLES = [
  { top: 4, left: 8, tipo: 'stella', vel: 0.12, r: 10 },
  { top: 9, left: 88, tipo: 'seme', vel: 0.2, r: 30 },
  { top: 16, left: 46, tipo: 'goccia', vel: 0.08, r: -12 },
  { top: 24, left: 92, tipo: 'stella', vel: 0.16, r: 0 },
  { top: 31, left: 5, tipo: 'seme', vel: 0.1, r: -40 },
  { top: 38, left: 70, tipo: 'goccia', vel: 0.22, r: 18 },
  { top: 46, left: 14, tipo: 'stella', vel: 0.14, r: 20 },
  { top: 53, left: 90, tipo: 'seme', vel: 0.09, r: 60 },
  { top: 60, left: 40, tipo: 'stella', vel: 0.18, r: -8 },
  { top: 67, left: 7, tipo: 'goccia', vel: 0.12, r: 0 },
  { top: 74, left: 82, tipo: 'stella', vel: 0.1, r: 30 },
  { top: 81, left: 22, tipo: 'seme', vel: 0.2, r: 10 },
  { top: 88, left: 93, tipo: 'goccia', vel: 0.15, r: -20 },
  { top: 95, left: 52, tipo: 'stella', vel: 0.08, r: 0 },
] as const

function Doodle({ tipo }: { tipo: 'stella' | 'seme' | 'goccia' }) {
  if (tipo === 'stella')
    return <path d="M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1 Z" fill="none" stroke="#C9812E" strokeWidth="1.2" />
  if (tipo === 'seme') return <ellipse cx="12" cy="12" rx="9" ry="5" fill="none" stroke="#C9812E" strokeWidth="1.2" />
  return <path d="M12 2 C16 9 19 13 19 16 a7 7 0 0 1 -14 0 C5 13 8 9 12 2 Z" fill="none" stroke="#E63B2E" strokeWidth="1.2" />
}

function Item({ d }: { d: (typeof DOODLES)[number] }) {
  const reduce = useRiduciMovimento()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, (v) => -v * d.vel)
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="absolute h-6 w-6 md:h-8 md:w-8"
      style={{ top: `${d.top}%`, left: `${d.left}%`, rotate: d.r, y: reduce ? 0 : y }}
    >
      <Doodle tipo={d.tipo} />
    </motion.svg>
  )
}

export default function Doodles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden opacity-45">
      {DOODLES.map((d, i) => (
        <Item key={i} d={d} />
      ))}
    </div>
  )
}
