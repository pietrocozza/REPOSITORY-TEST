'use client'

import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import { MotionConfig } from 'motion/react'
import { setLenis } from '@/lib/scroll'

export default function Providers({ children }: { children: ReactNode }) {
  // Scorrimento fluido con Lenis (disattivato con "riduci movimento")
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: true })
    setLenis(lenis)
    return () => {
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  // Le animazioni di Motion rispettano "riduci movimento" del dispositivo
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
