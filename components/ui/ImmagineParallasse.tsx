'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { EASE_SIPARIO } from '@/lib/animazioni'

/**
 * Foto che si "svela" con un sipario all'ingresso e scorre più lenta della pagina (parallasse).
 */
export default function ImmagineParallasse({
  src,
  alt,
  className = '',
  sizes = '(min-width: 1024px) 50vw, 100vw',
  intensita = 12,
  preload = false,
}: {
  src: string
  alt: string
  className?: string
  sizes?: string
  intensita?: number
  preload?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`-${intensita}%`, `${intensita}%`])

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.4, ease: EASE_SIPARIO }}
    >
      <motion.div className="absolute inset-[-14%_0]" style={{ y }}>
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      </motion.div>
    </motion.div>
  )
}
