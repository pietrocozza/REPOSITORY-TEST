'use client'

import { motion } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Icona from '@/components/ui/Icona'
import { COME_LAVORIAMO } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Contratto, pagamenti, tasse, burocrazia: schede bianche su fondo scuro, a punti, da leggere al volo */
export default function ComeLavoriamo() {
  return (
    <section aria-labelledby="titolo-come" className="bg-notte text-crema">
      <div className="contenitore py-20 md:py-28">
        <Etichetta className="mb-6 text-sole">Come lavoriamo</Etichetta>
        <TestoDiviso as="h2" testo="Chiaro *fin dall’inizio.*" className="titolo-xl" accento="text-sole" />
        <span id="titolo-come" className="sr-only">Come lavoriamo</span>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COME_LAVORIAMO.map((v, i) => (
            <motion.li
              key={v.titolo}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: (i % 3) * 0.08 }}
              className="rounded-3xl border-t-4 border-corallo bg-white p-6 text-inchiostro shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] md:p-7"
            >
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-corallo text-white">
                  <Icona nome={v.icona} className="size-6" />
                </span>
                <h3 className="font-display text-xl leading-tight font-bold tracking-tight md:text-2xl">{v.titolo}</h3>
              </div>
              <ul className="mt-5 space-y-2.5">
                {v.punti.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-corallo" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-medium">{p}</span>
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
