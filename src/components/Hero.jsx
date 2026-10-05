import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

const righe = ['Facciamo', 'cose che', 'si muovono']

// Prima schermata: titolo enorme che sale riga per riga,
// e che si rimpicciolisce e sbiadisce quando scorri verso il basso.
export default function Hero() {
  const ref = useRef(null)

  // scrollYProgress va da 0 (inizio sezione) a 1 (sezione uscita dallo schermo)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scala = useTransform(scrollYProgress, [0, 1], [1, 0.85])
  const opacita = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const yCerchio = useTransform(scrollYProgress, [0, 1], ['0%', '60%'])

  return (
    <section ref={ref} className="relative flex min-h-svh flex-col justify-end overflow-hidden px-4 pb-10 md:px-10 md:pb-16">
      {/* Cerchio decorativo che scende più lento (effetto profondità) */}
      <motion.div
        style={{ y: yCerchio }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-senape md:right-20 md:h-[28rem] md:w-[28rem]"
      />

      <motion.div style={{ scale: scala, opacity: opacita }} className="relative origin-bottom-left">
        <h1 className="font-titolo uppercase leading-[0.9] text-[17vw] md:text-[11vw]">
          {righe.map((riga, i) => (
            // overflow-hidden fa da "maschera": la scritta sbuca da sotto una linea invisibile
            <span key={riga} className="block overflow-hidden">
              <motion.span
                className={`block ${i === 2 ? 'text-rosso' : ''}`}
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.12 }}
              >
                {riga}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <p className="max-w-md text-base md:text-lg">
            Uno studio di esempio per mostrare come si costruisce un sito moderno,
            adatto al telefono, con animazioni fluide.
          </p>
          <span className="text-sm uppercase tracking-widest">↓ Scorri</span>
        </motion.div>
      </motion.div>
    </section>
  )
}
