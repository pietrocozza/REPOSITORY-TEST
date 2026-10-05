'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useIntro } from '@/components/Providers'
import { PRELOADER } from '@/lib/animations'

const CHIAVE = 'bp-intro' // sessionStorage: compare una volta per sessione

/** Schermata di caricamento: nero, logo, una linea ambra che si riempie, poi dissolvenza (≤ 1,5 s) */
export default function Preloader() {
  const { finishIntro } = useIntro()
  const [fase, setFase] = useState<'carica' | 'esce' | 'fine'>('carica')
  const [ridotta, setRidotta] = useState(false)

  useEffect(() => {
    let vista = false
    try {
      vista = !!sessionStorage.getItem(CHIAVE)
    } catch {}
    if (vista) {
      // sessionStorage è un sistema esterno: si legge solo dopo l'idratazione
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFase('fine')
      finishIntro()
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setRidotta(reduce)
    document.documentElement.style.overflow = 'hidden'
    const durata = (reduce ? PRELOADER.ridotta : PRELOADER.riempimento) * 1000
    const t1 = setTimeout(() => {
      setFase('esce')
      finishIntro()
    }, durata)
    const t2 = setTimeout(() => {
      setFase('fine')
      document.documentElement.style.overflow = ''
      try {
        sessionStorage.setItem(CHIAVE, '1')
      } catch {}
    }, durata + PRELOADER.dissolvenza * 1000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      document.documentElement.style.overflow = ''
    }
  }, [finishIntro])

  if (fase === 'fine') return null

  return (
    <motion.div
      id="preloader"
      role="status"
      aria-label="Caricamento"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-notte"
      animate={{ opacity: fase === 'esce' ? 0 : 1 }}
      transition={{ duration: PRELOADER.dissolvenza, ease: 'easeOut' }}
    >
      <p className="font-display text-4xl uppercase tracking-wide text-crema md:text-5xl">
        Brace <span className="text-ambra">&amp;</span> Peperino
      </p>
      <div className="mt-6 h-px w-48 overflow-hidden bg-crema/15 md:w-64">
        <motion.div
          className="h-full origin-left bg-ambra"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: ridotta ? 0 : PRELOADER.riempimento, ease: [0.45, 0, 0.2, 1] }}
        />
      </div>
    </motion.div>
  )
}
