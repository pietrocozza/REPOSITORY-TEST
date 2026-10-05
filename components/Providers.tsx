'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { MotionConfig, useMotionValue, type MotionValue } from 'motion/react'
import { CartProvider } from '@/lib/cart'
import { setLenis } from '@/lib/scroll'
import { audio } from '@/lib/audio'

// ───────── Schermata di caricamento: la hero parte quando finisce ─────────
type IntroCtx = { introDone: boolean; finishIntro: () => void }
const IntroContext = createContext<IntroCtx>({ introDone: true, finishIntro: () => {} })
export const useIntro = () => useContext(IntroContext)

// ───────── Posizione del puntatore, condivisa (parallax, occhi della mascotte) ─────────
type PointerCtx = { x: MotionValue<number>; y: MotionValue<number>; nx: MotionValue<number>; ny: MotionValue<number> }
const PointerContext = createContext<PointerCtx | null>(null)
export const usePointer = () => {
  const c = useContext(PointerContext)
  if (!c) throw new Error('usePointer va usato dentro <Providers>')
  return c
}

export default function Providers({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false)
  const finishIntro = useCallback(() => setIntroDone(true), [])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const nx = useMotionValue(0) // da -1 (sinistra) a 1 (destra)
  const ny = useMotionValue(0)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      nx.set((e.clientX / window.innerWidth) * 2 - 1)
      ny.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [x, y, nx, ny])

  // Smooth scroll con Lenis (disattivato con "riduci movimento")
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1 })
    setLenis(lenis)
    return () => {
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  // Musica: tentativo di avvio automatico, altrimenti al primo gesto
  useEffect(() => {
    audio.init()
  }, [])

  const intro = useMemo(() => ({ introDone, finishIntro }), [introDone, finishIntro])
  const pointer = useMemo(() => ({ x, y, nx, ny }), [x, y, nx, ny])

  return (
    <IntroContext.Provider value={intro}>
      <PointerContext.Provider value={pointer}>
        {/* le animazioni di Motion rispettano "riduci movimento" del dispositivo */}
        <MotionConfig reducedMotion="user">
          <CartProvider>{children}</CartProvider>
        </MotionConfig>
      </PointerContext.Provider>
    </IntroContext.Provider>
  )
}
