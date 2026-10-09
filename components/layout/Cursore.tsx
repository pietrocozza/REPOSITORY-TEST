'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { SPRING_CURSORE } from '@/lib/animazioni'
import { usePuntatoreFine, useRiduciMovimento } from '@/lib/hooks'

/**
 * Cursore personalizzato (solo mouse): un punto che segue il puntatore
 * e si allarga sopra link e foto. Gli elementi con data-cursore="Testo" mostrano quella parola.
 */
export default function Cursore() {
  const fine = usePuntatoreFine()
  const riduci = useRiduciMovimento()
  const attivo = fine && !riduci
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, SPRING_CURSORE)
  const sy = useSpring(y, SPRING_CURSORE)
  const [stato, setStato] = useState<{ tipo: 'base' | 'link' | 'testo'; testo?: string }>({ tipo: 'base' })
  const [visibile, setVisibile] = useState(false)

  useEffect(() => {
    if (!attivo) return
    document.documentElement.classList.add('cursore-attivo')
    const muovi = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisibile(true)
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursore], a, button, label, input, select, textarea, summary')
      if (!el) setStato({ tipo: 'base' })
      else if (el.dataset.cursore) setStato({ tipo: 'testo', testo: el.dataset.cursore })
      else setStato({ tipo: 'link' })
    }
    const esci = () => setVisibile(false)
    window.addEventListener('pointermove', muovi, { passive: true })
    document.addEventListener('pointerleave', esci)
    return () => {
      document.documentElement.classList.remove('cursore-attivo')
      window.removeEventListener('pointermove', muovi)
      document.removeEventListener('pointerleave', esci)
    }
  }, [attivo, x, y])

  if (!attivo) return null

  const dimensione = stato.tipo === 'testo' ? 96 : stato.tipo === 'link' ? 44 : 10

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-center rounded-full text-[0.7rem] font-semibold tracking-wider text-avorio uppercase"
      style={{ x: sx, y: sy, translateX: '-50%', translateY: '-50%' }}
      animate={{
        width: dimensione,
        height: dimensione,
        opacity: visibile ? 1 : 0,
        backgroundColor: stato.tipo === 'link' ? 'rgba(164,70,42,0.18)' : 'rgba(164,70,42,1)',
        border: stato.tipo === 'link' ? '1px solid rgba(164,70,42,0.9)' : '0px solid rgba(164,70,42,0)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      {stato.tipo === 'testo' && stato.testo}
    </motion.div>
  )
}
