'use client'

import { motion } from 'motion/react'
import Pulsante from '@/components/ui/Pulsante'
import Contatore from '@/components/ui/Contatore'
import { EXTRA, PIANI } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

export default function Piani({ conExtra = true }: { conExtra?: boolean }) {
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        {PIANI.map((p, i) => {
          const pieno = i === 1
          return (
            <motion.article
              key={p.nome}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ duration: 0.9, ease: EASE_LUSSO, delay: i * 0.12 }}
              className={`relative flex flex-col overflow-hidden rounded-[2rem] p-7 md:p-10 ${pieno ? 'bg-corallo text-white' : 'bg-white text-inchiostro shadow-[0_20px_50px_-30px_rgba(29,34,54,0.35)]'}`}
            >
              {pieno && (
                <span aria-hidden="true" className="absolute -top-16 -right-16 size-56 rounded-full bg-sole/40 blur-2xl" />
              )}
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{p.nome}</h3>
                  <p className={`mt-1 ${pieno ? 'text-white/85' : 'text-pietra'}`}>{p.sottotitolo}</p>
                </div>
                {pieno && <span className="shrink-0 rounded-full bg-sole px-3 py-1.5 text-xs font-bold text-inchiostro">Tutto incluso</span>}
              </div>
              <p className="relative mt-8 flex items-end gap-3">
                <span className="font-display text-[clamp(4.5rem,10vw,7.5rem)] leading-[0.8] font-bold tracking-tighter">
                  <Contatore a={p.percentuale} suffisso="%" durata={1.4} />
                </span>
                <span className={`pb-2 text-sm font-medium ${pieno ? 'text-white/85' : 'text-pietra'}`}>sull’affitto generato</span>
              </p>
              <ul className="relative mt-8 flex flex-wrap gap-2">
                {p.voci.map((v) => (
                  <li key={v} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${pieno ? 'bg-white/15' : 'bg-sabbia'}`}>
                    {v}
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto pt-8">
                <Pulsante href="/contatti" variante={pieno ? 'chiaro' : 'pieno'}>Scopri di più</Pulsante>
              </div>
            </motion.article>
          )
        })}
      </div>
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
