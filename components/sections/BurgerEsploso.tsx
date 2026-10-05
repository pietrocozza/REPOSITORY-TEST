'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { LAYERS, Layer, overlapMargin, type LayerId } from '@/components/burger/layers'
import { EXPLODE, SPRING_SCROLL, EASE_OUT } from '@/lib/animations'
import { useIsMobile, useRiduciMovimento } from '@/lib/hooks'
import { audio } from '@/lib/audio'

// Strati del panino dall'alto verso il basso
const ORDINE: LayerId[] = ['bunTop', 'lettuce', 'tomato', 'onion', 'cheese', 'patty', 'bacon', 'sauce', 'bunBottom']
const N = ORDINE.length

// Momento (da 0 a 1 dello scroll della sezione) in cui ogni strato si stacca
const inizio = (i: number) => EXPLODE.start + i * EXPLODE.stagger
const arrivo = (i: number) => inizio(i) + EXPLODE.layerDuration

/**
 * Il panino che si apre con lo scroll.
 * La sezione è alta 500vh; dentro, un contenitore "sticky" resta fermo a tutto schermo
 * mentre la posizione di scroll (da 0 a 1) muove gli strati.
 */
export default function BurgerEsploso() {
  const sectionRef = useRef<HTMLElement>(null)
  const burgerRef = useRef<HTMLDivElement>(null)
  const reduce = useRiduciMovimento()
  const isMobile = useIsMobile()

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  // Con "riduci movimento" il panino resta fermo in vista esplosa
  const fermo = useMotionValue(0.8)
  const p = reduce ? fermo : scrollYProgress

  // Distanza tra gli strati: calcolata in base allo spazio disponibile sullo schermo
  const gap = useMotionValue(40)
  useEffect(() => {
    const calcola = () => {
      const h = window.innerHeight
      const mobile = window.innerWidth < 768
      const chiuso = burgerRef.current?.offsetHeight ?? 300
      const spazio = h * (mobile ? 0.62 : 0.84)
      gap.set(Math.max(10, Math.min(mobile ? 34 : 64, (spazio - chiuso) / (N - 1))))
    }
    calcola()
    window.addEventListener('resize', calcola)
    return () => window.removeEventListener('resize', calcola)
  }, [gap])

  // Suono "pop" quando uno strato si stacca + strato attivo per le etichette su mobile
  const [attivo, setAttivo] = useState(-1)
  const ultimo = useRef(0)
  const ultimoPop = useRef(0)
  useMotionValueEvent(p, 'change', (v) => {
    const prima = ultimo.current
    ultimo.current = v
    if (v > prima) {
      for (let i = 0; i < N; i++) {
        const soglia = inizio(i) + 0.01
        if (prima < soglia && v >= soglia && performance.now() - ultimoPop.current > 70) {
          audio.pop()
          ultimoPop.current = performance.now()
        }
      }
    }
    let idx = -1
    if (v < EXPLODE.recombineStart) {
      for (let i = 0; i < N; i++) if (v >= arrivo(i) - EXPLODE.layerDuration * 0.2) idx = i
    }
    setAttivo((a) => (a === idx ? a : idx))
  })

  const hintOpacity = useTransform(p, [0, 0.05], [1, 0])
  // Il titolo si fa da parte mentre il panino è aperto, e torna quando si richiude
  const titoloOpacity = useTransform(p, [0.03, 0.08, EXPLODE.recombineEnd - 0.02, EXPLODE.recombineEnd + 0.02], [1, 0, 0, 1])
  const titoloY = useTransform(titoloOpacity, [0, 1], [-30, 0])
  const sfondoX = useTransform(p, [0, 1], ['10%', '-60%'])
  const contatore = useTransform(p, (v) => {
    if (v >= EXPLODE.recombineStart) return N
    let n = 0
    for (let i = 0; i < N; i++) if (v >= inizio(i)) n = i + 1
    return n
  })

  return (
    <section
      ref={sectionRef}
      id="panino"
      data-bg="#FFC53D"
      data-cursor="bite"
      aria-label="Anatomia del panino: scorri per aprirlo strato per strato"
      className={reduce ? 'relative py-24' : 'relative h-[500vh]'}
    >
      <div className={reduce ? 'relative overflow-hidden pb-16' : 'sticky top-0 h-svh overflow-hidden'}>
        {/* Scritta gigante di sfondo che scorre di lato */}
        <motion.div
          aria-hidden="true"
          style={{ x: reduce ? 0 : sfondoX }}
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-[28vw] italic leading-none text-nero/[0.06]"
        >
          Smash Smash Smash
        </motion.div>

        {/* Titolo della sezione */}
        <motion.div
          style={reduce ? { opacity: 1, y: 0 } : { opacity: titoloOpacity, y: titoloY }}
          className={reduce ? 'px-4 pb-10 md:px-10' : 'absolute left-4 top-20 z-20 md:left-10 md:top-28'}
        >
          <p className="eyebrow mb-3">Anatomia di un</p>
          <h2 className="overflow-hidden pb-2 font-display text-fluid-lg italic">
            <motion.span
              className="block"
              initial={{ y: '110%', rotate: 8 }}
              whileInView={{ y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
            >
              Peperino
            </motion.span>
          </h2>
          {!reduce && (
            <p className="eyebrow mt-4 tabular-nums">
              <motion.span>{contatore}</motion.span>/{N} strati
            </p>
          )}
        </motion.div>

        {/* Il panino */}
        <div className={reduce ? 'relative flex flex-col items-center' : 'absolute inset-0 flex items-center justify-center'}>
          <div
            ref={burgerRef}
            role="img"
            aria-label="Hamburger con pane al sesamo, lattuga, pomodoro, cipolla, cheddar, carne, bacon, salsa e pane"
            className={`relative w-[52vw] max-w-[230px] md:w-[22vw] md:max-w-[300px] ${isMobile && !reduce ? '-translate-y-[9vh]' : ''}`}
            style={reduce ? { display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 18 } : undefined}
          >
            {ORDINE.map((id, i) => (
              <StratoEsploso key={id} id={id} i={i} p={p} gap={gap} reduce={!!reduce} />
            ))}
          </div>

          {/* Su mobile: etichetta dello strato attivo sotto il panino */}
          {isMobile && !reduce && (
            <div className="absolute inset-x-4 bottom-8 h-28" aria-live="polite">
              <AnimatePresence mode="wait">
                {attivo >= 0 && (
                  <motion.div
                    key={ORDINE[attivo]}
                    initial={{ opacity: 0, y: 24, rotate: -3 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, y: -16, rotate: 3 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="cartoon rounded-3xl bg-crema p-4"
                  >
                    <p className="font-display text-xl">{LAYERS[ORDINE[attivo]].nome}</p>
                    <p className="text-sm">{LAYERS[ORDINE[attivo]].descrizione}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile con "riduci movimento": elenco statico */}
          {isMobile && reduce && (
            <ul className="mt-10 grid gap-3 px-4">
              {ORDINE.map((id) => (
                <li key={id} className="cartoon rounded-2xl bg-crema p-3">
                  <p className="font-display text-lg">{LAYERS[id].nome}</p>
                  <p className="text-sm">{LAYERS[id].descrizione}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!reduce && (
          <motion.div
            style={{ opacity: hintOpacity }}
            className="eyebrow absolute bottom-6 left-1/2 z-20 -translate-x-1/2 max-md:hidden"
          >
            Scorri per aprirlo ↓
          </motion.div>
        )}
      </div>
    </section>
  )
}

function StratoEsploso({
  id,
  i,
  p,
  gap,
  reduce,
}: {
  id: LayerId
  i: number
  p: MotionValue<number>
  gap: MotionValue<number>
  reduce: boolean
}) {
  const s = inizio(i)
  const d = EXPLODE.layerDuration
  const { recombineStart: RS, recombineEnd: RE, overshoot, undershoot } = EXPLODE
  const dir = i - (N - 1) / 2 // negativo = sale, positivo = scende
  const verso = i % 2 ? 1 : -1
  const giro = id === 'bunTop' || id === 'bunBottom' ? 2 * verso : (3 + (i % 3)) * verso

  // Posizione relativa: 0 = chiuso, 1 = posizione esplosa (con overshoot e rimbalzo)
  const rel = useTransform(
    p,
    [s, s + d * 0.55, s + d * 0.8, s + d, RS, RE],
    [0, overshoot, undershoot, 1, 1, 0],
  )
  const yGrezzo = useTransform(() => rel.get() * dir * gap.get())
  const y = useSpring(yGrezzo, SPRING_SCROLL)

  // Squash & stretch: si schiaccia, si allunga, torna normale (anche quando si richiude)
  const tempiScala = [s, s + 0.012, s + d * 0.55, s + d * 0.8, s + d, RE - 0.005, RE + 0.012, RE + 0.03]
  const scaleY = useTransform(p, tempiScala, [1, 0.72, 1.14, 0.96, 1, 1, 0.82, 1])
  const scaleX = useTransform(p, tempiScala, [1, 1.16, 0.92, 1.03, 1, 1, 1.1, 1])
  const rotate = useTransform(p, [s, s + d * 0.55, s + d, RS, RE], [0, giro * 1.7, giro, giro, 0])

  // Etichetta: la linea si disegna, poi compare il testo
  const linea = useTransform(p, [s + d * 0.7, s + d, RS, RS + 0.035], [0, 1, 1, 0])
  // con pathLength 0 la punta arrotondata disegnerebbe comunque un puntino: lo nascondiamo
  const lineaOpacity = useTransform(linea, (v) => (v > 0.01 ? 1 : 0))
  const testo = useTransform(p, [s + d * 0.85, s + d, RS, RS + 0.03], [0, 1, 1, 0])
  const testoX = useTransform(testo, [0, 1], [verso * -20, 0])

  // Nuvoletta "POP!" nel momento in cui lo strato si stacca
  const popOpacity = useTransform(p, [s - 0.002, s + 0.006, s + 0.05], [0, 1, 0])
  const popScale = useTransform(p, [s, s + 0.012, s + 0.05], [0.3, 1.25, 1])

  const aSinistra = i % 2 === 0
  const l = LAYERS[id]

  return (
    <motion.div
      className="relative"
      style={{
        marginTop: reduce ? 0 : overlapMargin(id, i === 0),
        zIndex: N - i,
        y: reduce ? 0 : y,
      }}
    >
      <motion.div style={reduce ? { scaleX: 1, scaleY: 1, rotate: 0 } : { scaleX, scaleY, rotate }} className="origin-center">
        <Layer id={id} />
      </motion.div>

      {/* Effetti extra: sesamo che salta via, gocce di salsa che schizzano */}
      {!reduce && id === 'bunTop' && <Schizzi p={p} s={s} colore="#FFF4E0" forma="seme" />}
      {!reduce && id === 'sauce' && <Schizzi p={p} s={s} colore="#F2883A" forma="goccia" />}

      {!reduce && (
        <motion.div
          aria-hidden="true"
          style={{ opacity: popOpacity, scale: popScale }}
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${aSinistra ? '-right-14 md:-right-20' : '-left-14 md:-left-20'}`}
        >
          <Pop />
        </motion.div>
      )}

      {/* Etichetta con linea disegnata a mano (solo da tablet in su) */}
      <div
        className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center md:flex ${
          aSinistra ? 'right-full flex-row-reverse pr-2' : 'left-full pl-2'
        }`}
        style={{ width: 'min(30vw, 360px)' }}
      >
        <svg viewBox="0 0 120 40" className="w-20 shrink-0 lg:w-28" aria-hidden="true" style={{ transform: aSinistra ? 'scaleX(-1)' : undefined }}>
          <motion.circle cx="4" cy="20" r="5" fill="#1A1A1A" style={{ opacity: reduce ? 1 : testo }} />
          <motion.path
            d="M4 20 C 28 4, 44 36, 68 18 S 104 10, 116 22"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth={4}
            strokeLinecap="round"
            style={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: linea, opacity: lineaOpacity }}
          />
        </svg>
        <motion.div
          style={reduce ? { opacity: 1, x: 0 } : { opacity: testo, x: testoX }}
          className={`${aSinistra ? 'text-right' : ''} min-w-0`}
        >
          <p className="font-display text-xl leading-tight lg:text-[1.65rem]">{l.nome}</p>
          <p className="text-sm leading-snug lg:text-base">{l.descrizione}</p>
        </motion.div>
      </div>
    </motion.div>
  )
}

/** Particelle che volano via quando lo strato si stacca */
function Schizzi({ p, s, colore, forma }: { p: MotionValue<number>; s: number; colore: string; forma: 'seme' | 'goccia' }) {
  const particelle = [
    { x: -150, y: -110, r: -200 },
    { x: -80, y: -170, r: 160 },
    { x: 10, y: -190, r: -120 },
    { x: 90, y: -160, r: 220 },
    { x: 160, y: -100, r: -160 },
    { x: 200, y: -30, r: 120 },
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3">
      {particelle.map((pt, k) => (
        <Particella key={k} p={p} s={s + k * 0.003} {...pt} colore={colore} forma={forma} />
      ))}
    </div>
  )
}

function Particella({
  p,
  s,
  x,
  y,
  r,
  colore,
  forma,
}: {
  p: MotionValue<number>
  s: number
  x: number
  y: number
  r: number
  colore: string
  forma: 'seme' | 'goccia'
}) {
  const t = useTransform(p, [s, s + 0.09], [0, 1])
  const px = useTransform(t, (v) => x * v)
  // traiettoria a parabola: sale e poi ricade
  const py = useTransform(t, (v) => y * v + 260 * v * v)
  const rot = useTransform(t, (v) => r * v)
  const op = useTransform(t, [0, 0.05, 0.75, 1], [0, 1, 1, 0])
  return (
    <motion.svg
      viewBox="0 0 20 20"
      className="absolute h-5 w-5"
      style={{ x: px, y: py, rotate: rot, opacity: op }}
    >
      {forma === 'seme' ? (
        <ellipse cx="10" cy="10" rx="7" ry="4" fill={colore} stroke="#1A1A1A" strokeWidth="2.5" />
      ) : (
        <path d="M10 2 C14 8 16 11 16 13 a6 6 0 0 1 -12 0 C4 11 6 8 10 2 Z" fill={colore} stroke="#1A1A1A" strokeWidth="2.5" />
      )}
    </motion.svg>
  )
}

/** Nuvoletta stile fumetto */
function Pop() {
  return (
    <svg viewBox="0 0 120 80" className="h-12 w-20 md:h-16 md:w-24">
      <path
        d="M60 4 L70 20 L90 8 L88 28 L114 26 L98 42 L116 58 L90 58 L92 76 L72 64 L60 78 L50 62 L28 74 L30 56 L6 58 L22 42 L4 26 L30 28 L28 8 L50 20 Z"
        fill="#FFF4E0"
        stroke="#1A1A1A"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <text x="60" y="49" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="800" fontSize="20" fill="#E63B2E">
        POP!
      </text>
    </svg>
  )
}
