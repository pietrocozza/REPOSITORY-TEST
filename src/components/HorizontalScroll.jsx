import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const passi = [
  { n: '01', titolo: 'Ascoltiamo', testo: 'Capiamo chi sei e cosa vuoi ottenere.', colore: 'bg-senape' },
  { n: '02', titolo: 'Disegniamo', testo: 'Prepariamo le schermate, prima per il telefono.', colore: 'bg-rosso text-crema' },
  { n: '03', titolo: 'Animiamo', testo: 'Aggiungiamo i movimenti che danno vita alla pagina.', colore: 'bg-verde text-crema' },
  { n: '04', titolo: 'Pubblichiamo', testo: 'Il sito va online e lo vede tutto il mondo.', colore: 'bg-inchiostro text-crema' },
]

// Sezione in cui scorrendo verso il BASSO le card si spostano di LATO.
// Come funziona: la sezione è molto alta (300% dello schermo); dentro c'è una
// parte "appiccicata" (sticky) che resta ferma, e noi spostiamo le card in orizzontale
// in base a quanto hai scrollato.
export default function HorizontalScroll() {
  const ref = useRef(null)
  const binario = useRef(null)
  const [distanza, setDistanza] = useState(0)

  // Misuriamo quanto è più larga la fila di card rispetto allo schermo:
  // è esattamente quanto dobbiamo spostarla verso sinistra.
  useLayoutEffect(() => {
    const misura = () => setDistanza(binario.current.scrollWidth - window.innerWidth)
    misura()
    window.addEventListener('resize', misura)
    return () => window.removeEventListener('resize', misura)
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distanza])

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden">
        <h2 className="mb-8 px-4 font-titolo text-6xl uppercase md:px-10 md:text-9xl">Come lavoriamo</h2>
        <motion.div ref={binario} style={{ x }} className="flex w-max gap-4 px-4 md:gap-8 md:px-10">
          {passi.map((p) => (
            <div
              key={p.n}
              className={`${p.colore} flex h-[50svh] w-[80vw] shrink-0 flex-col justify-between rounded-2xl p-6 md:h-[55svh] md:w-[40vw] md:p-10`}
            >
              <span className="font-titolo text-6xl md:text-8xl">{p.n}</span>
              <div>
                <h3 className="font-titolo text-4xl uppercase md:text-6xl">{p.titolo}</h3>
                <p className="mt-2 max-w-sm text-base md:text-lg">{p.testo}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
