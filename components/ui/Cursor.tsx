'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useSpring } from 'motion/react'
import { usePointer } from '@/components/Providers'
import { SPRING_CURSOR_RING } from '@/lib/animations'
import { useIsTouch, useRiduciMovimento } from '@/lib/hooks'

type Modo = 'default' | 'link' | 'ordina' | 'bite' | 'grab' | 'nascosto'

const INTERATTIVI = 'a, button, input, select, textarea, label, summary, [role="button"]'

/**
 * Cursore personalizzato: un puntino pieno + un anello che lo segue con una molla.
 * Cambia forma in base a cosa c'è sotto (attributo data-cursor sugli elementi).
 * Sui dispositivi touch non viene mostrato affatto.
 */
export default function Cursor() {
  const isTouch = useIsTouch()
  const reduce = useRiduciMovimento()
  const { x, y } = usePointer()
  const ringX = useSpring(x, reduce ? { stiffness: 2000, damping: 100 } : SPRING_CURSOR_RING)
  const ringY = useSpring(y, reduce ? { stiffness: 2000, damping: 100 } : SPRING_CURSOR_RING)
  const [modo, setModo] = useState<Modo>('nascosto')
  const [premuto, setPremuto] = useState(false)

  useEffect(() => {
    if (isTouch) return
    document.documentElement.classList.add('has-custom-cursor')
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (!t?.closest) return
      const interattivo = t.closest(INTERATTIVI)
      const speciale = t.closest<HTMLElement>('[data-cursor]')
      if (interattivo && (!speciale || speciale.contains(interattivo)) && speciale?.dataset.cursor !== 'grab') {
        setModo('link')
      } else if (speciale) {
        setModo(speciale.dataset.cursor as Modo)
      } else {
        setModo('default')
      }
    }
    const leave = () => setModo('nascosto')
    const down = () => setPremuto(true)
    const up = () => setPremuto(false)
    window.addEventListener('pointerover', over)
    document.documentElement.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [isTouch])

  if (isTouch) return null

  const anello = {
    default: { size: 38, opacity: 1 },
    link: { size: 70, opacity: 1 },
    ordina: { size: 108, opacity: 1 },
    bite: { size: 64, opacity: 1 },
    grab: { size: 56, opacity: 1 },
    nascosto: { size: 20, opacity: 0 },
  }[modo]

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      {/* Anello che insegue con ritardo */}
      <motion.div
        className="absolute left-0 top-0"
        style={{ x: ringX, y: ringY, mixBlendMode: modo === 'link' ? 'difference' : 'normal' }}
      >
        <motion.div
          className="flex items-center justify-center rounded-full"
          animate={{
            width: anello.size,
            height: anello.size,
            opacity: anello.opacity,
            scale: premuto ? 0.85 : 1,
            backgroundColor:
              modo === 'link' ? '#FFF4E0' : modo === 'ordina' ? '#E63B2E' : modo === 'bite' || modo === 'grab' ? '#FFF4E0' : 'rgba(0,0,0,0)',
            borderColor: modo === 'link' || modo === 'ordina' ? 'rgba(0,0,0,0)' : '#1A1A1A',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ translateX: '-50%', translateY: '-50%', borderWidth: 1.5, borderStyle: 'solid' }}
        >
          <AnimatePresence mode="wait">
            {modo === 'ordina' && (
              <motion.span
                key="ordina"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="font-display text-lg italic text-crema"
              >
                Ordina
              </motion.span>
            )}
            {modo === 'bite' && (
              <motion.svg key="bite" viewBox="0 0 40 40" className="h-9 w-9" initial={{ opacity: 0, rotate: -40 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
                {/* un cerchio con un morso */}
                <path
                  d="M20 4 a16 16 0 1 0 15.5 12 a5 5 0 0 1 -6 -4 a5 5 0 0 1 -5 -7 a5 5 0 0 1 -4.5 -1 Z"
                  fill="#C9812E"
                  stroke="#1A1A1A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
            {modo === 'grab' && (
              <motion.svg key="grab" viewBox="0 0 40 40" className="h-7 w-7" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* manina */}
                <path
                  d="M13 22 V11 a2.5 2.5 0 0 1 5 0 V19 V8 a2.5 2.5 0 0 1 5 0 V19 V10 a2.5 2.5 0 0 1 5 0 V20 V14 a2.5 2.5 0 0 1 5 0 V25 c0 7 -5 11 -11 11 c-5 0 -8 -3 -10 -6 l-4 -7 a2.5 2.5 0 0 1 4 -3 Z"
                  fill="#FFF4E0"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Puntino pieno, segue il mouse senza ritardo */}
      <motion.div className="absolute left-0 top-0" style={{ x, y }}>
        <motion.div
          className="h-2 w-2 rounded-full bg-pomodoro"
          style={{ translateX: '-50%', translateY: '-50%' }}
          animate={{ opacity: modo === 'nascosto' || modo === 'ordina' || modo === 'bite' || modo === 'grab' ? 0 : 1 }}
        />
      </motion.div>
    </div>
  )
}
