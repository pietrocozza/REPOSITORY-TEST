'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

/**
 * Confronto prima/dopo: trascina la maniglia (o usa le frecce) per svelare la ristrutturazione.
 */
export default function PrimaDopo({ prima, dopo, alt }: { prima: string; dopo: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useMotionValue(50)
  const fluida = useSpring(pos, { stiffness: 260, damping: 32 })
  const clip = useTransform(fluida, (v) => `inset(0 ${100 - v}% 0 0)`)
  const sinistra = useTransform(fluida, (v) => `${v}%`)
  const [valore, setValore] = useState(50)
  const trascinando = useRef(false)

  const aggiorna = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const v = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))
    pos.set(v)
    setValore(Math.round(v))
  }

  return (
    <div
      ref={ref}
      className="relative aspect-[16/10] touch-pan-y overflow-hidden rounded-[2rem] select-none shadow-[0_30px_60px_-30px_rgba(29,34,54,0.5)]"
      onPointerDown={(e) => {
        trascinando.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        aggiorna(e.clientX)
      }}
      onPointerMove={(e) => {
        if (trascinando.current || e.pointerType === 'mouse') aggiorna(e.clientX)
      }}
      onPointerUp={() => (trascinando.current = false)}
      data-cursore="Trascina"
    >
      <Image src={dopo} alt={`${alt}: dopo`} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        <Image src={prima} alt={`${alt}: prima`} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
      </motion.div>
      <span className="etichetta absolute top-4 left-4 rounded-full bg-inchiostro/80 px-3 py-1.5 text-white backdrop-blur">Prima</span>
      <span className="etichetta absolute top-4 right-4 rounded-full bg-sole px-3 py-1.5 text-inchiostro">Dopo</span>
      <motion.div className="pointer-events-none absolute inset-y-0 w-px bg-crema" style={{ left: sinistra }}>
        <span className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-crema text-inchiostro shadow-xl">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </motion.div>
      <input
        type="range"
        min={0}
        max={100}
        value={valore}
        onChange={(e) => {
          const v = Number(e.target.value)
          pos.set(v)
          setValore(v)
        }}
        aria-label="Confronta prima e dopo la ristrutturazione"
        className="absolute inset-0 h-full w-full cursor-none opacity-0 focus-visible:opacity-0"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  )
}
