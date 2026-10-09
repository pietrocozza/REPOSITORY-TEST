'use client'

import Image from 'next/image'
import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { APPARTAMENTI } from '@/lib/contenuti'
import { useMediaQuery } from '@/lib/hooks'

// Le foto degli appartamenti scorrono in orizzontale mentre la pagina scende (da desktop)
export default function Appartamenti() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const contenitore = useRef<HTMLDivElement>(null)
  const binario = useRef<HTMLUListElement>(null)
  const [distanza, setDistanza] = useState(0)

  useLayoutEffect(() => {
    const el = binario.current
    if (!el) return
    const misura = () => setDistanza(Math.max(0, el.scrollWidth - window.innerWidth))
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(el)
    window.addEventListener('resize', misura)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', misura)
    }
  }, [desktop])

  const { scrollYProgress } = useScroll({ target: contenitore, offset: ['start start', 'end end'] })
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [0, -distanza]), { stiffness: 120, damping: 30, mass: 0.3 })
  const barra = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const intestazione = (
    <div className="contenitore flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Etichetta numero="04" className="mb-6 text-nebbia">Appartamenti</Etichetta>
        <TestoDiviso as="h2" testo="Case che *gestiamo* ogni giorno." className="titolo-xl" accento="text-terracotta-chiara" />
      </div>
      <p className="max-w-sm text-sm text-nebbia">Dal Rione Monti a Brera: alcune delle strutture che curiamo tra Roma e Milano.</p>
    </div>
  )

  const schede = APPARTAMENTI.map((a, i) => (
    <li key={`${a.nome}-${i}`} className="w-[78vw] shrink-0 snap-start sm:w-[52vw] lg:w-[min(36vw,78vh)]">
      <figure className="group" data-cursore="Vedi">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm lg:aspect-[3/2]">
          <Image src={a.foto} alt={`${a.nome}, ${a.dettaglio}`} fill sizes="(min-width:1024px) 36vw, 78vw" className="object-cover transition-transform duration-[1.4s] ease-lusso group-hover:scale-105" />
          {a.citta && (
            <span className="absolute top-4 left-4 rounded-full bg-avorio/90 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.2em] text-inchiostro uppercase backdrop-blur">
              {a.citta}
            </span>
          )}
        </div>
        <figcaption className="mt-4 flex items-baseline justify-between gap-4">
          <span className="font-display text-2xl md:text-3xl">{a.nome}</span>
          <span className="text-right text-xs text-nebbia">{a.dettaglio}</span>
        </figcaption>
      </figure>
    </li>
  ))

  if (!desktop) {
    return (
      <section aria-label="Appartamenti" className="bg-notte py-24 text-avorio">
        {intestazione}
        <ul className="senza-barra mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 sm:scroll-pl-8 sm:px-8">{schede}</ul>
      </section>
    )
  }

  return (
    <section aria-label="Appartamenti" ref={contenitore} className="relative bg-notte text-avorio" style={{ height: `calc(100vh + ${distanza}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {intestazione}
        <motion.ul ref={binario} style={{ x }} className="mt-10 flex w-max gap-8 px-12">
          {schede}
        </motion.ul>
        <div className="contenitore mt-10">
          <div className="h-px w-full bg-white/15">
            <motion.div className="h-px bg-terracotta-chiara" style={{ width: barra }} />
          </div>
        </div>
      </div>
    </section>
  )
}
