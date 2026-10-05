'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { usePointer } from '@/components/Providers'
import { SPRING_TILT } from '@/lib/animations'
import { useIsTouch, useRiduciMovimento } from '@/lib/hooks'

/**
 * Il cibo "si solleva" dalla pagina:
 * - galleggia piano, con un'ombra morbida sotto che si allarga e schiarisce quando sale
 * - bagliore ambrato dietro
 * - si inclina in 3D seguendo il mouse (su mobile segue lo scorrimento)
 * - in hover o al tocco si avvicina
 * - parallax: si muove più veloce dei testi intorno
 */
export default function CiboSospeso({
  children,
  className,
  parallax = 60,
  inclinazione = 12,
  bagliore = 1,
  onAggiungi,
  etichettaAggiungi,
}: {
  children: ReactNode
  className?: string
  /** quanti px in più si sposta rispetto alla pagina durante lo scroll */
  parallax?: number
  inclinazione?: number
  bagliore?: number
  onAggiungi?: () => void
  etichettaAggiungi?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useRiduciMovimento()
  const isTouch = useIsTouch()
  const { x, y } = usePointer()
  const [vicino, setVicino] = useState(false)

  // galleggiamento: 0 = appoggiato, 1 = sollevato
  const lift = useMotionValue(0)
  useEffect(() => {
    if (reduce) return
    const c = animate(lift, [0, 1, 0], { duration: 5.5, repeat: Infinity, ease: 'easeInOut' })
    return () => c.stop()
  }, [lift, reduce])

  // avvicinamento in hover / tocco
  const avv = useSpring(0, { stiffness: 180, damping: 22 })
  useEffect(() => {
    avv.set(vicino && !reduce ? 1 : 0)
  }, [vicino, reduce, avv])

  // scroll: parallax (desktop e mobile) + inclinazione (solo mobile)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const parY = useTransform(scrollYProgress, [0, 1], [parallax, -parallax])

  // inclinazione verso il cursore (o verso lo scroll su touch)
  const tilt = (asse: 'x' | 'y', px: number, py: number, sp: number) => {
    if (reduce) return 0
    if (isTouch) return asse === 'x' ? (sp - 0.5) * -inclinazione * 1.4 : 0
    const r = ref.current?.getBoundingClientRect()
    if (!r) return 0
    const dx = (px - (r.left + r.width / 2)) / window.innerWidth
    const dy = (py - (r.top + r.height / 2)) / window.innerHeight
    return asse === 'x' ? Math.max(-1, Math.min(1, dy * 2)) * -inclinazione : Math.max(-1, Math.min(1, dx * 2)) * inclinazione
  }
  const rxRaw = useTransform(() => tilt('x', x.get(), y.get(), scrollYProgress.get()))
  const ryRaw = useTransform(() => tilt('y', x.get(), y.get(), scrollYProgress.get()))
  const rotateX = useSpring(rxRaw, SPRING_TILT)
  const rotateY = useSpring(ryRaw, SPRING_TILT)

  const ciboY = useTransform(() => -lift.get() * 14 - avv.get() * 16)
  const scala = useTransform(avv, [0, 1], [1, 1.08])
  const ombraScala = useTransform(() => 1 + lift.get() * 0.18 + avv.get() * 0.25)
  const ombraOpacita = useTransform(() => 0.75 - lift.get() * 0.22 - avv.get() * 0.25)
  const bagliorOpacita = useTransform(() => (0.55 + avv.get() * 0.35) * bagliore)

  const contenuto = (
    <motion.div className="relative [perspective:1200px]" style={{ y: reduce ? 0 : parY }}>
      {/* bagliore caldo dietro */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-10%] -z-10 rounded-full"
        style={{ opacity: bagliorOpacita, background: 'radial-gradient(closest-side, rgba(255,176,32,0.32), rgba(226,61,40,0.08) 60%, transparent 75%)' }}
      />
      {/* ombra proiettata sul "piano" del sito */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] -bottom-[9%] -z-10 h-[16%] rounded-[50%]"
        style={{ scaleX: ombraScala, opacity: ombraOpacita, background: 'radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 55%, transparent 100%)' }}
      />
      <motion.div style={{ rotateX, rotateY, scale: reduce ? 1 : scala, transformStyle: 'preserve-3d' }}>
        <motion.div style={{ y: reduce ? 0 : ciboY }}>{children}</motion.div>
      </motion.div>
    </motion.div>
  )

  const eventi = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && setVicino(true),
    onPointerLeave: () => setVicino(false),
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        setVicino(true)
        setTimeout(() => setVicino(false), 700)
      }
    },
  }

  if (onAggiungi) {
    return (
      <div ref={ref} className={className}>
        <button type="button" onClick={onAggiungi} aria-label={etichettaAggiungi} data-cursor="aggiungi" className="block w-full rounded-[2rem]" {...eventi}>
          {contenuto}
        </button>
      </div>
    )
  }
  return (
    <div ref={ref} className={className} {...eventi}>
      {contenuto}
    </div>
  )
}
