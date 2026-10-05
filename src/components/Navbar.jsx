import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const links = [
  { label: 'Chi siamo', href: '#chi-siamo' },
  { label: 'Lavori', href: '#lavori' },
  { label: 'Servizi', href: '#servizi' },
  { label: 'Contatti', href: '#contatti' },
]

// Barra in alto. Sul computer mostra i link, sul telefono un bottone "Menu"
// che apre un pannello a tutto schermo.
export default function Navbar() {
  const [aperto, setAperto] = useState(false)

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4 mix-blend-difference text-crema md:px-10"
      >
        <a href="#" className="font-titolo text-2xl uppercase tracking-wide">
          Studio Esempio
        </a>

        {/* "hidden md:flex" = nascosto sul telefono, visibile da tablet in su */}
        <nav className="hidden gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="group relative text-sm font-medium uppercase">
              {l.label}
              {/* Linea che si allunga sotto il link al passaggio del mouse */}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-current transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* "md:hidden" = visibile solo sul telefono */}
        <button
          onClick={() => setAperto(true)}
          className="text-sm font-medium uppercase md:hidden"
          aria-label="Apri il menu"
        >
          Menu
        </button>
      </motion.header>

      {/* AnimatePresence permette di animare anche la CHIUSURA del menu */}
      <AnimatePresence>
        {aperto && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 100% 0%)' }}
            animate={{ clipPath: 'circle(150% at 100% 0%)' }}
            exit={{ clipPath: 'circle(0% at 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[60] flex flex-col justify-between bg-rosso p-4 text-crema"
          >
            <button
              onClick={() => setAperto(false)}
              className="self-end text-sm font-medium uppercase"
              aria-label="Chiudi il menu"
            >
              Chiudi
            </button>
            <nav className="flex flex-col gap-2">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setAperto(false)}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="font-titolo text-6xl uppercase"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <p className="text-sm">ciao@studioesempio.it</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
