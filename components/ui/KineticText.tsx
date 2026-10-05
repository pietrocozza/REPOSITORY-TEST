'use client'

import { motion, type Transition } from 'motion/react'
import type { ElementType } from 'react'
import { useRiduciMovimento } from '@/lib/hooks'

/**
 * Titolo che entra lettera per lettera (o parola per parola):
 * ogni pezzo sbuca da sotto una maschera ruotando, con un piccolo rimbalzo.
 * Se "play" non è indicato, parte quando il titolo entra nello schermo.
 */
export default function KineticText({
  text,
  as: Tag = 'h2',
  className,
  per = 'lettere',
  play,
  delay = 0,
  stagger,
}: {
  text: string
  as?: ElementType
  className?: string
  per?: 'lettere' | 'parole'
  play?: boolean
  delay?: number
  stagger?: number
}) {
  const reduce = useRiduciMovimento()
  const parole = text.split(' ')
  const passo = stagger ?? (per === 'lettere' ? 0.035 : 0.08)
  let indice = 0

  const trigger =
    play === undefined
      ? { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } }
      : { initial: 'hidden', animate: play ? 'show' : 'hidden' }

  const molla: Transition = { type: 'spring', stiffness: 170, damping: 16, mass: 0.9 }

  return (
    <Tag className={className} aria-label={text}>
      <motion.span aria-hidden="true" className="block" {...trigger}>
        {parole.map((parola, w) => (
          <span key={w} className="inline-block whitespace-nowrap">
            {(per === 'lettere' ? [...parola] : [parola]).map((pezzo) => {
              const i = indice++
              return (
                // la maschera: overflow nascosto, con un po' di margine per corsivi e accenti
                <span key={i} className="-mb-[0.12em] -mt-[0.06em] inline-block overflow-hidden pb-[0.12em] pt-[0.06em] align-bottom">
                  <motion.span
                    className="inline-block origin-bottom-left"
                    variants={{
                      hidden: reduce ? { opacity: 0 } : { y: '115%', rotate: 14, opacity: 1 },
                      show: reduce
                        ? { opacity: 1, transition: { duration: 0.3, delay } }
                        : { y: '0%', rotate: 0, opacity: 1, transition: { ...molla, delay: delay + i * passo } },
                    }}
                  >
                    {pezzo}
                  </motion.span>
                </span>
              )
            })}
            {w < parole.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}
