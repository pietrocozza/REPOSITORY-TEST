import { motion } from 'motion/react'

const parole = ['Design', '✺', 'Animazioni', '✺', 'Responsive', '✺', 'Siti web', '✺']

// Striscia di testo che scorre all'infinito, come un nastro.
// Il trucco: il testo è ripetuto due volte e lo spostiamo di metà larghezza,
// così quando ricomincia non si nota il punto di ripartenza.
export default function Marquee() {
  return (
    <div className="overflow-hidden bg-inchiostro py-4 text-crema md:py-6">
      <motion.div
        className="flex w-max gap-8 whitespace-nowrap font-titolo text-4xl uppercase md:text-6xl"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, ease: 'linear', repeat: Infinity }}
      >
        {[...parole, ...parole].map((p, i) => (
          <span key={i} className={p === '✺' ? 'text-senape' : ''}>
            {p}
          </span>
        ))}
      </motion.div>
    </div>
  )
}
