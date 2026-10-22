'use client'

import { motion } from 'motion/react'
import Pulsante from '@/components/ui/Pulsante'
import Contatore from '@/components/ui/Contatore'
import { NOTA_COMMISSIONE, PIANI } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

// Amministrazione inclusa nella commissione
const CONTABILITA = ['Contabilità e incassi con mandato all’incasso', 'Report mensile di incassi e spese', 'Possiamo fare da sostituto d’imposta']

/** La formula di gestione: una sola, tutto incluso. Con `conRistruttura` rimanda alla ristrutturazione gratuita */
export default function Piani({ conRistruttura = true }: { conRistruttura?: boolean }) {
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
          <ul className="mt-6 space-y-2">
            {CONTABILITA.map((v) => (
              <li key={v} className="flex items-start gap-2.5 text-sm font-semibold">
                <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-sole" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {v}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Pulsante href="/contatti" variante="chiaro">
              Scopri di più
            </Pulsante>
          </div>
        </div>
      </motion.article>
      {conRistruttura && (
        <div className="mt-5 grid gap-5 rounded-[2rem] bg-limone p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight md:text-3xl">La casa ha bisogno di lavori?</p>
            <p className="mt-2 max-w-2xl text-inchiostro/75">Se ce la dai in affitto, la ristrutturiamo noi a spese nostre: bagni, cucina e arredi nuovi. Solo per case nelle zone centrali.</p>
          </div>
          <Pulsante href="/ristruttura-gratis">Ristruttura gratis</Pulsante>
        </div>
      )}
    </div>
  )
}
