'use client'

import { motion } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Icona from '@/components/ui/Icona'
import { COME_LAVORIAMO } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

const COLORI = ['bg-pesca', 'bg-cielo', 'bg-limone', 'bg-salvia', 'bg-pesca', 'bg-cielo']

/** Contratto, pagamenti, tasse, burocrazia: chi fa cosa, in sei schede */
export default function ComeLavoriamo() {
  return (
    <section aria-labelledby="titolo-come" className="bg-crema">
      <div className="contenitore py-20 md:py-28">
        <Etichetta className="mb-6 text-corallo">Come lavoriamo</Etichetta>
        <TestoDiviso as="h2" testo="Chiaro *fin dall’inizio.*" className="titolo-xl" />
        <span id="titolo-come" className="sr-only">Come lavoriamo</span>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COME_LAVORIAMO.map((v, i) => (
            <motion.li
              key={v.titolo}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: (i % 3) * 0.08 }}
              className={`rounded-3xl p-6 md:p-7 ${COLORI[i]}`}
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-white">
                <Icona nome={v.icona} className="size-6 text-corallo" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{v.titolo}</h3>
              <p className="mt-2 text-inchiostro/75">{v.testo}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
