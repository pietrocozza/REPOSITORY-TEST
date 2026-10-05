'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useSpring, useTransform } from 'motion/react'
import { usePointer } from '@/components/Providers'
import { useCart } from '@/lib/cart'
import { useRiduciMovimento } from '@/lib/hooks'

/** Occhi che seguono il cursore (usati dalla mascotte e dalla schermata di caricamento) */
export function Occhi({ occhiolino = false, className }: { occhiolino?: boolean; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const { x, y } = usePointer()
  const reduce = useRiduciMovimento()
  // spostamento della pupilla verso il cursore (massimo 4,5 unità)
  const verso = (px: number, py: number, asse: 'x' | 'y') => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || reduce) return 0
    const dx = px - (r.left + r.width / 2)
    const dy = py - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy) || 1
    return ((asse === 'x' ? dx : dy) / d) * Math.min(4.5, d / 40)
  }
  const dx = useTransform(() => verso(x.get(), y.get(), 'x'))
  const dy = useTransform(() => verso(x.get(), y.get(), 'y'))
  const px = useSpring(dx, { stiffness: 300, damping: 20 })
  const py = useSpring(dy, { stiffness: 300, damping: 20 })

  return (
    <svg ref={ref} viewBox="0 0 80 32" className={className} aria-hidden="true">
      {[22, 58].map((cx, i) => (
        <g key={cx}>
          <motion.g
            animate={{ scaleY: occhiolino && i === 1 ? 0.08 : 1 }}
            transition={{ duration: 0.12 }}
            style={{ originX: `${cx}px`, originY: '16px' }}
          >
            <ellipse cx={cx} cy="16" rx="11" ry="13" fill="#FFF" stroke="#1A1A1A" strokeWidth="3.5" />
            <motion.circle cx={cx} cy="16" r="5" fill="#1A1A1A" style={{ x: px, y: py }} />
          </motion.g>
        </g>
      ))}
    </svg>
  )
}

const BATTUTE = ['Ehi! Il solletico no!', 'Ho fame anch’io…', 'Scegli il Papale, fidati.', 'Sono fatto a mano!', 'Mordimi pure (ma piano).']

/**
 * La mascotte: un panino con occhi e braccia.
 * Guarda il cursore, saluta, salta quando aggiungi un panino al carrello, parla se la tocchi.
 */
export default function Mascot({ className, saluta = true }: { className?: string; saluta?: boolean }) {
  const reduce = useRiduciMovimento()
  const { addTick } = useCart()
  const [scope, animate] = useAnimate()
  const [battuta, setBattuta] = useState<string | null>(null)
  const [felice, setFelice] = useState(false)

  // Salto di gioia quando entra qualcosa nel carrello
  useEffect(() => {
    if (!addTick || reduce || !scope.current) return
    animate(scope.current, { y: [0, -40, 0, -12, 0], scaleY: [1, 1.1, 0.85, 1.04, 1] }, { duration: 0.8 })
    setFelice(true)
    const t = setTimeout(() => setFelice(false), 1400)
    return () => clearTimeout(t)
  }, [addTick, animate, reduce, scope])

  const tocca = () => {
    setBattuta(BATTUTE[Math.floor(Math.random() * BATTUTE.length)])
    if (!reduce) animate(scope.current, { scaleY: [1, 0.8, 1.1, 1], scaleX: [1, 1.15, 0.95, 1] }, { duration: 0.45 })
    setTimeout(() => setBattuta(null), 1800)
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      {battuta && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute -top-14 left-1/2 w-max max-w-[12rem] -translate-x-1/2 rounded-2xl bg-nero px-3 py-2 text-center text-xs font-semibold text-crema"
        >
          {battuta}
        </motion.p>
      )}
      <button type="button" onClick={tocca} aria-label="Mascotte di Brace & Peperino: toccala per farla parlare" className="block w-full">
        <motion.div ref={scope} className="origin-bottom">
          <svg viewBox="0 0 200 190" className="h-auto w-full overflow-visible" aria-hidden="true">
            {/* braccia */}
            <motion.path
              d="M30 108 C10 100 4 80 10 66"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="6"
              strokeLinecap="round"
              animate={saluta && !reduce ? { rotate: [0, -18, 6, -18, 0] } : undefined}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.2 }}
              style={{ originX: '30px', originY: '108px' }}
            />
            <path d="M170 108 C188 116 192 132 186 144" fill="none" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
            {/* pane, formaggio, carne, pane */}
            <path d="M28 88 C28 40 64 18 100 18 C136 18 172 40 172 88 Z" fill="#C9812E" stroke="#1A1A1A" strokeWidth="5" strokeLinejoin="round" />
            <path d="M50 52 C60 38 76 30 92 29" fill="none" stroke="#E9AE62" strokeWidth="7" strokeLinecap="round" />
            <path d="M22 92 L178 92 L178 104 L162 104 L154 120 L146 104 L70 104 L60 118 L52 104 L22 104 Z" fill="#FFA41F" stroke="#1A1A1A" strokeWidth="5" strokeLinejoin="round" />
            <rect x="24" y="104" width="152" height="30" rx="15" fill="#7A3E1D" stroke="#1A1A1A" strokeWidth="5" />
            <path d="M24 138 L176 138 L172 160 Q168 170 156 170 L44 170 Q32 170 28 160 Z" fill="#C9812E" stroke="#1A1A1A" strokeWidth="5" strokeLinejoin="round" />
            {/* bocca */}
            <path d={felice ? 'M84 70 Q100 90 116 70 Z' : 'M88 72 Q100 82 112 72'} fill={felice ? '#E63B2E' : 'none'} stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* gambe */}
            <path d="M74 170 L70 186 M126 170 L130 186" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <Occhi className="absolute left-1/2 top-[22%] w-[42%] -translate-x-1/2" />
        </motion.div>
      </button>
    </div>
  )
}
