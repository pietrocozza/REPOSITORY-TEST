'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useIntro, usePointer } from '@/components/Providers'
import Magnetic from '@/components/ui/Magnetic'
import { APERTURA, EASE_OUT } from '@/lib/animations'
import { useCart } from '@/lib/cart'
import { useIsMobile, useIsTouch, useRiduciMovimento } from '@/lib/hooks'
import { INFO } from '@/lib/info'
import { PROTAGONISTA, euro, trovaProdotto } from '@/lib/menu'
import { APERTO } from '@/lib/ricette'
import { scrollToId } from '@/lib/scroll'

// Il 3D gira solo nel browser
const ScenaPanino = dynamic(() => import('@/components/three/ScenaPanino'), { ssr: false })

/**
 * Sezioni 1 e 2 in un'unica scena "sticky" alta 350vh:
 * la hero con il panino 3D, che scorrendo si apre strato per strato e poi si richiude.
 */
export default function HeroPanino() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useRiduciMovimento()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()
  const { introDone } = useIntro()
  const { aggiungi } = useCart()
  const { nx, ny } = usePointer()
  const protagonista = trovaProdotto(PROTAGONISTA.id)!
  const etichette = useRef<(HTMLDivElement | null)[]>([])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const fermo = useMotionValue(0.6) // "riduci movimento": panino già aperto e fermo
  const p = reduce ? fermo : scrollYProgress

  // il 3D si ferma quando la sezione non è sullo schermo
  const [attivo, setAttivo] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setAttivo(e.isIntersecting), { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const testiOpacity = useTransform(p, [0.01, APERTURA.heroFine], [1, 0])
  const testiY = useTransform(p, [0, APERTURA.heroFine], [0, -60])
  const [pulsante, setPulsante] = useState(false)
  useMotionValueEvent(p, 'change', (v) => setPulsante(v >= APERTURA.pulsante))
  const hint = useTransform(p, [0, 0.04], [1, 0])

  const loVoglio = () => {
    aggiungi(protagonista.id)
    scrollToId('ordina')
  }

  return (
    <section ref={ref} id="top" aria-label={`${INFO.nome}: il panino protagonista`} className={reduce ? 'relative pt-24' : 'relative h-[350vh]'}>
      <div className={reduce ? 'relative' : 'sticky top-0 h-svh overflow-hidden'}>
        {/* luce calda che arriva dall'alto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]" style={{ background: 'radial-gradient(60% 70% at 50% -10%, rgba(255,190,110,0.20), rgba(255,176,32,0.05) 45%, transparent 75%)' }} />

        {/* Testi della hero (dietro al panino) */}
        <motion.div
          style={reduce ? undefined : { opacity: testiOpacity, y: testiY }}
          className={reduce ? 'relative z-0 px-4 text-center' : 'absolute inset-x-0 top-0 z-0 px-4 pt-24 text-center md:pt-28'}
        >
          <h1 className="titolo-xl text-crema">
            <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={introDone ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 1, ease: EASE_OUT }}>
              Brace <span className="text-ambra">&amp;</span>
            </motion.span>
            <motion.span className="block" initial={{ opacity: 0, y: 40 }} animate={introDone ? { opacity: 1, y: 0 } : undefined} transition={{ duration: 1, ease: EASE_OUT, delay: 0.1 }}>
              Peperino
            </motion.span>
          </h1>
        </motion.div>

        {/* Il panino 3D (davanti ai testi) */}
        <motion.div
          className={reduce ? 'relative h-[85svh]' : 'pointer-events-none absolute inset-0 z-10'}
          initial={{ opacity: 0 }}
          animate={introDone ? { opacity: 1 } : undefined}
          transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.1 }}
          role="img"
          aria-label="Il panino in 3D: pane al sesamo, lattuga, pomodoro, cipolla, pecorino, manzo, bacon, pane"
        >
          <ScenaPanino p={p} nx={nx} ny={ny} mobile={isMobile} touch={isTouch} fermo={reduce} attivo={attivo} etichetteRef={etichette} />

          {/* etichette: posizionate a ogni fotogramma accanto al loro strato */}
          {APERTO.map((s, i) => {
            const aSinistra = !isMobile && i % 2 === 0
            return (
              <div key={s.testo} ref={(el) => void (etichette.current[i] = el)} className="pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform">
                <div className={`flex -translate-y-1/2 items-center gap-3 ${aSinistra ? '-translate-x-full flex-row-reverse' : ''}`}>
                  <span aria-hidden="true" className="block h-px w-4 bg-ambra/70 md:w-14" />
                  <span className={`whitespace-nowrap font-display uppercase tracking-wide text-crema ${isMobile ? 'text-[0.8rem]' : 'text-xl lg:text-2xl'}`}>{s.testo}</span>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Payoff e pulsante: sopra al panino, così restano cliccabili */}
        <motion.div
          style={reduce ? undefined : { opacity: testiOpacity, y: testiY }}
          className={reduce ? 'relative z-20 mt-8 flex justify-center px-4' : 'pointer-events-none absolute inset-x-0 bottom-10 z-20 flex justify-center px-4 md:bottom-12'}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={introDone ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.45 }}
            className="pointer-events-auto flex flex-col items-center gap-5 text-center"
          >
            <p className="text-base text-crema md:text-lg">{INFO.payoff}.</p>
            <Magnetic>
              <button type="button" onClick={() => scrollToId('ordina')} className="h-14 rounded-full bg-ambra px-9 text-base font-bold text-notte shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.04]">
                Ordina ora
              </button>
            </Magnetic>
          </motion.div>
        </motion.div>

        {/* "Lo voglio" */}
        <div className={reduce ? 'relative flex justify-center pb-16 pt-8' : 'absolute inset-x-0 bottom-10 z-20 flex justify-center md:bottom-14'}>
          <AnimatePresence>
            {(pulsante || reduce) && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.5, ease: EASE_OUT }}>
                <Magnetic>
                  <button type="button" onClick={loVoglio} className="flex h-14 items-center gap-4 rounded-full bg-ambra pl-8 pr-2 font-bold text-notte">
                    Lo voglio
                    <span className="rounded-full bg-notte px-4 py-2.5 text-sm text-ambra">{euro(protagonista.prezzo)}</span>
                  </button>
                </Magnetic>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!reduce && (
          <motion.p style={{ opacity: hint }} className="etichetta pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 text-crema-muta md:block">
            Scorri
          </motion.p>
        )}
      </div>
    </section>
  )
}
