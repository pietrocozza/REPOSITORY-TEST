'use client'

import { motion } from 'motion/react'
import Scooter from '@/components/illustrations/Scooter'
import { euro } from '@/lib/menu'
import { EASE_OUT } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

export type Esito = { numero: string; eta: string; totale: number; nome: string }

/** Conferma dell'ordine, nella stessa sezione: numero, tempo stimato e uno scooter che passa */
export default function Conferma({ esito, onNuovo }: { esito: Esito; onNuovo: () => void }) {
  const reduce = useRiduciMovimento()
  return (
    <div className="relative overflow-hidden py-6 text-center md:py-10" role="status" aria-live="polite">
      <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE_OUT }} className="eyebrow text-nero/60">
        Ordine ricevuto
      </motion.p>
      <motion.h3
        initial={{ opacity: 0, y: 40, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
        className="mt-4 font-display text-fluid-lg"
      >
        Grazie, <em className="text-pomodoro">{esito.nome.split(' ')[0]}</em>!
      </motion.h3>

      <motion.dl
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.3 }}
        className="mx-auto mt-10 grid max-w-2xl gap-px overflow-hidden rounded-[1.75rem] bg-nero/15 ring-1 ring-nero/15 sm:grid-cols-3"
      >
        {[
          ['Numero d’ordine', esito.numero],
          ['Arriva', esito.eta],
          ['Totale alla consegna', euro(esito.totale)],
        ].map(([k, v]) => (
          <div key={k} className="bg-crema px-5 py-6">
            <dt className="eyebrow text-[0.65rem] text-nero/55">{k}</dt>
            <dd className="mt-2 font-display text-2xl">{v}</dd>
          </div>
        ))}
      </motion.dl>

      {/* Lo scooter attraversa lo schermo */}
      <div aria-hidden={false} className="relative mt-12 h-36">
        <div className="absolute inset-x-0 bottom-3 h-px bg-nero/20" />
        <motion.div
          className="absolute bottom-0 left-0 w-40"
          initial={{ x: '-110%' }}
          animate={reduce ? { x: '0%' } : { x: ['-110%', '120vw'] }}
          transition={reduce ? { duration: 0 } : { duration: 4.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8 }}
        >
          <motion.div animate={reduce ? undefined : { y: [0, -3, 0], rotate: [0, -1.5, 0] }} transition={{ duration: 0.35, repeat: Infinity }}>
            <Scooter className="h-auto w-full" />
          </motion.div>
        </motion.div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-sm text-nero/60">
        Questo è un locale inventato: l’ordine non è stato inviato a nessuno e nessun rider sta partendo davvero. Peccato.
      </p>
      <button type="button" onClick={onNuovo} className="mt-6 h-12 rounded-full px-6 font-semibold ring-1 ring-nero/25 transition-colors hover:bg-nero hover:text-crema">
        Fai un altro ordine
      </button>
    </div>
  )
}
