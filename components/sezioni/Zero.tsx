'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { ZERO } from '@/lib/contenuti'

function Carta({ i, totale, progresso, titolo, testo }: { i: number; totale: number; progresso: MotionValue<number>; titolo: string; testo: string }) {
  // ogni carta, quando arriva la successiva, si rimpicciolisce e si scurisce
  const ultima = i === totale - 1
  const inizio = Math.min((i + 1) / totale, 0.99)
  const scala = useTransform(progresso, [inizio, 1], [1, ultima ? 1 : 1 - (totale - i - 1) * 0.05])
  const luce = useTransform(progresso, [inizio, 1], [1, ultima ? 1 : 0.5])
  const filtro = useTransform(luce, (l) => `brightness(${l})`)
  return (
    <div className="sticky top-24 flex h-[78svh] items-start justify-center md:top-28" style={{ paddingTop: `${i * 1.75}rem` }}>
      <motion.article
        style={{ scale: scala, filter: filtro }}
        className="relative flex h-[60svh] w-full origin-top flex-col justify-between overflow-hidden rounded-sm border border-white/10 bg-[#1d1a16] p-8 md:p-14"
      >
        <div className="flex items-start justify-between">
          <span className="etichetta text-oro">0{i + 1} / 0{totale}</span>
          <span className="font-display text-sm text-nebbia italic">Soluzione Affitto</span>
        </div>
        <div>
          <h3 className="font-display text-[clamp(3.6rem,12vw,10rem)] leading-[0.85] tracking-tight">
            <span className="text-terracotta-chiara italic">Zero</span> {titolo.toLowerCase()}
          </h3>
          <p className="mt-6 max-w-xl text-base text-avorio/80 md:text-lg">{testo}</p>
        </div>
      </motion.article>
    </div>
  )
}

export default function Zero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  return (
    <section aria-labelledby="titolo-zero" className="bg-notte text-avorio">
      <div className="contenitore pt-24 md:pt-36">
        <Etichetta numero="02" className="mb-8 text-nebbia">Fai fruttare il tuo immobile</Etichetta>
        <TestoDiviso as="h2" testo="Fai fruttare il tuo immobile. *Senza nessun pensiero.*" className="titolo-xl max-w-5xl" accento="text-terracotta-chiara" />
        <span id="titolo-zero" className="sr-only">Zero limiti, zero rischi, zero spese</span>
      </div>
      <div ref={ref} className="contenitore pb-10">
        {ZERO.map((z, i) => (
          <Carta key={z.titolo} i={i} totale={ZERO.length} progresso={scrollYProgress} titolo={z.titolo} testo={z.testo} />
        ))}
      </div>
      <div className="contenitore pb-24 md:pb-36">
        <p className="mx-auto max-w-4xl text-center font-display text-3xl leading-tight md:text-5xl">
          Avrai una rendita superiore, <span className="text-terracotta-chiara italic">slegata dal tuo tempo</span> e dal tuo impegno.
        </p>
      </div>
    </section>
  )
}
