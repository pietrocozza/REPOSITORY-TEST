'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Articolo } from '@/lib/articoli'
import { formattaData } from '@/lib/articoli'
import { EASE_LUSSO } from '@/lib/animazioni'

const CATEGORIE = ['Tutti', 'Guide', 'Normativa', 'Mercato', 'Gestione'] as const
const COLORE_CATEGORIA: Record<string, string> = { Guide: 'bg-salvia', Normativa: 'bg-cielo', Mercato: 'bg-limone', Gestione: 'bg-pesca' }

export function Scheda({ a, grande = false }: { a: Articolo; grande?: boolean }) {
  return (
    <Link href={`/blog/${a.slug}`} className="group block h-full" data-cursore="Leggi">
      <article className={`flex h-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_-35px_rgba(29,34,54,0.45)] transition-transform duration-500 group-hover:-translate-y-1.5 ${grande ? 'lg:grid lg:grid-cols-[1.3fr_1fr]' : ''}`}>
        <div className={`relative overflow-hidden ${grande ? 'aspect-[16/10] lg:aspect-auto lg:min-h-[26rem]' : 'aspect-[16/10]'}`}>
          <Image src={a.copertina} alt="" fill sizes={grande ? '(min-width:1024px) 55vw, 100vw' : '(min-width:1024px) 30vw, (min-width:640px) 50vw, 100vw'} className="object-cover transition-transform duration-1000 ease-lusso group-hover:scale-105" />
          <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold text-inchiostro ${COLORE_CATEGORIA[a.categoria]}`}>{a.categoria}</span>
        </div>
        <div className={`flex flex-1 flex-col p-6 ${grande ? 'md:p-10 lg:justify-center' : ''}`}>
          <p className="text-sm text-pietra">
            <time dateTime={a.data}>{formattaData(a.data)}</time> · {a.minuti} min
          </p>
          <h3 className={`mt-2 font-display font-bold tracking-tight transition-colors duration-300 group-hover:text-corallo ${grande ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'}`}>{a.titolo}</h3>
          <p className={`mt-3 text-pietra ${grande ? 'text-lg' : 'line-clamp-3'}`}>{a.estratto}</p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-corallo">
            Leggi l’articolo
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </article>
    </Link>
  )
}

export default function ElencoArticoli({ articoli }: { articoli: Articolo[] }) {
  const [categoria, setCategoria] = useState<(typeof CATEGORIE)[number]>('Tutti')
  const filtrati = categoria === 'Tutti' ? articoli : articoli.filter((a) => a.categoria === categoria)
  const [primo, ...altri] = filtrati

  return (
    <div>
      <div role="tablist" aria-label="Categorie" className="mb-10 flex flex-wrap gap-2">
        {CATEGORIE.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={categoria === c}
            onClick={() => setCategoria(c)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-300 ${categoria === c ? 'bg-inchiostro text-white' : 'bg-white hover:bg-sabbia'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={categoria} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: EASE_LUSSO }}>
          {primo && <Scheda a={primo} grande />}
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {altri.map((a) => (
              <li key={a.slug}>
                <Scheda a={a} />
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
