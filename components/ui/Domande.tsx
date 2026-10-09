'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Faq } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Elenco di domande a fisarmonica: una aperta alla volta */
export default function Domande({ domande, scuro = false }: { domande: Faq[]; scuro?: boolean }) {
  const [aperta, setAperta] = useState<number | null>(0)
  const bordo = scuro ? 'border-white/15' : 'border-linea'

  return (
    <ul className={`border-t ${bordo}`}>
      {domande.map((d, i) => {
        const open = aperta === i
        return (
          <li key={d.domanda} className={`border-b ${bordo}`}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`risposta-${i}`}
                id={`domanda-${i}`}
                onClick={() => setAperta(open ? null : i)}
                className="group flex w-full items-start justify-between gap-6 py-6 text-left md:py-8"
              >
                <span className="flex gap-5 md:gap-8">
                  <span className={`mt-1.5 font-display text-sm italic ${scuro ? 'text-nebbia' : 'text-pietra'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-2xl leading-tight transition-colors duration-300 group-hover:text-terracotta md:text-3xl">{d.domanda}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`relative mt-2 size-8 shrink-0 rounded-full border transition-all duration-500 ease-lusso ${bordo} ${open ? 'rotate-45 border-terracotta bg-terracotta text-avorio' : ''}`}
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
                  <div className={`max-w-3xl pb-8 pl-10 md:pl-14 ${scuro ? 'text-avorio/80' : 'text-pietra'}`}>
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
