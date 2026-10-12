'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

// Badge ufficiali dei portali, con il loro sfondo bianco
const BADGE = [
  { src: '/img/partner/airbnb-superhost@3x.png', alt: 'Airbnb Superhost', w: 981, h: 447 },
  { src: '/img/partner/booking-premier-partner@3x.png', alt: 'Booking.com Premier Partner', w: 1347, h: 309 },
  { src: '/img/partner/vrbo-premier-partner@3x.png', alt: 'Vrbo Premier Partner', w: 1098, h: 528 },
]

// Bordo a strati e ombra: la scheda bianca sembra spessa e appoggiata sulla pagina
const RILIEVO = 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 0 #ece3d6, 0 2px 0 #e4d9c8, 0 3px 0 #dccfbc, 0 4px 0 #d3c5b0, 0 16px 26px -10px rgba(29,34,54,0.4)'

export default function Partner() {
  return (
    <section aria-labelledby="titolo-partner" className="bg-sabbia">
      <div className="contenitore pt-12 pb-8 md:pt-16">
        <h2 id="titolo-partner" className="mx-auto max-w-3xl text-center font-display text-[clamp(1.6rem,6vw,2.75rem)] leading-tight font-bold tracking-tight">
          Su <span className="italic text-corallo">Airbnb, Booking e Vrbo</span>, con i badge dei migliori.
        </h2>
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-3 items-center gap-3 md:gap-6">
          {BADGE.map((b, i) => (
            <motion.li
              key={b.src}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4, scale: 1.04 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: i * 0.1 }}
              style={{ boxShadow: RILIEVO }}
              className="relative flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-white px-3 md:h-24 md:rounded-3xl md:px-6"
            >
              <Image src={b.src} alt={b.alt} width={b.w} height={b.h} sizes="(min-width: 768px) 240px, 30vw" className="max-h-10 w-auto object-contain md:max-h-14" />
              {/* riflesso lucido: metà alta più chiara e una luce che attraversa la scheda */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-white/0" />
              <span
                aria-hidden="true"
                className="badge-luce pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-white/0 via-white/80 to-white/0"
                style={{ animationDelay: `${i * 0.6}s` }}
              />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
