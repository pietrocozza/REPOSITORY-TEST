'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Faq } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Elenco di domande a fisarmonica: una aperta alla volta */
export default function Domande({ domande, scuro = false, chiuse = false }: { domande: Faq[]; scuro?: boolean; chiuse?: boolean }) {
  const [aperta, setAperta] = useState<number | null>(chiuse ? null : 0)

  return (
    <ul className="space-y-3">
      {domande.map((d, i) => {
        const open = aperta === i
        return (
          <li key={d.domanda} className={`rounded-3xl transition-colors duration-500 ${open ? (scuro ? 'bg-white/10' : 'bg-white shadow-[0_20px_40px_-30px_rgba(29,34,54,0.4)]') : scuro ? 'bg-white/5' : 'bg-sabbia'}`}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`risposta-${i}`}
                id={`domanda-${i}`}
                onClick={() => setAperta(open ? null : i)}
                className="group flex w-full items-start justify-between gap-6 p-5 text-left md:p-6"
              >
                <span className="flex">
                  
                  <span className="font-display text-lg leading-snug font-semibold tracking-tight transition-colors duration-300 group-hover:text-corallo md:text-xl">{d.domanda}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`relative size-8 shrink-0 rounded-full transition-all duration-500 ease-lusso ${open ? 'rotate-45 bg-corallo text-white' : 'bg-white text-inchiostro'}`}
                >
                  <span className="absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-current" />
                  <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-y-1/2 bg-current" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={`risposta-${i}`}
                  role="region"
                  aria-labelledby={`domanda-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.6, ease: EASE_LUSSO }}
                  className="overflow-hidden"
                >
                  <div className={`max-w-3xl px-5 pb-6 md:px-6 ${scuro ? 'text-crema/80' : 'text-pietra'}`}>
                    <p className="leading-relaxed">{d.risposta}</p>
                    {d.punti && (
                      <ol className="mt-4 list-decimal space-y-1.5 pl-5">
                        {d.punti.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
