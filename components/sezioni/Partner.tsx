'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

// Badge ufficiali dei portali, scontornati
const BADGE = [
  { src: '/img/partner/airbnb-superhost-trasparente.png', alt: 'Airbnb Superhost', w: 979, h: 442 },
  { src: '/img/partner/booking-premier-partner-trasparente.png', alt: 'Booking.com Premier Partner', w: 1347, h: 308 },
  { src: '/img/partner/vrbo-premier-partner-trasparente.png', alt: 'Vrbo Premier Partner', w: 963, h: 422 },
]

// Ombre a strati sotto il badge: sembra in rilievo, appoggiato sulla pagina
const RILIEVO =
  'drop-shadow(0 1px 0 rgba(29,34,54,0.2)) drop-shadow(0 2px 0 rgba(29,34,54,0.14)) drop-shadow(0 3px 0 rgba(29,34,54,0.09)) drop-shadow(0 10px 12px rgba(29,34,54,0.22))'

export default function Partner() {
  return (
    <section aria-labelledby="titolo-partner" className="bg-sabbia">
      <div className="contenitore pt-12 pb-8 md:pt-16">
        <h2 id="titolo-partner" className="mx-auto max-w-3xl text-center font-display text-[clamp(1.6rem,6vw,2.75rem)] leading-tight font-bold tracking-tight">
          Su <span className="italic text-corallo">Airbnb, Booking e Vrbo</span>, con i badge dei migliori.
        </h2>
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-3 items-center gap-4 md:gap-8">
          {BADGE.map((b, i) => {
            // il riflesso lucido usa il badge stesso come maschera: brilla solo sulle scritte e sui loghi
            const maschera = { maskImage: `url(${b.src})`, WebkitMaskImage: `url(${b.src})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }
            return (
              <motion.li
                key={b.src}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.05 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE_LUSSO, delay: i * 0.1 }}
                className="flex justify-center"
              >
                <span className="relative inline-block" style={{ filter: RILIEVO }}>
                  <Image src={b.src} alt={b.alt} width={b.w} height={b.h} sizes="(min-width: 768px) 220px, 30vw" className="block max-h-11 w-auto md:max-h-16" />
                  <span aria-hidden="true" className="absolute inset-0 overflow-hidden" style={maschera}>
                    <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-white/0" />
                    <span className="badge-luce absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-white/0 via-white/70 to-white/0" style={{ animationDelay: `${i * 0.6}s` }} />
                  </span>
                </span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
