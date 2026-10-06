'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useSpring } from 'motion/react'
import { usePointer } from '@/components/Providers'
import { SPRING_CURSOR } from '@/lib/animations'
import { useIsTouch, useRiduciMovimento } from '@/lib/hooks'

type Modo = 'default' | 'link' | 'aggiungi' | 'nascosto'

/**
 * Cursore personalizzato: pallino ambra + anello che segue con una molla.
 * Sui cibi 3D (data-cursor="aggiungi") diventa un cerchio con la scritta "Aggiungi".
 * Sui dispositivi touch non c'è.
 */
export default function Cursor() {
  const isTouch = useIsTouch()
  const reduce = useRiduciMovimento()
  const { x, y } = usePointer()
  const rx = useSpring(x, reduce ? { stiffness: 2000, damping: 100 } : SPRING_CURSOR)
  const ry = useSpring(y, reduce ? { stiffness: 2000, damping: 100 } : SPRING_CURSOR)
  const [modo, setModo] = useState<Modo>('nascosto')

  useEffect(() => {
    if (isTouch) return
    document.documentElement.classList.add('has-custom-cursor')
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (!t?.closest) return
      if (t.closest('[data-cursor="aggiungi"]')) setModo('aggiungi')
      else if (t.closest('a, button, input, select, textarea, label, [role="button"]')) setModo('link')
      else setModo('default')
    }
    const leave = () => setModo('nascosto')
    window.addEventListener('pointerover', over)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [isTouch])

  if (isTouch) return null

  const misura = { default: 34, link: 56, aggiungi: 104, nascosto: 16 }[modo]

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <motion.div className="absolute left-0 top-0" style={{ x: rx, y: ry }}>
        <motion.div
          className="flex items-center justify-center rounded-full border"
          style={{ translateX: '-50%', translateY: '-50%' }}
          animate={{
            width: misura,
            height: misura,
            opacity: modo === 'nascosto' ? 0 : 1,
            backgroundColor: modo === 'aggiungi' ? 'rgba(255,176,32,1)' : 'rgba(255,176,32,0)',
            borderColor: modo === 'link' ? 'rgba(255,176,32,0.9)' : 'rgba(245,235,221,0.45)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <AnimatePresence>
            {modo === 'aggiungi' && (
              <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} className="text-sm font-bold text-notte">
                Aggiungi
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      <motion.div className="absolute left-0 top-0" style={{ x, y }}>
        <motion.div
          className="h-2 w-2 rounded-full bg-ambra"
          style={{ translateX: '-50%', translateY: '-50%' }}
          animate={{ opacity: modo === 'nascosto' || modo === 'aggiungi' ? 0 : 1 }}
        />
      </motion.div>
    </div>
  )
}
