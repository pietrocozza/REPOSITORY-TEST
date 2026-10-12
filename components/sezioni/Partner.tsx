'use client'

import { motion } from 'motion/react'
import { EASE_LUSSO } from '@/lib/animazioni'

// Riconoscimenti dei portali: badge nostri, disegnati in codice (nitidi a qualsiasi risoluzione)
const BADGE = [
  { portale: 'Airbnb', titolo: 'Superhost', fondo: 'from-[#ff6b5c] via-corallo to-[#a8320f]', icona: 'medaglia' },
  { portale: 'Booking.com', titolo: 'Premier Partner', fondo: 'from-[#3a4f8f] via-[#24305a] to-inchiostro', icona: 'stella' },
  { portale: 'Vrbo', titolo: 'Premier Partner', fondo: 'from-[#5b93d6] via-azzurro to-[#1f4b80]', icona: 'corona' },
] as const

const ICONE = {
  medaglia: <path d="M8 2h8l-2 6h-4L8 2Zm4 7a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2.6 1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3L12 11.6Z" fill="currentColor" fillRule="evenodd" />,
  stella: <path d="m12 2 2.9 6.2 6.8.8-5 4.6 1.4 6.7L12 16.9l-6.1 3.4 1.4-6.7-5-4.6 6.8-.8L12 2Z" fill="currentColor" />,
  corona: <path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Zm2 13h14v2H5v-2Z" fill="currentColor" />,
}

// Bordo a strati e ombra: il badge sembra spesso e appoggiato sopra la pagina
const RILIEVO =
  'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.18), 0 1px 0 rgba(0,0,0,0.22), 0 2px 0 rgba(0,0,0,0.18), 0 3px 0 rgba(0,0,0,0.14), 0 4px 0 rgba(0,0,0,0.1), 0 18px 28px -10px rgba(29,34,54,0.55)'

export default function Partner() {
  return (
    <section aria-labelledby="titolo-partner" className="bg-sabbia">
      <div className="contenitore pt-12 pb-8 md:pt-16">
        <h2 id="titolo-partner" className="mx-auto max-w-3xl text-center font-display text-[clamp(1.6rem,6vw,2.75rem)] leading-tight font-bold tracking-tight">
          Su <span className="italic text-corallo">Airbnb, Booking e Vrbo</span>, con i badge dei migliori.
        </h2>
        <ul className="mx-auto mt-8 grid max-w-4xl grid-cols-3 gap-2.5 [perspective:800px] md:gap-6">
          {BADGE.map((b, i) => (
            <motion.li
              key={b.portale}
              initial={{ opacity: 0, y: 30, rotateX: 25 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              whileHover={{ y: -4, scale: 1.04 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_LUSSO, delay: i * 0.1 }}
              style={{ boxShadow: RILIEVO }}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br px-2.5 py-3 text-center text-white md:rounded-3xl md:px-5 md:py-5 ${b.fondo}`}
            >
              {/* riflesso lucido: metà alta più chiara e una luce che passa */}
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-white/0" />
              <span aria-hidden="true" className="badge-luce absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-white/0 via-white/45 to-white/0" style={{ animationDelay: `${i * 0.6}s` }} />
              <span className="relative mx-auto flex size-8 items-center justify-center rounded-full bg-white/20 text-sole ring-1 ring-white/40 md:size-11">
                <svg viewBox="0 0 24 24" className="size-5 drop-shadow md:size-6" aria-hidden="true">
                  {ICONE[b.icona]}
                </svg>
              </span>
              <span className="relative mt-2 block text-[0.65rem] font-bold tracking-[0.14em] text-white/85 uppercase md:text-xs">{b.portale}</span>
              <span className="relative block font-display text-[clamp(0.85rem,3.6vw,1.45rem)] leading-tight font-bold tracking-tight [text-shadow:0_1px_0_rgba(0,0,0,0.25)]">
                {b.titolo}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
