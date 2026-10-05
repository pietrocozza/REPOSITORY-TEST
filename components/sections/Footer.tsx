'use client'

import { motion } from 'motion/react'
import Magnetic from '@/components/ui/Magnetic'
import Skyline from '@/components/illustrations/Skyline'
import { INFO } from '@/lib/info'
import { scrollToId } from '@/lib/scroll'
import { useRiduciMovimento } from '@/lib/hooks'

const TITOLO = ['Brace', '&', 'Peperino']

export default function Footer() {
  const reduce = useRiduciMovimento()
  return (
    <footer data-bg="#FFF4E0" className="relative overflow-hidden px-4 pt-24 md:px-10 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 border-t border-nero/15 pt-10 md:flex-row md:items-start md:justify-between">
          <p className="max-w-sm font-display text-2xl italic leading-snug">
            Smash burger nel cuore della Tuscia. Fatti a mano, mangiati con le mani.
          </p>
          <ul className="flex flex-wrap gap-3" aria-label="Social (profili fittizi)">
            {INFO.social.map((s) => (
              <li key={s.nome}>
                <Magnetic>
                  {/* PLACEHOLDER: link ai social fittizi, vedi lib/info.ts */}
                  <a href={s.href} className="flex h-12 items-center rounded-full px-5 text-sm font-semibold ring-1 ring-nero/20 transition-colors hover:bg-nero hover:text-crema">
                    {s.nome}
                  </a>
                </Magnetic>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Titolo gigante: ogni lettera salta quando ci passi sopra */}
      <p
        aria-label={INFO.nome}
        className="mt-16 flex flex-wrap items-baseline justify-center gap-x-[0.18em] font-display text-[19vw] md:text-[clamp(3.4rem,15.5vw,16rem)] leading-[0.85] tracking-[-0.04em] md:mt-24 md:flex-nowrap"
      >
        {TITOLO.map((parola, w) => (
          <span key={w} aria-hidden="true" className={`flex ${w > 0 ? 'italic' : ''} ${w === 1 ? 'text-pomodoro' : ''}`}>
            {[...parola].map((c, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ y: '100%', opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: (w * 5 + i) * 0.04 }}
                whileHover={reduce ? undefined : { y: '-12%', rotate: i % 2 ? 6 : -6, transition: { type: 'spring', stiffness: 500, damping: 10 } }}
              >
                {c}
              </motion.span>
            ))}
          </span>
        ))}
      </p>

      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-3 pb-6 text-sm text-nero/60 md:flex-row md:items-center md:justify-between">
        <p>© {INFO.nome}. Locale inventato, sito dimostrativo: nessun panino è stato davvero ordinato.</p>
        <button
          type="button"
          onClick={() => scrollToId('top')}
          className="group flex h-11 w-fit items-center gap-2 font-semibold text-nero"
        >
          Torna su
          <span className="inline-block transition-transform duration-500 group-hover:-translate-y-1">↑</span>
        </button>
      </div>

      <div aria-hidden="true" className="-mx-4 md:-mx-10">
        <Skyline className="h-24 w-full md:h-36" colore="#1A1A1A" riempimento="#1A1A1A" />
      </div>
    </footer>
  )
}
