'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import KineticText from '@/components/ui/KineticText'
import Seal from '@/components/ui/Seal'
import { useRiduciMovimento } from '@/lib/hooks'

const TESTO =
  'Siamo nati tra i vicoli di San Pellegrino, dove il peperino — la pietra grigia di Viterbo — tiene in piedi case, torri e scale da otto secoli. Noi teniamo in piedi panini. Manzo maremmano schiacciato sulla brace, pane lievitato quarantotto ore, pecorino delle grotte di tufo e nocciole dei Cimini. Niente di surgelato, niente di serioso: solo cose buone, fatte a mano, a due passi dal Palazzo dei Papi.'

function Parola({ children, p, da, a }: { children: string; p: MotionValue<number>; da: number; a: number }) {
  const opacity = useTransform(p, [da, a], [0.14, 1])
  return (
    <motion.span style={{ opacity }} className="mr-[0.24em] inline-block">
      {children}
    </motion.span>
  )
}

export default function Storia() {
  const testoRef = useRef<HTMLParagraphElement>(null)
  const illRef = useRef<HTMLDivElement>(null)
  const reduce = useRiduciMovimento()
  const { scrollYProgress } = useScroll({ target: testoRef, offset: ['start 0.85', 'end 0.45'] })
  const parole = TESTO.split(' ')

  // Parallax a più livelli dell'illustrazione del quartiere
  const { scrollYProgress: pIll } = useScroll({ target: illRef, offset: ['start end', 'end start'] })
  const luna = useTransform(pIll, [0, 1], [60, -140])
  const fondo = useTransform(pIll, [0, 1], [40, -60])
  const medio = useTransform(pIll, [0, 1], [80, -20])
  const fronte = useTransform(pIll, [0, 1], [140, 0])

  return (
    <section id="storia" data-bg="#1A1A1A" aria-labelledby="storia-titolo" className="relative px-4 pb-24 pt-36 text-crema md:px-10 md:pb-32 md:pt-48">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-6 flex items-center gap-3 text-cheddar">
            <span className="inline-block h-px w-10 bg-current" /> La nostra storia
          </p>
          <h2 id="storia-titolo" className="mb-12 font-display text-fluid-lg">
            <KineticText as="span" text="Pietra, brace" className="block" />
            <KineticText as="span" text="e un pizzico di follia." className="block italic text-cheddar" delay={0.25} />
          </h2>
          <p ref={testoRef} className="font-display text-[1.6rem] leading-[1.35] md:text-[2.1rem]">
            {reduce
              ? TESTO
              : parole.map((w, i) => (
                  <Parola key={i} p={scrollYProgress} da={i / parole.length} a={(i + 1) / parole.length}>
                    {w}
                  </Parola>
                ))}
          </p>
          <p className="eyebrow mt-10 text-crema/50">— Il team di Brace &amp; Peperino (inventato, ma affamato)</p>
        </div>

        {/* Illustrazione del quartiere medievale, a strati */}
        <div ref={illRef} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] ring-1 ring-crema/15" role="img" aria-label="Illustrazione del quartiere medievale di San Pellegrino di notte: torri, case con scale esterne e un arco">
            <motion.svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" style={reduce ? undefined : { y: luna }}>
              <circle cx="300" cy="110" r="44" fill="#FFC53D" />
              {[
                [60, 60],
                [140, 120],
                [220, 50],
                [360, 210],
                [40, 190],
              ].map(([x, y]) => (
                <path key={`${x}${y}`} d={`M${x} ${y - 6} L${x + 1.5} ${y - 1.5} L${x + 6} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 6} L${x - 1.5} ${y + 1.5} L${x - 6} ${y} L${x - 1.5} ${y - 1.5} Z`} fill="#FFF4E0" />
              ))}
            </motion.svg>
            <motion.svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" style={reduce ? undefined : { y: fondo }}>
              <g fill="#2a2724" stroke="#FFF4E0" strokeOpacity="0.35" strokeWidth="1.2">
                <path d="M30 520 V170 H80 V520 Z" />
                <path d="M26 170 L55 140 L84 170" />
                <path d="M250 520 V200 H300 V520 Z" />
                <path d="M250 200 V186 H262 V200 M269 200 V186 H281 V200 M288 200 V186 H300 V200" />
              </g>
            </motion.svg>
            <motion.svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" style={reduce ? undefined : { y: medio }}>
              <g fill="#34302c" stroke="#FFF4E0" strokeOpacity="0.5" strokeWidth="1.2" strokeLinejoin="round">
                <path d="M-10 520 V300 L60 260 L130 300 V520 Z" />
                <path d="M130 520 V280 L200 240 L270 280 V520 Z" />
                <path d="M270 520 V310 L330 280 L410 310 V520 Z" />
              </g>
              {/* finestre accese */}
              {[
                [40, 330],
                [80, 360],
                [170, 310],
                [220, 340],
                [300, 350],
                [350, 330],
              ].map(([x, y], k) => (
                <motion.rect
                  key={k}
                  x={x}
                  y={y}
                  width="16"
                  height="22"
                  rx="8"
                  fill="#FFC53D"
                  animate={reduce ? undefined : { opacity: [1, 0.55, 1] }}
                  transition={{ duration: 2.5 + k * 0.7, repeat: Infinity }}
                />
              ))}
            </motion.svg>
            <motion.svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" style={reduce ? undefined : { y: fronte }}>
              <g fill="#1A1A1A" stroke="#FFF4E0" strokeWidth="1.5" strokeLinejoin="round">
                {/* arco e profferlo (scala esterna tipica di Viterbo) */}
                <path d="M-10 520 V400 H120 V520 Z" />
                <path d="M30 520 V460 A30 30 0 0 1 90 460 V520" fill="#E63B2E" fillOpacity="0.25" />
                <path d="M120 520 L120 470 L170 470 L170 440 L220 440 L220 410 L300 410 V520 Z" />
                <path d="M300 520 V380 H410 V520 Z" />
                <path d="M330 520 V450 A25 25 0 0 1 380 450 V520" fill="#FFC53D" fillOpacity="0.35" />
              </g>
              {/* lanterna */}
              <path d="M300 380 V360 H320" stroke="#FFF4E0" strokeWidth="1.5" fill="none" />
              <motion.circle cx="320" cy="370" r="7" fill="#FFC53D" animate={reduce ? undefined : { scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.svg>
          </div>

          <div className="absolute -bottom-10 -left-4 md:-left-12">
            <Seal
              testo="BRACE VIVA • DAL MARTEDÌ ALLA DOMENICA • "
              label="Adesivo trascinabile: brace viva"
              sfondo="#FFC53D"
              size={124}
              rotazione={10}
              centro={<Fiammella />}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Fiammella con gli occhi */
function Fiammella() {
  return (
    <svg viewBox="0 0 40 50" className="h-11 w-9" aria-hidden="true">
      <path d="M20 2 C26 14 36 20 36 32 a16 16 0 0 1 -32 0 C4 24 10 20 12 12 C15 18 18 18 20 2 Z" fill="#E63B2E" stroke="#1A1A1A" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M20 22 C24 28 28 30 28 36 a8 8 0 0 1 -16 0 C12 32 16 28 20 22 Z" fill="#FFC53D" />
      <circle cx="16" cy="34" r="2" fill="#1A1A1A" />
      <circle cx="24" cy="34" r="2" fill="#1A1A1A" />
    </svg>
  )
}
