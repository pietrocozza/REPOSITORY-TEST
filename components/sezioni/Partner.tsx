'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

// Riconoscimenti dei portali
const BADGE = [
  { src: '/img/partner/airbnb-superhost-trasparente.png', alt: 'Airbnb Superhost', w: 979, h: 442, ruota: -6 },
  { src: '/img/partner/booking-premier-partner-trasparente.png', alt: 'Booking.com Premier Partner', w: 1347, h: 308, ruota: 0 },
  { src: '/img/partner/vrbo-premier-partner-trasparente.png', alt: 'Vrbo Premier Partner', w: 963, h: 422, ruota: 6 },
]

// Ombre a strati sotto le scritte: sembrano in rilievo, appoggiate sulla pagina
const RILIEVO =
  'drop-shadow(0 1px 0 rgba(29,34,54,0.18)) drop-shadow(0 2px 0 rgba(29,34,54,0.12)) drop-shadow(0 3px 0 rgba(29,34,54,0.08)) drop-shadow(0 10px 12px rgba(29,34,54,0.22))'

export default function Partner() {
  return (
    <section aria-labelledby="titolo-partner" className="bg-sabbia">
      <div className="contenitore pt-10 pb-8 md:pt-14">
        <h2 id="titolo-partner" className="text-center font-display text-lg font-bold tracking-tight md:text-xl">
          Su <span className="italic text-corallo">Airbnb, Booking e Vrbo</span>, con i badge dei migliori.
        </h2>
        <ul className="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-3 [perspective:700px] md:gap-6">
          {BADGE.map((b, i) => (
            <motion.li
              key={b.src}
              initial={{ opacity: 0, y: 30, rotateX: 25 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 10, rotateY: b.ruota }}
              whileHover={{ rotateX: 0, rotateY: 0, y: -4, scale: 1.05 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: i * 0.1 }}
              className="flex h-16 items-center justify-center md:h-20"
            >
              <Image src={b.src} alt={b.alt} width={b.w} height={b.h} sizes="(min-width: 768px) 220px, 30vw" style={{ filter: RILIEVO }} className="max-h-11 w-auto object-contain md:max-h-14" />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
