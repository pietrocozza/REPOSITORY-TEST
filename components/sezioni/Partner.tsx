'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

// Riconoscimenti dei portali
const BADGE = [
  { src: '/img/partner/airbnb-superhost@3x.png', alt: 'Airbnb Superhost', w: 981, h: 447, ruota: -7 },
  { src: '/img/partner/booking-premier-partner@3x.png', alt: 'Booking.com Premier Partner', w: 1347, h: 309, ruota: 0 },
  { src: '/img/partner/vrbo-premier-partner@3x.png', alt: 'Vrbo Premier Partner', w: 1098, h: 528, ruota: 7 },
]

// Bordo sotto a strati: la scheda sembra spessa e staccata dallo schermo
const SPESSORE =
  'inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 0 #ece3d6, 0 2px 0 #e6dccd, 0 3px 0 #e0d4c3, 0 4px 0 #d9ccba, 0 5px 0 #d2c4b0, 0 6px 0 #cbbca6, 0 22px 30px -12px rgba(29,34,54,0.45)'

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
              whileHover={{ rotateX: 0, rotateY: 0, y: -4, scale: 1.04 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: i * 0.1 }}
              style={{ boxShadow: SPESSORE, transformStyle: 'preserve-3d' }}
              className="flex h-16 items-center justify-center rounded-2xl bg-white px-3 md:h-20 md:px-5"
            >
              <Image src={b.src} alt={b.alt} width={b.w} height={b.h} sizes="(min-width: 768px) 200px, 30vw" className="max-h-9 w-auto object-contain md:max-h-12" />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
