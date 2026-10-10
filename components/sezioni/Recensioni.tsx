'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Stelle from '@/components/ui/Stelle'
import { RECENSIONI_AIRBNB, RECENSIONI_GOOGLE, type Recensione } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

const FONTI = {
  google: { etichetta: 'Proprietari · Google', dati: RECENSIONI_GOOGLE, fonte: 'Google' },
  airbnb: { etichetta: 'Ospiti · Airbnb', dati: RECENSIONI_AIRBNB, fonte: 'Airbnb' },
} as const

type Fonte = keyof typeof FONTI

const formattaData = (d: string) => new Date(d).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

function LogoFonte({ fonte }: { fonte: string }) {
  if (fonte === 'Google')
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-label="Google" role="img">
        <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.9 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.7-2.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5.4 12 5.4z" />
      </svg>
    )
  return (
    <svg viewBox="0 0 32 32" className="size-5 text-[#FF385C]" aria-label="Airbnb" role="img">
      <path fill="currentColor" d="M16 22.6c-1.6-2-2.6-3.9-3-5.5-.3-1.4-.1-2.5.5-3.3a3 3 0 0 1 2.5-1.2c1 0 1.9.4 2.5 1.2.6.8.8 1.9.5 3.3-.4 1.6-1.4 3.5-3 5.5Zm11.6 1.4c-.2 1.5-1.2 2.8-2.7 3.4-.7.3-1.5.4-2.3.3-.8-.1-1.6-.4-2.4-.8-1.1-.6-2.2-1.6-3.4-2.9 1.9-2.4 3.1-4.6 3.5-6.6.2-1 .3-1.9.1-2.7a5 5 0 0 0-1-2.3A5.2 5.2 0 0 0 16 10.3c-1.7 0-3.3.8-4.4 2.1-.5.7-.9 1.5-1 2.3-.2.8-.1 1.7.1 2.7.4 2 1.6 4.2 3.5 6.6-1.2 1.3-2.3 2.3-3.4 2.9-.8.4-1.6.7-2.4.8-.8.1-1.6 0-2.3-.3-1.5-.6-2.5-1.9-2.7-3.4-.1-.8 0-1.5.3-2.4l.4-1 .5-1.1v-.1C6.5 15.1 8.5 11 10.7 6.8l.1-.2.6-1.2c.2-.4.4-.8.7-1.1.5-.7 1.3-1.2 2.3-1.3h1.2c1 .1 1.8.6 2.3 1.3.3.3.5.7.7 1.1l.6 1.2.1.2c2.2 4.2 4.2 8.3 5.6 11.6v.1l.5 1.1.4 1c.3.9.4 1.6.3 2.4Z" />
    </svg>
  )
}

function Scheda({ r, fonte }: { r: Recensione; fonte: string }) {
  return (
    <figure className="flex h-full w-[82vw] shrink-0 flex-col justify-between rounded-3xl bg-white p-7 shadow-[0_20px_40px_-28px_rgba(29,34,54,0.4)] sm:w-[24rem] md:p-8">
      <div>
        <div className="flex items-center justify-between">
          <Stelle className="text-sole" />
          <LogoFonte fonte={fonte} />
        </div>
        <blockquote lang={r.lingua} className="mt-5 line-clamp-6 text-base leading-relaxed">“{r.testo}”</blockquote>
      </div>
      <figcaption className="mt-8 flex items-center justify-between border-t border-linea pt-5 text-sm">
        <span className="font-semibold">{r.nome}</span>
        <span className="text-pietra">{formattaData(r.data)}</span>
      </figcaption>
    </figure>
  )
}

export default function Recensioni({ iniziale = 'google', numero }: { iniziale?: Fonte; numero?: string }) {
  const [fonte, setFonte] = useState<Fonte>(iniziale)
  const attiva = FONTI[fonte]

  return (
    <section aria-labelledby="titolo-recensioni" className="overflow-hidden bg-pesca">
      <div className="contenitore pt-20 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Etichetta numero={numero} className="mb-6 text-corallo">Recensioni verificate</Etichetta>
            <TestoDiviso as="h2" testo="5 stelle, *tutte vere.*" className="titolo-xl" />
            <span id="titolo-recensioni" className="sr-only">Recensioni di proprietari e ospiti</span>
          </div>
          <div className="lg:justify-self-end">
            <div role="tablist" aria-label="Fonte delle recensioni" className="inline-flex rounded-full bg-white p-1 shadow-sm">
              {(Object.keys(FONTI) as Fonte[]).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={fonte === k}
                  onClick={() => setFonte(k)}
                  className="relative rounded-full px-5 py-2.5 text-sm font-semibold"
                >
                  {fonte === k && (
                    <motion.span layoutId="scheda-attiva" className="absolute inset-0 rounded-full bg-inchiostro" transition={{ duration: 0.6, ease: EASE_LUSSO }} />
                  )}
                  <span className={`relative transition-colors duration-300 ${fonte === k ? 'text-crema' : ''}`}>{FONTI[k].etichetta}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-pietra">Tutte a 5 stelle · Verificate da Trustindex sulla fonte originale.</p>
          </div>
        </div>
      </div>

      <div className="group mt-12 pb-20 md:pb-28" role="tabpanel" aria-label={attiva.etichetta}>
        <AnimatePresence mode="wait">
          <motion.div
            key={fonte}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.7, ease: EASE_LUSSO }}
          >
            {/* Su desktop scorrono da sole (si fermano al passaggio del mouse); su telefono si sfogliano col dito */}
            <div className="senza-barra overflow-x-auto md:overflow-visible">
              <div className="flex w-max motion-safe:md:nastro md:group-hover:[animation-play-state:paused] items-stretch gap-5 px-4 sm:px-8 md:px-0" style={{ '--durata': `${attiva.dati.length * 9}s` } as React.CSSProperties}>
                {[...attiva.dati, ...attiva.dati].map((r, i) => (
                  <div key={`${r.nome}-${i}`} aria-hidden={i >= attiva.dati.length ? true : undefined} className={i >= attiva.dati.length ? 'hidden md:flex' : 'flex'}>
                    <Scheda r={r} fonte={attiva.fonte} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
