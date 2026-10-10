'use client'

import { useLayoutEffect } from 'react'
import { motion } from 'motion/react'
import { EASE_SIPARIO } from '@/lib/animazioni'
import { scrollInCima } from '@/lib/scroll'

// Transizione tra le pagine: un sipario corallo si ritira verso l'alto e svela la nuova pagina.
// Ogni pagina nuova riparte sempre dall'inizio.
export default function Template({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    if (window.location.hash) return
    scrollInCima()
  }, [])

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] bg-corallo"
        initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        animate={{ clipPath: 'inset(0% 0% 100% 0%)' }}
        transition={{ duration: 0.8, ease: EASE_SIPARIO, delay: 0.05 }}
      />
      {children}
    </>
  )
}
