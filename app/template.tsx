'use client'

import { motion } from 'motion/react'
import { EASE_SIPARIO } from '@/lib/animazioni'

// Transizione tra le pagine: un sipario scuro si ritira verso l'alto e svela la nuova pagina
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] bg-notte"
        initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        animate={{ clipPath: 'inset(0% 0% 100% 0%)' }}
        transition={{ duration: 0.9, ease: EASE_SIPARIO, delay: 0.05 }}
      />
      {children}
    </>
  )
}
