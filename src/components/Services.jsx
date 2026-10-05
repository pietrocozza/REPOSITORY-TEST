import { motion } from 'motion/react'

const servizi = [
  { nome: 'Siti web', desc: 'Siti veloci, belli da vedere e comodi da usare su ogni schermo.' },
  { nome: 'Animazioni', desc: 'Movimenti fluidi che guidano lo sguardo senza distrarre.' },
  { nome: 'Identità visiva', desc: 'Logo, colori e caratteri che raccontano chi sei.' },
  { nome: 'Social', desc: 'Contenuti coerenti con il sito, pronti da pubblicare.' },
]

// Elenco dei servizi: ogni riga compare quando ci arrivi scorrendo
// e cambia colore quando ci passi sopra col mouse.
export default function Services() {
  return (
    <section id="servizi" className="bg-inchiostro px-4 py-24 text-crema md:px-10 md:py-40">
      <h2 className="mb-16 font-titolo text-6xl uppercase md:text-9xl">Servizi</h2>
      <ul>
        {servizi.map((s, i) => (
          <motion.li
            key={s.nome}
            // initial = come parte, whileInView = come diventa quando è visibile
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            className="group border-t border-crema/20 last:border-b"
          >
            <div className="flex flex-col gap-2 py-8 transition-colors duration-300 group-hover:text-senape md:flex-row md:items-center md:justify-between md:py-10">
              <div className="flex items-baseline gap-4 md:gap-8">
                <span className="text-sm opacity-50">0{i + 1}</span>
                <h3 className="font-titolo text-4xl uppercase transition-transform duration-500 group-hover:translate-x-4 md:text-7xl">
                  {s.nome}
                </h3>
              </div>
              <p className="max-w-sm text-base opacity-70 md:text-right">{s.desc}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
