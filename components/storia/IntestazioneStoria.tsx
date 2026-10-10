'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Apertura della storia: titolo e due foto (prima/dopo) che si sovrappongono */
export default function IntestazioneStoria() {
  return (
    <section className="overflow-hidden bg-crema">
      <div className="contenitore grid items-center gap-12 pt-32 pb-12 md:pt-40 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <motion.p
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-salvia px-4 py-2 text-xs font-bold"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_LUSSO, delay: 0.5 }}
          >
            Ristruttura gratis · Una storia vera
          </motion.p>
          <TestoDiviso as="h1" subito ritardo={0.6} testo="E se la ristrutturazione *la facessimo noi?*" className="titolo-hero max-w-[12ch] max-sm:text-[2.35rem]" />
          <motion.a
            href="#storia"
            className="group mt-10 inline-flex items-center gap-3 font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-corallo text-white">
              <motion.svg viewBox="0 0 24 24" className="size-5" animate={{ y: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }} aria-hidden="true">
                <path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </span>
            Scorri la storia di Via Leonina
          </motion.a>
        </div>

        <div className="relative h-[22rem] sm:h-[28rem]">
          <motion.div
            className="absolute top-0 left-0 w-[62%] overflow-hidden rounded-[2rem] shadow-2xl"
            initial={{ opacity: 0, rotate: 0, x: 60 }}
            animate={{ opacity: 1, rotate: -6, x: 0 }}
            transition={{ duration: 1.2, ease: EASE_LUSSO, delay: 0.8 }}
          >
            <div className="relative aspect-[4/5]">
              <Image src="/img/ristrutturazione/leonina-prima.jpg" alt="Prima" fill preload sizes="40vw" className="object-cover saturate-[0.6]" />
              <span className="absolute top-4 left-4 rounded-full bg-inchiostro/80 px-3 py-1 text-xs font-bold text-white">Prima</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute right-0 bottom-0 w-[62%] overflow-hidden rounded-[2rem] shadow-2xl"
            initial={{ opacity: 0, rotate: 0, x: -60 }}
            animate={{ opacity: 1, rotate: 5, x: 0 }}
            transition={{ duration: 1.2, ease: EASE_LUSSO, delay: 1.1 }}
          >
            <div className="relative aspect-[4/5]">
              <Image src="/img/ristrutturazione/leonina-dopo.jpg" alt="Dopo" fill preload sizes="40vw" className="object-cover" />
              <span className="absolute top-4 left-4 rounded-full bg-sole px-3 py-1 text-xs font-bold text-inchiostro">Dopo</span>
            </div>
          </motion.div>
          <motion.span
            className="absolute top-1/2 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-corallo font-display text-sm font-bold text-white shadow-xl"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 1.6 }}
          >
            0 €
          </motion.span>
        </div>
      </div>
    </section>
  )
}
