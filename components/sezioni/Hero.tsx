'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Pulsante from '@/components/ui/Pulsante'
import Stelle from '@/components/ui/Stelle'
import Nastro from '@/components/ui/Nastro'
import { EASE_LUSSO } from '@/lib/animazioni'
import { useRiduciMovimento } from '@/lib/hooks'

// Foto che si alternano dietro al titolo, con un lento zoom
const FOTO = [
  { src: '/img/roma/panorama.jpg', alt: 'Tetti di Roma al tramonto' },
  { src: '/img/case/terrazza.jpg', alt: 'Terrazza di un appartamento gestito' },
  { src: '/img/roma/via-condotti.jpg', alt: 'Via Condotti e Trinità dei Monti' },
  { src: '/img/case/leonina-2.jpg', alt: 'Interno della Suite Leonina' },
]

const NASTRO = ['Zero limiti', 'Zero rischi', 'Zero spese', 'Pagamenti anticipati', 'Protezione fino a 3 mln €', 'Roma', 'Milano']

/** Scheda in vetro che fluttua e segue un po' il mouse */
function Fluttuante({ children, className, ritardo, profondita }: { children: React.ReactNode; className: string; ritardo: number; profondita: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.1, ease: EASE_LUSSO, delay: ritardo }}
    >
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5 + profondita, repeat: Infinity, ease: 'easeInOut' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const riduci = useRiduciMovimento()
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (riduci) return
    const t = setInterval(() => setIndice((i) => (i + 1) % FOTO.length), 5500)
    return () => clearInterval(t)
  }, [riduci])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yFoto = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const yTesto = useTransform(scrollYProgress, [0, 1], ['0%', '-25%'])

  // spostamento leggero delle schede con il mouse
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 20 })
  const sy = useSpring(my, { stiffness: 80, damping: 20 })
  const xSchede = useTransform(sx, (v) => v * 18)
  const ySchede = useTransform(sy, (v) => v * 14)

  return (
    <section
      id="hero-scuro"
      ref={ref}
      onPointerMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5)
        my.set(e.clientY / window.innerHeight - 0.5)
      }}
      className="relative flex min-h-[100svh] flex-col overflow-hidden rounded-b-[2rem] bg-notte text-crema md:rounded-b-[3rem]"
    >
      <motion.div className="absolute inset-0" style={{ y: yFoto }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={indice}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4 }, scale: { duration: 7, ease: 'linear' } }}
          >
            <Image src={FOTO[indice].src} alt={FOTO[indice].alt} fill preload={indice === 0} sizes="100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-notte/80 via-notte/40 to-notte/5" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-notte/70 to-transparent" />

      <motion.div style={{ y: yTesto }} className="contenitore relative grid flex-1 items-end gap-10 pt-32 pb-12 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:pb-20">
        <div>
          <motion.p
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold tracking-wide backdrop-blur-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_LUSSO, delay: 0.5 }}
          >
            <span className="size-2 animate-pulse rounded-full bg-sole" />
            Gestione affitti brevi · Roma e Milano
          </motion.p>
          <TestoDiviso as="h1" subito ritardo={0.6} testo="Hai una casa nella *città più bella* del mondo?" className="titolo-hero max-w-[14ch]" accento="text-sole" />
          <motion.p
            className="mt-7 max-w-md text-lg text-crema/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_LUSSO, delay: 1.3 }}
          >
            Ottieni il massimo dal tuo appartamento con gli affitti turistici. Noi pensiamo a tutto.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_LUSSO, delay: 1.5 }}
          >
            <Pulsante href="/calcola-guadagno" variante="corallo">Calcola il guadagno</Pulsante>
            <Pulsante href="/gestione" variante="vetro">Come funziona</Pulsante>
          </motion.div>
        </div>

        {/* Schede fluttuanti */}
        <motion.div style={{ x: xSchede, y: ySchede }} className="relative hidden h-[26rem] lg:block" aria-hidden="true">
          <Fluttuante className="top-0 right-6" ritardo={1.4} profondita={1}>
            <div className="w-64 rounded-3xl bg-white p-6 text-inchiostro shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
              <p className="font-display text-6xl font-bold tracking-tighter text-corallo">+300%</p>
              <p className="mt-1 text-sm font-medium text-pietra">di ricavi possibili rispetto all’affitto tradizionale</p>
            </div>
          </Fluttuante>
          <Fluttuante className="top-40 left-0" ritardo={1.7} profondita={2}>
            <div className="flex items-center gap-4 rounded-3xl bg-sole p-5 pr-7 text-inchiostro shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/70 font-display text-xl font-bold">G</span>
              <div>
                <Stelle className="text-inchiostro" />
                <p className="mt-1 text-sm font-bold">Eccellente su Google</p>
              </div>
            </div>
          </Fluttuante>
          <Fluttuante className="right-0 bottom-0" ritardo={2} profondita={1.5}>
            <div className="rounded-3xl bg-white/90 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur">
              <Image src="/img/partner/airbnb-superhost.png" alt="" width={190} height={87} />
            </div>
          </Fluttuante>
        </motion.div>
      </motion.div>

      {/* indicatori delle foto */}
      <div className="contenitore relative mb-6 flex gap-2" aria-hidden="true">
        {FOTO.map((f, i) => (
          <span key={f.src} className="relative h-1 w-10 overflow-hidden rounded-full bg-white/25">
            {i === indice && (
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full bg-sole"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5.5, ease: 'linear' }}
              />
            )}
          </span>
        ))}
      </div>

      <Nastro voci={NASTRO} className="relative bg-sole text-inchiostro" />
    </section>
  )
}
