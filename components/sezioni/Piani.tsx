'use client'

import { motion } from 'motion/react'
import Pulsante from '@/components/ui/Pulsante'
import Contatore from '@/components/ui/Contatore'
import { EXTRA, NOTA_COMMISSIONE, PIANI } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

/** La formula di gestione: una sola, tutto incluso */
export default function Piani({ conExtra = true }: { conExtra?: boolean }) {
  const p = PIANI[0]
  return (
    <div>
      <motion.article
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 0.9, ease: EASE_LUSSO }}
        className="relative grid gap-10 overflow-hidden rounded-[2rem] bg-corallo p-7 text-white md:p-12 lg:grid-cols-[1fr_1.3fr] lg:items-center"
      >
        <span aria-hidden="true" className="absolute -top-16 -right-16 size-72 rounded-full bg-sole/40 blur-2xl" />
        <div className="relative">
          <span className="rounded-full bg-sole px-3 py-1.5 text-xs font-bold text-inchiostro">Tutto incluso</span>
          <h3 className="mt-5 font-display text-3xl font-bold tracking-tight md:text-4xl">{p.nome}</h3>
          <p className="mt-1 text-white/85">{p.sottotitolo}</p>
          <p className="mt-8 flex items-end gap-3">
            <span className="font-display text-[clamp(5rem,12vw,9rem)] leading-[0.8] font-bold tracking-tighter">
              <Contatore a={p.percentuale} suffisso="%" durata={1.4} />
            </span>
            <span className="pb-2 text-sm font-medium text-white/85">sull’affitto generato</span>
          </p>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-white/75">{NOTA_COMMISSIONE}</p>
        </div>
        <div className="relative">
          <ul className="flex flex-wrap gap-2">
            {p.voci.map((v) => (
              <li key={v} className="rounded-full bg-white/15 px-3.5 py-2 text-sm font-semibold">
                {v}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Pulsante href="/contatti" variante="chiaro">Scopri di più</Pulsante>
          </div>
        </div>
      </motion.article>
      {conExtra && (
        <div className="mt-5 grid gap-3 rounded-[2rem] bg-limone p-7 md:grid-cols-[8rem_1fr] md:items-center md:p-10">
          <p className="font-display text-3xl font-bold tracking-tight">Extra</p>
          <ul className="flex flex-wrap gap-2">
            {EXTRA.map((e) => (
              <li key={e} className="rounded-full bg-white px-4 py-2 text-sm font-medium">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
