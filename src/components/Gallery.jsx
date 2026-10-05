import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Al posto delle foto vere usiamo blocchi colorati:
// per mettere le tue immagini, sostituisci il div colorato con un <img>.
const lavori = [
  { titolo: 'Ristorante Aurora', tipo: 'Sito web', colore: 'bg-rosso', velocita: -80 },
  { titolo: 'Caffè Nebbia', tipo: 'Identità visiva', colore: 'bg-verde', velocita: 120 },
  { titolo: 'Festival del Mare', tipo: 'Campagna', colore: 'bg-senape', velocita: -40 },
  { titolo: 'Libreria Ombra', tipo: 'E-commerce', colore: 'bg-inchiostro', velocita: 90 },
]

function Card({ lavoro, indice }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  // Ogni card si muove a una velocità diversa: è l'effetto "parallasse"
  const y = useTransform(scrollYProgress, [0, 1], [lavoro.velocita, -lavoro.velocita])

  return (
    <motion.article
      ref={ref}
      style={{ y }}
      className={`group ${indice % 2 === 1 ? 'md:mt-40' : ''}`}
    >
      <a href="#contatti" className="block">
        <div className="overflow-hidden rounded-2xl">
          {/* L'immagine si ingrandisce leggermente al passaggio del mouse */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`${lavoro.colore} flex aspect-[4/5] items-center justify-center`}
          >
            <span className="font-titolo text-8xl text-crema/30 md:text-9xl">0{indice + 1}</span>
          </motion.div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <h3 className="font-titolo text-2xl uppercase md:text-3xl">{lavoro.titolo}</h3>
          <span className="text-sm opacity-60">{lavoro.tipo}</span>
        </div>
      </a>
    </motion.article>
  )
}

// Griglia: 1 colonna sul telefono, 2 colonne da tablet in su
export default function Gallery() {
  return (
    <section id="lavori" className="px-4 py-24 md:px-10 md:py-40">
      <div className="mb-16 flex items-end justify-between">
        <h2 className="font-titolo text-6xl uppercase md:text-9xl">Lavori</h2>
        <span className="text-sm uppercase tracking-widest">(0{lavori.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-10">
        {lavori.map((l, i) => (
          <Card key={l.titolo} lavoro={l} indice={i} />
        ))}
      </div>
    </section>
  )
}
