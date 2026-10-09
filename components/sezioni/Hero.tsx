'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Pulsante from '@/components/ui/Pulsante'
import Stelle from '@/components/ui/Stelle'
import { EASE_LUSSO } from '@/lib/animazioni'

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yFoto = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const scala = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const yTesto = useTransform(scrollYProgress, [0, 1], ['0%', '-30%'])
  const opacita = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden bg-notte text-avorio">
      <motion.div className="absolute inset-0" style={{ y: yFoto, scale: scala }}>
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.18 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.6, ease: EASE_LUSSO }}
        >
          <Image src="/img/roma/panorama.jpg" alt="Tetti di Roma al tramonto" fill preload sizes="100vw" className="object-cover" />
        </motion.div>
      </motion.div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-notte/70 via-notte/35 to-notte/90" />

      <motion.div style={{ y: yTesto, opacity: opacita }} className="contenitore relative flex flex-1 flex-col justify-end pt-32 pb-10 md:pb-14">
        <motion.p
          className="etichetta mb-6 text-avorio/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_LUSSO, delay: 0.6 }}
        >
          Gestione affitti brevi · Roma e Milano
        </motion.p>
        <TestoDiviso
          as="h1"
          subito
          ritardo={0.7}
          testo="Hai una casa nella *città più bella* del mondo?"
          className="titolo-hero max-w-[14ch]"
          accento="text-terracotta-chiara"
        />
        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <motion.p
            className="max-w-xl text-base text-avorio/85 md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_LUSSO, delay: 1.5 }}
          >
            Ottieni il massimo rendimento dal tuo appartamento e guadagna con gli affitti turistici a Roma.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_LUSSO, delay: 1.7 }}
          >
            <Pulsante href="/calcola-guadagno" variante="chiaro">Calcolatore guadagno online</Pulsante>
            <Pulsante href="/gestione" variante="contorno" className="text-avorio">I nostri servizi</Pulsante>
          </motion.div>
        </div>

        <motion.div
          className="mt-14 flex items-center justify-between border-t border-white/20 pt-5 text-xs text-avorio/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <p className="flex items-center gap-3">
            <Stelle />
            <span>Eccellente su Google · Recensioni verificate</span>
          </p>
          <p className="hidden items-center gap-3 sm:flex">
            Scorri
            <span className="relative block h-8 w-px overflow-hidden bg-white/25">
              <motion.span
                className="absolute inset-x-0 top-0 h-1/2 bg-avorio"
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
