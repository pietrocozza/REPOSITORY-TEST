'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Stelle from '@/components/ui/Stelle'
import { RECENSIONI_AIRBNB, RECENSIONI_GOOGLE, type Recensione } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'

const FONTI = {
  google: { etichetta: 'Proprietari', etichettaLunga: 'Proprietari su Google', dati: RECENSIONI_GOOGLE, fonte: 'Google' },
  airbnb: { etichetta: 'Ospiti', etichettaLunga: 'Ospiti su Airbnb', dati: RECENSIONI_AIRBNB, fonte: 'Airbnb' },
} as const

type Fonte = keyof typeof FONTI

const formattaData = (d: string) => new Date(d).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

function LogoFonte({ fonte, className = 'size-5' }: { fonte: string; className?: string }) {
  if (fonte === 'Google')
    return (
      <svg viewBox="0 0 24 24" className={className} aria-label="Google" role="img">
        <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.9 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.7-2.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5.4 12 5.4z" />
      </svg>
    )
  // simbolo ufficiale Airbnb (dal logo usato sul vecchio sito), in alta risoluzione
  return <Image src="/img/partner/airbnb-belo.png" alt="Airbnb" width={64} height={64} className={`${className} object-contain`} />
}

/** Foto profilo dell'autore; se non si carica, mostra l'iniziale */
function Avatar({ r }: { r: Recensione }) {
  const [errore, setErrore] = useState(false)
  if (!r.foto || errore)
    return <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sole font-display text-lg font-bold">{r.nome.charAt(0)}</span>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={r.foto}
      alt=""
      width={44}
      height={44}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrore(true)}
      className="size-11 shrink-0 rounded-full bg-sabbia object-cover"
    />
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
      <figcaption className="mt-8 flex items-center gap-3 border-t border-linea pt-5 text-sm">
        <Avatar r={r} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{r.nome}</span>
          <span className="block text-pietra">{formattaData(r.data)}</span>
        </span>
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
            <div role="tablist" aria-label="Fonte delle recensioni" className="inline-flex rounded-full bg-white p-1.5 shadow-[0_15px_35px_-20px_rgba(29,34,54,0.45)] lg:p-2">
              {(Object.keys(FONTI) as Fonte[]).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={fonte === k}
                  onClick={() => setFonte(k)}
                  className="relative flex items-center gap-3 rounded-full py-2.5 pr-6 pl-2.5 text-base font-bold md:py-3 md:pr-9 md:pl-3 md:text-xl lg:pr-12 lg:text-2xl"
                >
                  {fonte === k && (
                    <motion.span layoutId="scheda-attiva" className="absolute inset-0 rounded-full bg-inchiostro" transition={{ duration: 0.6, ease: EASE_LUSSO }} />
                  )}
                  <span className="relative flex size-8 items-center justify-center rounded-full bg-white md:size-10 lg:size-12"><LogoFonte fonte={FONTI[k].fonte} className="size-5 md:size-6 lg:size-7" /></span>
                  <span className={`relative whitespace-nowrap transition-colors duration-300 ${fonte === k ? 'text-crema' : ''}`}>{FONTI[k].etichetta}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm text-pietra">Tutte a 5 stelle · Verificate da Trustindex sulla fonte originale.</p>
          </div>
        </div>
      </div>

      <div className="group mt-12 pb-20 md:pb-28" role="tabpanel" aria-label={attiva.etichettaLunga}>
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
