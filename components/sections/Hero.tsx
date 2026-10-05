'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useIntro, usePointer } from '@/components/Providers'
import { Layer, type LayerId } from '@/components/burger/layers'
import KineticText from '@/components/ui/KineticText'
import Magnetic from '@/components/ui/Magnetic'
import Seal from '@/components/ui/Seal'
import Skyline from '@/components/illustrations/Skyline'
import { INFO } from '@/lib/info'
import { scrollToId } from '@/lib/scroll'
import { EASE_OUT } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

// Ingredienti che fluttuano: "profondità" diverse = si muovono più o meno col mouse
const INGREDIENTI: { id: LayerId; cls: string; prof: number; rot: number; ritardo: number }[] = [
  { id: 'tomato', cls: 'right-[-6%] top-[13%] w-28 md:right-[6%] md:top-[16%] md:w-44', prof: 1.4, rot: 18, ritardo: 0.1 },
  { id: 'hazelnut', cls: 'right-[34%] top-[15%] hidden w-28 lg:block', prof: 2.4, rot: -6, ritardo: 0.6 },
  { id: 'lettuce', cls: 'left-[-14%] top-[58%] w-32 md:left-auto md:right-[20%] md:top-[34%] md:w-52', prof: 0.8, rot: -14, ritardo: 0.2 },
  { id: 'cheese', cls: 'right-[-12%] top-[50%] w-32 md:right-[1%] md:top-[50%] md:w-48', prof: 2, rot: -22, ritardo: 0.3 },
  { id: 'onion', cls: 'right-[34%] top-[64%] hidden w-32 xl:block', prof: 1.1, rot: 12, ritardo: 0.4 },
]

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { introDone } = useIntro()
  const reduce = useRiduciMovimento()
  const { nx, ny } = usePointer()
  const mx = useSpring(nx, { stiffness: 60, damping: 18 })
  const my = useSpring(ny, { stiffness: 60, damping: 18 })

  // Mentre scorri: il titolo sale più lentamente e sfuma, i tetti salgono
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const titoloY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const titoloOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const tettiY = useTransform(scrollYProgress, [0, 1], ['0%', '-40%'])

  return (
    <section ref={ref} id="top" data-bg="#FFF4E0" className="relative flex min-h-svh flex-col overflow-hidden pb-28 pt-28 md:pb-36 md:pt-36">
      {/* Ingredienti fluttuanti */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        {INGREDIENTI.map((ing) => (
          <Ingrediente key={ing.id} {...ing} mx={mx} my={my} play={introDone} reduce={!!reduce} />
        ))}
      </div>

      <motion.div style={reduce ? undefined : { y: titoloY, opacity: titoloOpacity }} className="relative z-10 flex flex-1 flex-col justify-center px-4 md:px-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={introDone ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
          className="eyebrow mb-6 flex items-center gap-3"
        >
          <span className="inline-block h-px w-10 bg-current" />
          Viterbo · San Pellegrino
        </motion.p>

        <h1 className="font-display text-fluid-giant" aria-label={INFO.nome}>
          <KineticText as="span" text="Brace" className="block" play={introDone} delay={0.15} />
          <span className="flex items-baseline gap-[0.15em]">
            <KineticText as="span" text="&" className="block italic text-pomodoro" play={introDone} delay={0.4} />
            <KineticText as="span" text="Peperino" className="block italic" play={introDone} delay={0.45} />
          </span>
        </h1>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-[1fr_auto] md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={introDone ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.9 }}
            className="max-w-md"
          >
            <p className="font-display text-2xl italic md:text-3xl">{INFO.payoff}.</p>
            <p className="mt-3 text-base leading-relaxed text-nero/70">
              Manzo maremmano schiacciato sulla brace, pane lievitato 48 ore, pecorino della Tuscia e nocciole dei Cimini.
              A due passi dal Palazzo dei Papi.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={introDone ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.05 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <a
                href="#ordina"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId('ordina')
                }}
                className="group relative flex h-14 items-center gap-3 overflow-hidden rounded-full bg-pomodoro pl-7 pr-2 font-semibold text-crema"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-nero transition-transform duration-500 ease-out group-hover:translate-y-0" />
                <span className="relative">Ordina a domicilio</span>
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-crema text-nero transition-transform duration-500 group-hover:rotate-[-45deg]">→</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#menu"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToId('menu')
                }}
                className="flex h-14 items-center rounded-full px-6 font-semibold ring-1 ring-nero/25 transition-colors hover:bg-nero hover:text-crema"
              >
                Guarda il menu
              </a>
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>

      {/* Sigillo trascinabile */}
      <div className="absolute right-4 top-[64%] z-20 md:right-[6%] md:top-[64%] lg:right-[20%] lg:top-[56%]">
        <Seal
          testo="100% TUSCIA • FATTO A MANO • DAL FORNO ALLA BRACE • "
          label="Adesivo trascinabile: 100% Tuscia, fatto a mano"
          size={112}
          rotazione={-12}
          centro={<span className="font-display text-3xl italic text-pomodoro">B&amp;P</span>}
        />
      </div>

      {/* Indicatore "scorri" */}
      <motion.button
        type="button"
        onClick={() => scrollToId('panino')}
        initial={{ opacity: 0 }}
        animate={introDone ? { opacity: 1 } : undefined}
        transition={{ delay: 1.4 }}
        className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-28"
        aria-label="Scorri alla sezione successiva"
      >
        <span className="eyebrow text-[0.65rem]">Scorri</span>
        <span className="relative block h-12 w-px overflow-hidden bg-nero/20">
          <motion.span
            className="absolute inset-x-0 top-0 block h-4 bg-nero"
            animate={reduce ? undefined : { y: ['-100%', '300%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </motion.button>

      {/* Tetti di Viterbo */}
      <motion.div aria-hidden="true" style={reduce ? undefined : { y: tettiY }} className="pointer-events-none absolute inset-x-0 bottom-0 text-nero">
        <Skyline className="h-28 w-full md:h-44" colore="#1A1A1A" riempimento="#FFF4E0" />
      </motion.div>
    </section>
  )
}

function Ingrediente({
  id,
  cls,
  prof,
  rot,
  ritardo,
  mx,
  my,
  play,
  reduce,
}: {
  id: LayerId
  cls: string
  prof: number
  rot: number
  ritardo: number
  mx: MotionValue<number>
  my: MotionValue<number>
  play: boolean
  reduce: boolean
}) {
  const x = useTransform(mx, (v) => v * prof * -26)
  const y = useTransform(my, (v) => v * prof * -26)
  return (
    <motion.div className={`absolute ${cls}`} style={reduce ? undefined : { x, y }}>
      <motion.div
        initial={{ scale: 0, rotate: rot - 90 }}
        animate={play ? { scale: 1, rotate: rot } : undefined}
        transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.5 + ritardo }}
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -14, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 5 + prof, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 ${10 * prof}px ${12 * prof}px rgba(26,26,26,0.18))` }}
        >
          <Layer id={id} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
