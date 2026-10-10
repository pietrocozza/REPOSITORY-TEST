'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import Pulsante from '@/components/ui/Pulsante'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Chiusura delle pagine: invito al simulatore in un blocco colorato */
export default function InvitoFinale() {
  return (
    <section className="bg-crema py-6 md:py-10">
      <div className="contenitore">
        <div className="relative grid overflow-hidden rounded-[2rem] bg-sole md:rounded-[3rem] lg:grid-cols-[1.3fr_1fr]">
          <div className="relative z-10 p-8 md:p-14">
            <p className="etichetta mb-6 text-inchiostro/70">Simulatore gratuito</p>
            <TestoDiviso as="h2" testo="Quanto può *rendere* la tua casa?" className="titolo-xl max-w-xl" accento="text-corallo" />
            <p className="mt-5 max-w-md text-lg text-inchiostro/80">Rispondi a poche domande: ti mandiamo la stima del guadagno.</p>
            <div className="mt-8">
              <Pulsante href="/calcola-guadagno" variante="pieno">Calcola il guadagno</Pulsante>
            </div>
          </div>
          <motion.div
            className="relative min-h-72 lg:min-h-full"
            initial={{ clipPath: 'circle(0% at 70% 50%)' }}
            whileInView={{ clipPath: 'circle(75% at 70% 50%)' }}
            viewport={{ once: true, margin: '0px 0px -20% 0px' }}
            transition={{ duration: 1.4, ease: EASE_LUSSO }}
          >
            <Image src="/img/roma/pantheon.jpg" alt="Il Pantheon a Roma" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
