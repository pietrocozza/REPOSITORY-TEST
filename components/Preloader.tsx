'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Layer, overlapMargin, type LayerId } from '@/components/burger/layers'
import { Occhi } from '@/components/ui/Mascot'
import { useIntro } from '@/components/Providers'
import { PRELOADER } from '@/lib/animations'
import { audio } from '@/lib/audio'
import { useRiduciMovimento } from '@/lib/hooks'

const CHIAVE = 'bp-intro' // sessionStorage: la schermata compare una sola volta per sessione

// Strati dal basso verso l'alto, con la percentuale a cui cadono
const STRATI: { id: LayerId; a: number }[] = [
  { id: 'bunBottom', a: 8 },
  { id: 'sauce', a: 24 },
  { id: 'patty', a: 40 },
  { id: 'cheese', a: 56 },
  { id: 'tomato', a: 70 },
  { id: 'lettuce', a: 82 },
  { id: 'bunTop', a: 94 },
]

const FRASI = ['Scaldiamo la piastra…', 'Sciogliamo il formaggio…', 'Tostiamo il pane…', 'Schiacciamo lo smash…']

/**
 * Schermata di caricamento: il panino si compone strato per strato (in sincronia con 0–100%),
 * fa l'occhiolino e un morso gigante "mangia" la schermata rivelando la home.
 * Durata fissa ≤ 2,5 secondi, indipendente dal caricamento reale.
 */
export default function Preloader() {
  const { finishIntro } = useIntro()
  const reduce = useRiduciMovimento()
  const [visibile, setVisibile] = useState(true)
  const [n, setN] = useState(0)
  const [frase, setFrase] = useState(0)
  const [occhiolino, setOcchiolino] = useState(false)
  const [morso, setMorso] = useState(false)
  const [dissolvi, setDissolvi] = useState(false)
  const [dim, setDim] = useState({ w: 1440, h: 900 })
  const scala = useMotionValue(0)
  const barra = useTransform(() => n / 100)

  useEffect(() => {
    // già vista in questa sessione? (lo script in <head> l'ha già nascosta)
    let vista = false
    try {
      vista = !!sessionStorage.getItem(CHIAVE)
    } catch {}
    if (vista) {
      // sessionStorage è un sistema esterno: si può leggere solo dopo l'idratazione
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibile(false)
      finishIntro()
      return
    }
    setDim({ w: window.innerWidth, h: window.innerHeight })
    window.scrollTo(0, 0)
    document.documentElement.style.overflow = 'hidden'

    const fine = () => {
      try {
        sessionStorage.setItem(CHIAVE, '1')
      } catch {}
      document.documentElement.style.overflow = ''
      setVisibile(false)
    }

    // "riduci movimento": solo logo e dissolvenza rapida
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const t1 = setTimeout(() => {
        setDissolvi(true)
        finishIntro()
      }, PRELOADER.reducedDuration * 500)
      const t2 = setTimeout(fine, PRELOADER.reducedDuration * 1000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }

    const conta = animate(0, 100, { duration: PRELOADER.countDuration, ease: [0.45, 0, 0.25, 1], onUpdate: (v) => setN(Math.round(v)) })
    const frasi = setInterval(() => setFrase((f) => (f + 1) % FRASI.length), 1000)
    const t1 = setTimeout(() => setOcchiolino(true), PRELOADER.winkAt * 1000)
    const t2 = setTimeout(() => {
      setOcchiolino(false)
      setMorso(true)
      // la hero parte insieme al morso
      finishIntro()
      animate(scala, 1, { duration: PRELOADER.biteDuration, ease: [0.7, 0, 0.84, 0] }).then(fine)
    }, PRELOADER.biteAt * 1000)
    return () => {
      conta.stop()
      clearInterval(frasi)
      clearTimeout(t1)
      clearTimeout(t2)
      document.documentElement.style.overflow = ''
    }
  }, [finishIntro, scala])

  // pop a ogni strato che cade (se l'audio è già sbloccato)
  useEffect(() => {
    if (STRATI.some((s) => s.a === n)) audio.pop()
  }, [n])

  if (!visibile) return null

  // Il morso: tanti cerchi uniti che formano un bordo "dentellato", e che crescono fino a coprire tutto
  const R = Math.hypot(dim.w, dim.h) * 1.15
  const denti = Array.from({ length: 14 }, (_, k) => {
    const a = (k / 14) * Math.PI * 2
    return { cx: Math.cos(a) * R * 0.82, cy: Math.sin(a) * R * 0.82, r: R * 0.26 }
  })

  return (
    <motion.div
      id="preloader"
      className="fixed inset-0 z-[200]"
      role="status"
      aria-label="Caricamento del sito"
      animate={{ opacity: dissolvi ? 0 : 1 }}
      transition={{ duration: 0.25 }}
    >
      {/* Sfondo crema "mangiabile" */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="maschera-morso">
            <rect width="100%" height="100%" fill="white" />
            <g transform={`translate(${dim.w * 0.92} ${dim.h * 0.38})`}>
              <motion.g style={{ scale: scala }}>
                <circle r={R * 0.85} fill="black" />
                {denti.map((d, k) => (
                  <circle key={k} cx={d.cx} cy={d.cy} r={d.r} fill="black" />
                ))}
              </motion.g>
            </g>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="#FFF4E0" mask="url(#maschera-morso)" />
      </svg>

      <motion.div
        className="relative flex h-full flex-col items-center justify-center px-6"
        animate={morso ? { opacity: 0, scale: 0.92 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        {reduce ? (
          <p className="font-display text-5xl">
            Brace <em className="text-pomodoro">&amp;</em> Peperino
          </p>
        ) : (
          <>
            <div className="relative flex h-[260px] w-[200px] flex-col justify-end md:h-[300px] md:w-[240px]" aria-hidden="true">
              <div className="flex flex-col">
                {/* li disegniamo dall'alto verso il basso, ma compaiono dal basso verso l'alto */}
                {[...STRATI].reverse().map((s, i, arr) => (
                  <div key={s.id} className="relative" style={{ marginTop: n >= s.a ? overlapMargin(s.id, s.id === 'bunTop' || n < arr[i - 1]?.a) : 0, zIndex: arr.length - i }}>
                    <AnimatePresence>
                      {n >= s.a && (
                        <motion.div
                          initial={{ y: -420, rotate: i % 2 ? 14 : -14, scaleY: 1.25 }}
                          animate={{ y: 0, rotate: 0, scaleY: [1.25, 0.72, 1.12, 1] }}
                          transition={{ y: { type: 'spring', stiffness: 520, damping: 17 }, rotate: { duration: 0.35 }, scaleY: { duration: 0.42, times: [0, 0.45, 0.75, 1] } }}
                          className="origin-bottom"
                        >
                          <Layer id={s.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* occhi sul pane di sopra */}
                    {s.id === 'bunTop' && n >= s.a && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 500, damping: 15 }} className="absolute left-1/2 top-[38%] w-[44%] -translate-x-1/2">
                        <Occhi occhiolino={occhiolino} className="h-auto w-full" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 font-display text-6xl tabular-nums md:text-7xl">
              {n}
              <span className="text-[0.5em] italic text-pomodoro">%</span>
            </p>

            {/* barra di avanzamento: una striscia di salsa che si allunga */}
            <div className="mt-5 h-3 w-56 overflow-hidden rounded-full bg-nero/10 md:w-72" aria-hidden="true">
              <motion.div className="h-full origin-left rounded-full bg-pomodoro" style={{ scaleX: barra }}>
                <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-full w-full">
                  <path d="M0 3 Q12 0 25 3 T50 3 T75 3 T100 3 V10 H0 Z" fill="#F2883A" />
                </svg>
              </motion.div>
            </div>

            <div className="mt-6 h-7 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={frase}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-xl italic text-nero/70"
                >
                  {FRASI[frase]}
                </motion.p>
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
