'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { useIntro, usePointer } from '@/components/Providers'
import Foto from '@/components/ui/Foto'
import Magnetic from '@/components/ui/Magnetic'
import { APERTURA, EASE_OUT, SPRING_MORBIDA, SPRING_TILT } from '@/lib/animations'
import { useCart } from '@/lib/cart'
import { useIsMobile, useIsTouch, useRiduciMovimento } from '@/lib/hooks'
import { INFO } from '@/lib/info'
import { PROTAGONISTA, euro, trovaProdotto } from '@/lib/menu'
import { scrollToId } from '@/lib/scroll'
import { ALTEZZA_CHIUSO, STRATI, centriChiusi, type Strato } from '@/lib/strati'

const N = STRATI.length
const inizio = (i: number) => APERTURA.inizio + i * APERTURA.sfasamento
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Sezioni 1 e 2 in un'unica scena "sticky" alta 350vh:
 * la hero con il panino protagonista, che scorrendo si apre strato per strato e poi si richiude.
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

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const fermo = useMotionValue(0.7) // "riduci movimento": panino già aperto e fermo
  const p = reduce ? fermo : scrollYProgress

  // Distanza tra gli strati aperti, in base allo spazio sullo schermo
  const stageRef = useRef<HTMLDivElement>(null)
  const gap = useMotionValue(50)
  const [spazioAperto, setSpazioAperto] = useState(0) // spazio extra in pagina quando il panino è fermo e aperto
  useEffect(() => {
    const calcola = () => {
      const w = stageRef.current?.offsetWidth ?? 400
      const scala = window.innerWidth < 768 ? 0.62 : 1
      const disponibile = window.innerHeight * (window.innerWidth < 768 ? 0.62 : 0.8)
      const g = Math.max(16, Math.min(w * (window.innerWidth < 768 ? 0.26 : 0.16), (disponibile - ALTEZZA_CHIUSO * w * scala) / (N - 1) / scala))
      gap.set(g)
      setSpazioAperto(((N - 1) / 2) * g * scala)
    }
    calcola()
    window.addEventListener('resize', calcola)
    return () => window.removeEventListener('resize', calcola)
  }, [gap])

  // Hero: testi che escono (più lenti del panino), foto frontale che lascia il posto agli strati
  const testiOpacity = useTransform(p, [0.01, APERTURA.heroFine], [1, 0])
  const testiY = useTransform(p, [0, APERTURA.heroFine], [0, -60])
  const fotoHeroOpacity = useTransform(p, [0.04, APERTURA.heroFine], [1, 0])
  const stratiOpacity = useTransform(p, [0.04, APERTURA.heroFine], [0, 1])
  const stageY = useTransform(p, [0, APERTURA.heroFine + 0.02], [isMobile ? '6vh' : '9vh', '0vh'])
  const stageScale = useTransform(p, [0, APERTURA.heroFine + 0.02], [1.08, isMobile ? 0.62 : 1])
  const stageX = useTransform(p, [APERTURA.heroFine, APERTURA.inizio + 0.04], ['0vw', isMobile ? '-20vw' : '0vw'])

  // Inclinazione 3D: segue il mouse; su touch segue lo scorrimento
  const rxRaw = useTransform(() => (reduce ? 0 : isTouch ? (p.get() - 0.5) * -14 : ny.get() * -8))
  const ryRaw = useTransform(() => (reduce || isTouch ? 0 : nx.get() * 10))
  const rotateX = useSpring(rxRaw, SPRING_TILT)
  const rotateY = useSpring(ryRaw, SPRING_TILT)

  // "Lo voglio" compare quando il panino si è richiuso
  const [pulsante, setPulsante] = useState(false)
  useMotionValueEvent(p, 'change', (v) => setPulsante(v >= APERTURA.pulsante))
  const hint = useTransform(p, [0, 0.04], [1, 0])

  const loVoglio = () => {
    aggiungi(protagonista.id)
    scrollToId('ordina')
  }

  return (
    <section ref={ref} id="top" aria-label={`${INFO.nome}: il panino protagonista`} className={reduce ? 'relative' : 'relative h-[350vh]'}>
      <div className={reduce ? 'relative overflow-hidden pb-24 pt-28' : 'sticky top-0 h-svh overflow-hidden'}>
        {/* luce calda che arriva dall'alto */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[80vh]" style={{ background: 'radial-gradient(60% 70% at 50% -10%, rgba(255,190,110,0.20), rgba(255,176,32,0.05) 45%, transparent 75%)' }} />

        {/* Testi della hero (dietro al panino) */}
        <motion.div
          style={reduce ? undefined : { opacity: testiOpacity, y: testiY }}
          className={reduce ? 'relative z-0 px-4 text-center' : 'absolute inset-0 z-0 flex flex-col items-center justify-between px-4 pb-10 pt-24 text-center md:pb-12 md:pt-28'}
        >
          <h1 className="titolo-xl text-crema">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 40 }}
              animate={introDone ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 1, ease: EASE_OUT }}
            >
              Brace <span className="text-ambra">&amp;</span>
            </motion.span>
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 40 }}
              animate={introDone ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 1, ease: EASE_OUT, delay: 0.1 }}
            >
              Peperino
            </motion.span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={introDone ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.45 }}
            className={`flex flex-col items-center gap-5 ${reduce ? 'mt-8' : ''}`}
          >
            <p className="text-base text-crema-muta md:text-lg">{INFO.payoff}.</p>
            <Magnetic>
              <button
                type="button"
                onClick={() => scrollToId('ordina')}
                className="h-14 rounded-full bg-ambra px-9 text-base font-bold text-notte transition-transform duration-300 hover:scale-[1.04]"
              >
                Ordina ora
              </button>
            </Magnetic>
          </motion.div>
        </motion.div>

        {/* Il panino */}
        <div
          className={reduce ? 'relative mt-16 flex justify-center' : 'pointer-events-none absolute inset-0 flex items-center justify-center'}
          style={reduce ? { paddingBlock: spazioAperto } : undefined}
        >
          <motion.div
            ref={stageRef}
            className={`relative ${isMobile ? 'w-[78vw]' : 'w-[min(36vw,520px)]'} [perspective:1400px]`}
            style={reduce ? { scale: isMobile ? 0.62 : 1, x: isMobile ? '-20vw' : 0 } : { y: stageY, scale: stageScale, x: stageX }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={introDone ? { opacity: 1 } : undefined}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 }}
          >
            {/* bagliore ambrato dietro */}
            <div aria-hidden="true" className="absolute inset-[-25%] -z-10" style={{ background: 'radial-gradient(closest-side, rgba(255,176,32,0.28), rgba(226,61,40,0.07) 55%, transparent 75%)' }} />

            <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
              {/* Foto frontale della hero */}
              {!reduce && (
                <motion.div style={{ opacity: fotoHeroOpacity }} className="pointer-events-auto absolute inset-x-0 top-1/2 -translate-y-1/2">
                  <button type="button" onClick={loVoglio} data-cursor="aggiungi" aria-label={`Aggiungi ${protagonista.nome} al carrello`} className="block w-full">
                    <Foto foto={PROTAGONISTA.foto} alt={`${protagonista.nome}, vista frontale`} larghezza={1600} altezza={1200} forma="burger" priority sizes="(max-width: 768px) 80vw, 520px" />
                  </button>
                  <OmbraHero />
                </motion.div>
              )}

              {/* Gli strati */}
              <motion.div style={{ opacity: reduce ? 1 : stratiOpacity, height: 0, paddingBottom: `${ALTEZZA_CHIUSO * 100}%` }} className="relative" role="img" aria-label="Il panino aperto: pane, lattuga, pomodoro, cipolla, pecorino, manzo, bacon, pane">
                {STRATI.map((s, i) => (
                  <StratoFoto key={s.id} strato={s} i={i} p={p} gap={gap} isMobile={isMobile} reduce={reduce} />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* "Lo voglio" */}
        <div className={reduce ? 'relative mt-20 flex justify-center' : 'absolute inset-x-0 bottom-10 z-20 flex justify-center md:bottom-14'}>
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

function OmbraHero() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-[10%] -bottom-[4%] -z-10 h-[14%] rounded-[50%]"
      style={{ background: 'radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0.3) 60%, transparent 100%)' }}
    />
  )
}

/** Uno strato fotografico: si stacca con una curva morbida, ruota appena e prende profondità */
function StratoFoto({
  strato,
  i,
  p,
  gap,
  isMobile,
  reduce,
}: {
  strato: Strato
  i: number
  p: MotionValue<number>
  gap: MotionValue<number>
  isMobile: boolean
  reduce: boolean
}) {
  const s = inizio(i)
  const { durata, chiusuraInizio: CI, chiusuraFine: CF } = APERTURA
  const dir = i - (N - 1) / 2
  const verso = i % 2 ? 1 : -1

  // 0 = chiuso, 1 = aperto (curva morbida, nessun rimbalzo)
  const relGrezzo = useTransform(p, (v) => {
    if (v <= s) return 0
    if (v < s + durata) return easeInOut((v - s) / durata)
    if (v <= CI) return 1
    if (v < CF) return 1 - easeInOut((v - CI) / (CF - CI))
    return 0
  })
  const rel = useSpring(relGrezzo, SPRING_MORBIDA)
  const r = reduce ? relGrezzo : rel

  const y = useTransform(() => r.get() * dir * gap.get())
  const x = useTransform(r, (v) => v * verso * (isMobile ? 4 : 10))
  const rotate = useTransform(r, (v) => v * verso * (1.5 + (i % 3)))
  const rotateX = useTransform(r, (v) => v * 10)
  const scale = useTransform(r, (v) => 1 + v * (i % 2 ? 0.03 : -0.02))
  const ombra = useTransform(r, (v) => v * 0.7)
  const testo = useTransform(r, [0.55, 1], [0, 1])
  const linea = useTransform(r, [0.3, 1], [0, 1])

  const top = `${((centriChiusi[i] - 0.25) / ALTEZZA_CHIUSO) * 100}%`
  const aSinistra = !isMobile && i % 2 === 0

  return (
    <motion.div className="absolute inset-x-0" style={{ top, y, zIndex: N - i }}>
      {/* ombra propria dello strato */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-[12%] -z-10 h-[12%] rounded-[50%]"
        style={{ top: `${50 + (strato.spessore / 0.5) * 50}%`, opacity: ombra, background: 'radial-gradient(closest-side, rgba(0,0,0,0.75), transparent)' }}
      />
      <motion.div style={{ x, rotate, rotateX, scale }}>
        <Foto foto={strato.foto} alt={strato.testo} larghezza={1600} altezza={800} forma={strato.forma} tinta={strato.tinta} spessore={strato.spessore} mostraNome={false} sizes="(max-width: 768px) 80vw, 520px" />
      </motion.div>

      {/* etichetta: una riga sola */}
      <div
        className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-3 ${
          aSinistra ? 'right-full flex-row-reverse pr-4' : isMobile ? 'left-full pl-2' : 'left-full pl-4'
        }`}
        style={{ width: isMobile ? '78vw' : 'min(26vw, 340px)' }}
      >
        <motion.span aria-hidden="true" className={`block h-px w-6 shrink-0 bg-ambra/70 md:w-16 ${aSinistra ? 'origin-right' : 'origin-left'}`} style={{ scaleX: linea }} />
        <motion.span
          style={{ opacity: testo }}
          className={`font-display uppercase leading-tight tracking-wide text-crema ${isMobile ? 'whitespace-nowrap text-[1.2rem]' : 'text-xl lg:text-2xl'} ${aSinistra ? 'text-right' : ''}`}
        >
          {strato.testo}
        </motion.span>
      </div>
    </motion.div>
  )
}
