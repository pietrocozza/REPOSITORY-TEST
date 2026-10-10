'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

// Riconoscimenti dei portali, come nella sezione "I nostri partner" del sito attuale
const BADGE = [
  { src: '/img/partner/airbnb-superhost.png', alt: 'Airbnb Superhost', w: 327, h: 149, ruota: -3 },
  { src: '/img/partner/booking-premier-partner.png', alt: 'Booking.com Premier Partner', w: 449, h: 103, ruota: 2 },
  { src: '/img/partner/vrbo-premier-partner.png', alt: 'Vrbo Premier Partner', w: 366, h: 176, ruota: -2 },
]

export default function Partner() {
  return (
    <section aria-labelledby="titolo-partner" className="bg-crema">
      <div className="contenitore grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="etichetta mb-3 text-corallo">I nostri partner</p>
          <h2 id="titolo-partner" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Su <span className="italic text-corallo">Airbnb, Booking e Vrbo</span>, con i badge dei migliori.
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {BADGE.map((b, i) => (
            <motion.li
              key={b.src}
              initial={{ opacity: 0, y: 50, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: b.ruota }}
              whileHover={{ rotate: 0, scale: 1.05 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE_LUSSO, delay: i * 0.12 }}
              className="flex h-32 items-center justify-center rounded-3xl bg-white px-8 shadow-[0_20px_40px_-24px_rgba(29,34,54,0.35)]"
            >
              <Image src={b.src} alt={b.alt} width={b.w} height={b.h} className="max-h-16 w-auto object-contain" />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
