'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Il contenuto sale e appare quando entra nello schermo */
export default function Rivela({
  children,
  ritardo = 0,
  y = 36,
  className,
  as = 'div',
}: {
  children: ReactNode
  ritardo?: number
  y?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'article' | 'p'
}) {
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1, ease: EASE_LUSSO, delay: ritardo }}
    >
      {children}
    </Comp>
  )
}
