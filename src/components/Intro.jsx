import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const testo =
  'Crediamo che un sito debba farsi ricordare. Per questo ogni parola, ogni immagine e ogni movimento è pensato per accompagnare chi visita, dal telefono come dal computer.'

// Una parola che si "accende" quando la scorri
function Parola({ children, progresso, intervallo }) {
  const opacita = useTransform(progresso, intervallo, [0.15, 1])
  return (
    <motion.span style={{ opacity: opacita }} className="mr-[0.25em] inline-block">
      {children}
    </motion.span>
  )
}

// Paragrafo in cui le parole si illuminano una alla volta mentre scendi.
export default function Intro() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.4'] })
  const parole = testo.split(' ')

  return (
    <section id="chi-siamo" className="px-4 py-24 md:px-10 md:py-40">
      <p className="mb-8 text-sm uppercase tracking-widest text-rosso">Chi siamo</p>
      <p ref={ref} className="max-w-5xl text-3xl font-medium leading-tight md:text-6xl">
        {parole.map((p, i) => {
          const inizio = i / parole.length
          const fine = inizio + 1 / parole.length
          return (
            <Parola key={i} progresso={scrollYProgress} intervallo={[inizio, fine]}>
              {p}
            </Parola>
          )
        })}
      </p>
    </section>
  )
}
