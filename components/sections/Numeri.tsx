'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'motion/react'
import { EASE_OUT } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

const NUMERI = [
  { valore: 180, unita: 'g', titolo: 'di manzo maremmano', nota: 'in ogni smash, pesato a mano.' },
  { valore: 48, unita: 'h', titolo: 'di lievitazione', nota: 'per un pane che non si arrende al sugo.' },
  { valore: 33, unita: 'mesi', titolo: 'il conclave più lungo', nota: 'fu a Viterbo. Il tuo panino arriva in 35 minuti.' },
  { valore: 5, unita: '', titolo: 'ingredienti della Tuscia', nota: 'manzo, pecorino, nocciole, patate, olio.' },
]

function Contatore({ a }: { a: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visto = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduce = useRiduciMovimento()
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!visto || reduce) return
    const c = animate(0, a, { duration: 2, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [visto, a, reduce])
  return (
    <span ref={ref} className="tabular-nums">
      {reduce ? a : n}
    </span>
  )
}

export default function Numeri() {
  return (
    <section data-bg="#1A1A1A" aria-label="Brace & Peperino in numeri" className="relative px-4 pb-40 pt-16 text-crema md:px-10 md:pb-52">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow mb-12 flex items-center gap-3 text-cheddar">
          <span className="inline-block h-px w-10 bg-current" /> In numeri
        </p>
        <ul className="grid border-t border-crema/20 sm:grid-cols-2 lg:grid-cols-4">
          {NUMERI.map((n, i) => (
            <motion.li
              key={n.titolo}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.9, ease: EASE_OUT, delay: i * 0.12 }}
              className="group border-b border-crema/20 py-10 sm:odd:border-r lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0"
            >
              <p className="font-display text-[clamp(4rem,9vw,7.5rem)] leading-none transition-transform duration-500 group-hover:-translate-y-1 group-hover:-rotate-2">
                <Contatore a={n.valore} />
                <span className="ml-1 text-[0.4em] italic text-cheddar">{n.unita}</span>
              </p>
              <p className="mt-5 font-display text-2xl italic">{n.titolo}</p>
              <p className="mt-2 max-w-[16rem] text-crema/60">{n.nota}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
