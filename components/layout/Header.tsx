'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import Logo from './Logo'
import { NAV, SITO } from '@/lib/site'
import { EASE_LUSSO, EASE_SIPARIO } from '@/lib/animazioni'
import { bloccaScroll } from '@/lib/scroll'

// Foto mostrata accanto alle voci del menu al passaggio del mouse
const FOTO_MENU: Record<string, string> = {
  '/': '/img/hero/leonina-sala.jpg',
  '/gestione': '/img/hero/don-bosco.jpg',
  '/ristruttura-gratis': '/img/ristrutturazione/leonina-dopo.jpg',
  '/operazioni-immobiliari': '/img/cantieri/tempio-della-pace.jpg',
  '/chi-siamo': '/img/team/team.jpg',
  '/domande-e-risposte': '/img/case/brera-apt.jpg',
  '/contatti': '/img/hero/villa-chiara.jpg',
}

export default function Header() {
  const pathname = usePathname()
  const [aperto, setAperto] = useState(false)
  const [nascosto, setNascosto] = useState(false)
  const [scorso, setScorso] = useState(false)
  // la pagina comincia con una foto scura a tutto schermo? (la home)
  const [heroScuro, setHeroScuro] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroScuro(!!document.getElementById('hero-scuro')))
    return () => cancelAnimationFrame(id)
  }, [pathname])
  const [voce, setVoce] = useState<string>(pathname)
  const { scrollY } = useScroll()

  // Si nasconde scendendo, ricompare risalendo
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prima = scrollY.getPrevious() ?? 0
    setNascosto(y > prima && y > 160)
    setScorso(y > (heroScuro ? window.innerHeight * 0.85 : 40))
  })

  // Sopra la foto della home il testo è chiaro; altrove scuro su fondo crema sfocato
  const chiaro = aperto || (heroScuro && !scorso)

  useEffect(() => {
    bloccaScroll(aperto)
    if (!aperto) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAperto(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aperto])

  const chiudi = () => setAperto(false)

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${chiaro ? 'text-crema' : 'text-inchiostro'}`}
        animate={{ y: nascosto && !aperto ? '-110%' : '0%' }}
        transition={{ duration: 0.6, ease: EASE_LUSSO }}
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 border-b border-linea/70 bg-crema/85 backdrop-blur-xl transition-opacity duration-500 ${scorso && !aperto ? 'opacity-100' : 'opacity-0'}`}
        />
        <div className={`contenitore relative flex items-center justify-between transition-[height] duration-500 ${scorso ? 'h-16 md:h-[4.5rem]' : 'h-20 md:h-24'}`}>
          <Logo onClick={chiudi} />
          <nav aria-label="Principale" className="hidden items-center gap-8 xl:flex">
            {NAV.slice(1, 5).map((n) => (
              <Link key={n.href} href={n.href} className="group relative text-sm font-medium">
                {n.label}
                <span
                  className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-current transition-transform duration-500 ease-lusso ${
                    pathname === n.href ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}
                />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
          <Link
            href="/calcola-guadagno"
            onClick={chiudi}
            className="hidden rounded-full bg-corallo px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(217,72,31,0.7)] transition-transform duration-300 hover:-translate-y-0.5 md:inline-block"
          >
            Calcola guadagno
          </Link>
          <button
            type="button"
            onClick={() => setAperto((a) => !a)}
            aria-expanded={aperto}
            aria-controls="menu-principale"
            className="group flex items-center gap-3 text-sm font-semibold"
          >
            <span className="hidden sm:inline">{aperto ? 'Chiudi' : 'Menu'}</span>
            <span className="relative block h-3 w-8" aria-hidden="true">
              <span className={`absolute left-0 h-px w-full bg-current transition-all duration-500 ease-lusso ${aperto ? 'top-1.5 rotate-45' : 'top-0 group-hover:w-6'}`} />
              <span className={`absolute left-0 h-px w-full bg-current transition-all duration-500 ease-lusso ${aperto ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
            <span className="sr-only">{aperto ? 'Chiudi il menu' : 'Apri il menu'}</span>
          </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {aperto && (
          <motion.div
            id="menu-principale"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-0 z-40 overflow-y-auto bg-notte text-crema"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            transition={{ duration: 0.9, ease: EASE_SIPARIO }}
          >
            <div className="contenitore grid min-h-full grid-cols-1 gap-10 pt-28 pb-10 lg:grid-cols-[1.3fr_1fr] lg:pt-32">
              <nav aria-label="Menu completo">
                <ul>
                  {NAV.map((n, i) => (
                    <li key={n.href} className="overflow-hidden border-b border-white/10">
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '-100%' }}
                        transition={{ duration: 0.9, ease: EASE_LUSSO, delay: 0.25 + i * 0.05 }}
                      >
                        <Link
                          href={n.href}
                          onClick={chiudi}
                          onPointerEnter={() => setVoce(n.href)}
                          onFocus={() => setVoce(n.href)}
                          className="group flex items-baseline gap-5 py-3 md:py-4"
                        >
                          <span className="font-display text-sm text-nebbia italic">0{i + 1}</span>
                          <span
                            className={`font-display text-[clamp(2.1rem,5.4vw,4.6rem)] leading-none transition-all duration-500 ease-lusso group-hover:translate-x-3 group-hover:italic group-hover:text-sole ${
                              pathname === n.href ? 'italic text-sole' : ''
                            }`}
                          >
                            {n.label}
                          </span>
                        </Link>
                      </motion.div>
                    </li>
                  ))}
                </ul>
              </nav>

              <motion.aside
                className="flex flex-col justify-between gap-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.6, duration: 0.8 } }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[2rem] lg:block">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={voce}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: EASE_LUSSO }}
                    >
                      <Image src={FOTO_MENU[voce] ?? FOTO_MENU['/']} alt="" fill sizes="40vw" className="object-cover" />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="grid gap-6 text-sm sm:grid-cols-2">
                  <div>
                    <p className="etichetta mb-3 text-nebbia">Scrivici</p>
                    <a href={SITO.telefono.href} className="block hover:text-sole">{SITO.telefono.numero}</a>
                    <a href={SITO.whatsapp.href} target="_blank" rel="noopener noreferrer" className="block hover:text-sole">
                      WhatsApp {SITO.whatsapp.numero}
                    </a>
                    <a href={`mailto:${SITO.email}`} className="block break-all hover:text-sole">{SITO.email}</a>
                  </div>
                  <div>
                    <p className="etichetta mb-3 text-nebbia">Sedi</p>
                    {SITO.sedi.map((s) => (
                      <p key={s.citta}>
                        <span className="font-semibold">{s.citta}</span> — {s.indirizzo}
                      </p>
                    ))}
                  </div>
                </div>
              </motion.aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
