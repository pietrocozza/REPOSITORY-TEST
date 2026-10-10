'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Icona from '@/components/ui/Icona'
import Pulsante from '@/components/ui/Pulsante'
import { SERVIZI_BREVI } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

// velo colorato sopra la foto sfocata, per leggere bene il testo
const VELI = ['from-pesca via-pesca/75', 'from-cielo via-cielo/75', 'from-limone via-limone/75', 'from-salvia via-salvia/75']

export default function Servizi() {
  return (
    <section aria-labelledby="titolo-servizi" className="bg-sabbia">
      <div className="contenitore py-20 md:py-28">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Etichetta className="mb-6 text-corallo">Ci occupiamo noi di tutto</Etichetta>
            <TestoDiviso as="h2" testo="Tu ricevi *solo i profitti.*" className="titolo-xl" />
            <span id="titolo-servizi" className="sr-only">I nostri servizi</span>
          </div>
          <Pulsante href="/gestione" variante="contorno">Piani e commissioni</Pulsante>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {SERVIZI_BREVI.map((s, i) => (
            <motion.li
              key={s.titolo}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: (i % 4) * 0.08 }}
              whileHover={{ y: -8, rotate: i % 2 ? 1 : -1 }}
              className="group relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-3xl p-5 md:min-h-64 md:p-7"
            >
              <Image src={s.foto} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="-z-20 object-cover transition-transform duration-700 ease-lusso group-hover:scale-105" />
              <span aria-hidden="true" className={`absolute inset-0 -z-10 bg-gradient-to-t to-transparent ${VELI[(i + Math.floor(i / 4)) % VELI.length]}`} />
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white/70 text-inchiostro transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-8deg] md:size-14">
                <Icona nome={s.icona} className="size-6 md:size-7" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight md:text-2xl">{s.titolo}</h3>
                <p className="mt-1.5 text-sm font-medium text-inchiostro/80">{s.testo}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
