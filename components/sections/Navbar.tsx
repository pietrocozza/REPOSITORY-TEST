'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useCart } from '@/lib/cart'
import { scrollToId } from '@/lib/scroll'
import { EASE_OUT, EASE_IN_OUT } from '@/lib/animations'
import { useIntro } from '@/components/Providers'
import Magnetic from '@/components/ui/Magnetic'
import { useRiduciMovimento } from '@/lib/hooks'

const LINKS = [
  { id: 'panino', label: 'Il panino' },
  { id: 'menu', label: 'Menu' },
  { id: 'storia', label: 'Storia' },
  { id: 'ordina', label: 'Ordina' },
  { id: 'dove', label: 'Dove siamo' },
]

/** Link ad ancora: scorre in modo fluido invece di "saltare" */
function vaiA(e: React.MouseEvent, id: string, dopo?: () => void) {
  e.preventDefault()
  dopo?.()
  scrollToId(id)
}

export default function Navbar() {
  const { scrollY } = useScroll()
  const { introDone } = useIntro()
  const reduce = useRiduciMovimento()
  const [nascosta, setNascosta] = useState(false)
  const [staccata, setStaccata] = useState(false)
  const [aperto, setAperto] = useState(false)
  const { count, addTick } = useCart()

  // Si nasconde scorrendo giù, riappare scorrendo su
  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0
    setNascosta(v > prev && v > 240 && !aperto)
    setStaccata(v > 30)
  })

  // Il menu mobile blocca lo scroll della pagina mentre è aperto
  useEffect(() => {
    document.documentElement.style.overflow = aperto ? 'hidden' : ''
  }, [aperto])

  return (
    <>
      <motion.header
        initial={{ y: -120 }}
        animate={{ y: !introDone || nascosta ? -120 : 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="fixed inset-x-0 top-3 z-[60] px-3 md:top-5 md:px-6"
      >
        <nav
          aria-label="Navigazione principale"
          className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
            staccata || aperto ? 'bg-crema/85 shadow-[0_8px_30px_rgba(26,26,26,0.08)] ring-1 ring-nero/10 backdrop-blur-md' : ''
          }`}
        >
          <a href="#top" onClick={(e) => vaiA(e, 'top', () => setAperto(false))} className="group flex items-center gap-2" aria-label="Brace & Peperino, torna all'inizio">
            <motion.svg viewBox="0 0 32 32" className="h-7 w-7" whileHover={reduce ? undefined : { rotate: -12, scale: 1.1 }} aria-hidden="true">
              <path d="M4 15 C4 7 10 3 16 3 C22 3 28 7 28 15 Z" fill="#C9812E" stroke="#1A1A1A" strokeWidth="2" />
              <rect x="3" y="17" width="26" height="5" rx="2.5" fill="#7A3E1D" stroke="#1A1A1A" strokeWidth="2" />
              <path d="M4 24 H28 L27 27 Q26 29 24 29 H8 Q6 29 5 27 Z" fill="#C9812E" stroke="#1A1A1A" strokeWidth="2" />
            </motion.svg>
            <span className="whitespace-nowrap font-display text-[1.05rem] leading-none sm:text-lg md:text-xl">
              Brace <em className="text-pomodoro">&amp;</em> Peperino
            </span>
          </a>

          <ul className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} onClick={(e) => vaiA(e, l.id)} className="group relative py-2 text-sm font-medium">
                  {l.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            {/* Carrello: rimbalza quando aggiungi qualcosa */}
            <a
              href="#ordina"
              onClick={(e) => vaiA(e, 'ordina', () => setAperto(false))}
              className="relative flex h-11 w-11 items-center justify-center rounded-full"
              aria-label={`Carrello: ${count} ${count === 1 ? 'prodotto' : 'prodotti'}. Vai al modulo d'ordine`}
            >
              <motion.svg
                key={addTick}
                viewBox="0 0 24 24"
                className="h-6 w-6"
                initial={addTick && !reduce ? { y: -10, rotate: -15, scale: 1.3 } : false}
                animate={{ y: 0, rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 9 }}
                aria-hidden="true"
              >
                <path d="M5 8 H19 L18 20 Q17.8 21 16.8 21 H7.2 Q6.2 21 6 20 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 10 V6.5 a3 3 0 0 1 6 0 V10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </motion.svg>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 14 }}
                    className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pomodoro px-1 text-[0.65rem] font-bold text-crema"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </a>

            <span className="hidden sm:block">
              <Magnetic>
              <a
                href="#ordina"
                onClick={(e) => vaiA(e, 'ordina')}
                className="group relative flex h-11 items-center overflow-hidden rounded-full bg-nero px-6 text-sm font-semibold text-crema"
              >
                <span className="absolute inset-0 translate-y-full rounded-full bg-pomodoro transition-transform duration-500 ease-out group-hover:translate-y-0" />
                <span className="relative">Ordina</span>
              </a>
              </Magnetic>
            </span>

            <button
              type="button"
              onClick={() => setAperto((a) => !a)}
              aria-expanded={aperto}
              aria-controls="menu-mobile"
              aria-label={aperto ? 'Chiudi il menu' : 'Apri il menu'}
              className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full lg:hidden"
            >
              <motion.span animate={aperto ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} className="block h-[1.5px] w-6 bg-current" />
              <motion.span animate={aperto ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }} className="block h-[1.5px] w-6 bg-current" />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Menu a tutto schermo su mobile: le voci entrano una dopo l'altra */}
      <AnimatePresence>
        {aperto && (
          <motion.div
            id="menu-mobile"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE_IN_OUT }}
            className="fixed inset-0 z-[55] flex flex-col justify-end bg-nero px-6 pb-10 pt-28 text-crema lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <li key={l.id} className="overflow-hidden border-b border-crema/15">
                  <motion.a
                    href={`#${l.id}`}
                    onClick={(e) => vaiA(e, l.id, () => setAperto(false))}
                    initial={{ y: '110%', rotate: 6 }}
                    animate={{ y: 0, rotate: 0 }}
                    exit={{ y: '-110%' }}
                    transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.25 + i * 0.07 }}
                    className="flex items-baseline justify-between py-3 font-display text-5xl italic"
                  >
                    {l.label}
                    <span className="eyebrow not-italic text-crema/50">0{i + 1}</span>
                  </motion.a>
                </li>
              ))}
            </ul>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="eyebrow mt-8 text-crema/60">
              Smash burger nel cuore della Tuscia
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
