'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useCart } from '@/lib/cart'
import { scrollToId } from '@/lib/scroll'
import { useIntro } from '@/components/Providers'
import AudioToggle from '@/components/ui/AudioToggle'
import Magnetic from '@/components/ui/Magnetic'
import { EASE_OUT } from '@/lib/animations'
import { useRiduciMovimento } from '@/lib/hooks'

/** Navbar minima e fissa: logo, musica, carrello con numero, "Ordina" */
export default function Navbar() {
  const { scrollY } = useScroll()
  const { introDone } = useIntro()
  const { count, addTick } = useCart()
  const reduce = useRiduciMovimento()
  const [scura, setScura] = useState(false)
  useMotionValueEvent(scrollY, 'change', (v) => setScura(v > 40))

  const vai = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    scrollToId(id)
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={introDone ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-[60] transition-colors duration-500 ${scura ? 'bg-notte/80 backdrop-blur-md' : ''}`}
    >
      <nav aria-label="Navigazione principale" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:h-20 md:px-8">
        <a href="#top" onClick={(e) => vai(e, 'top')} className="whitespace-nowrap font-display text-lg uppercase tracking-wide sm:text-xl md:text-2xl" aria-label="Brace & Peperino, torna all'inizio">
          Brace <span className="text-ambra">&amp;</span> Peperino
        </a>

        <div className="flex items-center gap-1 md:gap-2">
          <AudioToggle />
          <a
            href="#ordina"
            onClick={(e) => vai(e, 'riepilogo')}
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-superficie"
            aria-label={`Carrello: ${count} ${count === 1 ? 'prodotto' : 'prodotti'}`}
          >
            <motion.svg
              key={addTick}
              viewBox="0 0 24 24"
              className="h-6 w-6"
              initial={addTick && !reduce ? { scale: 1.35, rotate: -12 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
              aria-hidden="true"
            >
              <path d="M5 8 H19 L18 20 Q17.8 21 16.8 21 H7.2 Q6.2 21 6 20 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 10 V6.5 a3 3 0 0 1 6 0 V10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </motion.svg>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ambra px-1 text-[0.65rem] font-bold text-notte"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </a>
          <Magnetic>
            <a href="#ordina" onClick={(e) => vai(e, 'ordina')} className="flex h-11 items-center rounded-full bg-ambra px-5 text-sm font-bold text-notte transition-transform duration-300 hover:scale-[1.04] md:px-6">
              Ordina
            </a>
          </Magnetic>
        </div>
      </nav>
    </motion.header>
  )
}
