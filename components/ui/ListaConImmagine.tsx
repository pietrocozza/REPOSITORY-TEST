'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import Icona from './Icona'
import { EASE_LUSSO } from '@/lib/animazioni'

export type VoceLista = { icona: string; titolo: string; testo: string; dato?: string; foto: string }

const COLORI = ['bg-pesca', 'bg-cielo', 'bg-limone', 'bg-salvia', 'bg-pesca']

function Voce({ v, i, attiva, onAttiva }: { v: VoceLista; i: number; attiva: boolean; onAttiva: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const visibile = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => {
    if (visibile) onAttiva(i)
  }, [visibile, i, onAttiva])

  return (
    <li ref={ref} className="lg:flex lg:min-h-[42vh] lg:items-center">
      {/* su telefono la foto sta dentro la voce */}
      <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-3xl lg:hidden">
        <Image src={v.foto} alt="" fill sizes="100vw" className="object-cover" />
        {v.dato && <span className="absolute bottom-3 left-3 rounded-full bg-white px-4 py-1.5 font-display text-lg font-bold text-corallo">{v.dato}</span>}
      </div>
      <motion.div
        animate={{ opacity: attiva ? 1 : 0.35, x: attiva ? 0 : -6 }}
        transition={{ duration: 0.5, ease: EASE_LUSSO }}
        className="flex gap-5 max-lg:!opacity-100 max-lg:!transform-none"
      >
        <span
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-inchiostro transition-transform duration-500 ${COLORI[i % COLORI.length]} ${attiva ? 'scale-110 rotate-[-6deg]' : ''}`}
        >
          <Icona nome={v.icona} className="size-7" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{v.titolo}</h3>
          <p className="mt-2 max-w-sm text-pietra">{v.testo}</p>
        </div>
      </motion.div>
    </li>
  )
}

/** Elenco a sinistra, foto a destra che cambia con la voce che stai leggendo */
export default function ListaConImmagine({ voci }: { voci: readonly VoceLista[] }) {
  const [attiva, setAttiva] = useState(0)
  const v = voci[attiva]

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
      <ul className="space-y-12 lg:space-y-0">
        {voci.map((voce, i) => (
          <Voce key={voce.titolo} v={voce} i={i} attiva={attiva === i} onAttiva={setAttiva} />
        ))}
      </ul>

      <div className="hidden lg:block">
        <div className="sticky top-[15vh] h-[70vh]">
          <div className="relative h-full overflow-hidden rounded-[2rem]">
            <AnimatePresence initial={false}>
              <motion.div
                key={v.foto}
                className="absolute inset-0"
                initial={{ clipPath: 'inset(0% 0% 100% 0%)', scale: 1.15 }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
                exit={{ opacity: 0.6 }}
                transition={{ duration: 0.9, ease: EASE_LUSSO }}
              >
                <Image src={v.foto} alt="" fill sizes="45vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

            {/* dato grande che entra a ogni cambio */}
            <AnimatePresence mode="wait">
              {v.dato && (
                <motion.div
                  key={v.dato}
                  className="absolute bottom-6 left-6 rounded-3xl bg-white px-6 py-4 shadow-xl"
                  initial={{ opacity: 0, y: 30, rotate: -4 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: EASE_LUSSO }}
                >
                  <p className="font-display text-5xl font-bold tracking-tighter text-corallo">{v.dato}</p>
                  <p className="text-sm font-semibold text-pietra">{v.titolo}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* avanzamento */}
            <div className="absolute top-6 right-6 flex gap-1.5" aria-hidden="true">
              {voci.map((x, i) => (
                <span key={x.titolo} className={`h-1.5 rounded-full transition-all duration-500 ${i === attiva ? 'w-8 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
