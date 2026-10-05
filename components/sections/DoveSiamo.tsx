'use client'

import { motion } from 'motion/react'
import KineticText from '@/components/ui/KineticText'
import { INFO, ORARI } from '@/lib/info'
import { EASE_OUT, VIEWPORT_ONCE } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

// Strade della mappa stilizzata (si disegnano quando la mappa entra nello schermo)
const STRADE = [
  'M-20 120 C80 140 160 90 260 110 S420 160 520 130',
  'M60 -20 C80 80 120 180 110 260 S90 380 120 440',
  'M200 -20 C220 100 240 200 300 260 S420 330 520 320',
  'M-20 300 C100 280 200 320 300 260',
  'M300 260 C320 330 300 380 330 440',
  'M110 260 C160 250 220 270 300 260',
]

export default function DoveSiamo() {
  const reduce = useRiduciMovimento()
  return (
    <section id="dove" data-bg="#FFF4E0" aria-labelledby="dove-titolo" className="relative px-4 py-32 md:px-10 md:py-44">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <p className="eyebrow mb-6 flex items-center gap-3">
            <span className="inline-block h-px w-10 bg-current" /> Dove siamo
          </p>
          <h2 id="dove-titolo" className="font-display text-fluid-lg">
            <KineticText as="span" text="Vieni a" className="block" />
            <KineticText as="span" text="trovarci." className="block italic text-pomodoro" delay={0.2} />
          </h2>

          <dl className="mt-12 grid gap-8 sm:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_ONCE} transition={{ duration: 0.8, ease: EASE_OUT }}>
              <dt className="eyebrow mb-3 text-nero/50">Indirizzo</dt>
              {/* PLACEHOLDER: indirizzo fittizio, vedi lib/info.ts */}
              <dd className="font-display text-xl leading-snug">
                {INFO.indirizzo}
                <br />
                {INFO.citta}
                <br />
                <span className="text-base text-nero/60">{INFO.quartiere}</span>
              </dd>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_ONCE} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}>
              <dt className="eyebrow mb-3 text-nero/50">Contatti</dt>
              {/* PLACEHOLDER: telefono ed email fittizi, vedi lib/info.ts */}
              <dd className="flex flex-col gap-1 font-display text-xl">
                <a href={INFO.telefonoHref} className="w-fit underline decoration-1 underline-offset-4 hover:text-pomodoro">
                  {INFO.telefono}
                </a>
                <a href={`mailto:${INFO.email}`} className="w-fit text-lg [overflow-wrap:anywhere] underline decoration-1 underline-offset-4 hover:text-pomodoro">
                  {INFO.email}
                </a>
              </dd>
            </motion.div>
          </dl>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={VIEWPORT_ONCE} transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }} className="mt-12">
            <h3 className="eyebrow mb-4 text-nero/50">Orari</h3>
            {/* PLACEHOLDER: orari fittizi, vedi lib/info.ts */}
            <ul className="border-t border-nero/15">
              {ORARI.map((o) => (
                <li key={o.giorni} className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-nero/15 py-4 transition-[padding] duration-500 hover:px-2">
                  <span className="font-display text-lg italic">{o.giorni}</span>
                  <span className="tabular-nums text-nero/75">{o.orario}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Mappa stilizzata */}
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#f6e7cc] ring-1 ring-nero/10" role="img" aria-label="Mappa stilizzata del centro storico di Viterbo con la posizione del locale nel quartiere di San Pellegrino">
            <svg viewBox="0 0 500 440" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
              {/* mura */}
              <motion.path
                d="M30 40 L470 30 L480 410 L20 420 Z"
                fill="none"
                stroke="#C9812E"
                strokeWidth="2"
                strokeDasharray="2 8"
                strokeLinecap="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2.4, ease: EASE_OUT }}
              />
              {STRADE.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#1A1A1A"
                  strokeOpacity="0.75"
                  strokeWidth={i < 3 ? 2.2 : 1.2}
                  strokeLinecap="round"
                  initial={{ pathLength: reduce ? 1 : 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.2 + i * 0.12 }}
                />
              ))}
              {/* parco */}
              <ellipse cx="420" cy="80" rx="40" ry="28" fill="#5DBB63" fillOpacity="0.35" />
              {/* luoghi */}
              <g fontFamily="var(--font-display)" fontStyle="italic" fontSize="14" fill="#1A1A1A">
                <rect x="58" y="300" width="28" height="18" rx="3" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />
                <text x="40" y="340">Palazzo dei Papi</text>
                <circle cx="230" cy="60" r="10" fill="none" stroke="#1A1A1A" strokeWidth="1.2" />
                <text x="246" y="64">Fontana Grande</text>
                <text x="330" y="210">Piazza del Plebiscito</text>
              </g>
            </svg>

            {/* Segnaposto che rimbalza */}
            <div className="absolute left-[33%] top-[50%]">
              <motion.div
                initial={{ y: -200, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 300, damping: 11, delay: 1 }}
                className="relative -translate-x-1/2 -translate-y-full"
              >
                <motion.svg
                  viewBox="0 0 40 52"
                  className="h-14 w-11"
                  animate={reduce ? undefined : { y: [0, -8, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  aria-hidden="true"
                >
                  <path d="M20 50 C20 50 4 32 4 19 a16 16 0 0 1 32 0 C36 32 20 50 20 50 Z" fill="#E63B2E" stroke="#1A1A1A" strokeWidth="2.5" />
                  <circle cx="20" cy="19" r="6" fill="#FFF4E0" stroke="#1A1A1A" strokeWidth="2" />
                </motion.svg>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.5 }}
                className="absolute left-6 top-[-3.6rem] w-max rounded-full bg-nero px-4 py-2 text-xs font-semibold text-crema"
              >
                Siamo qui (più o meno)
              </motion.p>
            </div>
          </div>
          <p className="mt-4 text-sm text-nero/55">Mappa illustrativa, non in scala. Indirizzo e posizione sono di fantasia.</p>
        </div>
      </div>
    </section>
  )
}
