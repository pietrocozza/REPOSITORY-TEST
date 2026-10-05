import { motion } from 'motion/react'

const anno = new Date().getFullYear()

// Ultima sezione: grande invito a scrivere e piè di pagina.
export default function Contact() {
  return (
    <section id="contatti" className="flex min-h-svh flex-col justify-between bg-rosso px-4 pb-8 pt-24 text-crema md:px-10 md:pt-40">
      <div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-6 text-sm uppercase tracking-widest"
        >
          Hai un progetto?
        </motion.p>
        <h2 className="font-titolo uppercase leading-[0.9] text-[18vw] md:text-[12vw]">
          {['Parliamone', 'insieme'].map((riga, i) => (
            <span key={riga} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: '110%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
              >
                {riga}
              </motion.span>
            </span>
          ))}
        </h2>

        {/* Bottone che reagisce al mouse (hover) e al tocco (tap) */}
        <motion.a
          href="mailto:ciao@studioesempio.it"
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
          className="mt-10 inline-block rounded-full bg-crema px-8 py-4 text-lg font-bold text-inchiostro md:px-12 md:py-6 md:text-2xl"
        >
          ciao@studioesempio.it →
        </motion.a>
      </div>

      <footer className="mt-20 flex flex-col gap-2 border-t border-crema/30 pt-6 text-sm md:flex-row md:justify-between">
        <span>© {anno} Studio Esempio</span>
        <span>Fatto con React, Tailwind e Motion</span>
      </footer>
    </section>
  )
}
