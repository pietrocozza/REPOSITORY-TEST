'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Apertura delle pagine interne: titolo grande e, se c'è, una foto a tutta larghezza in parallasse */
export default function IntestazionePagina({
  etichetta,
  titolo,
  sottotitolo,
  foto,
  altFoto = '',
}: {
  etichetta: string
  titolo: string
  sottotitolo?: string
  foto?: string
  altFoto?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])

  return (
    <section className="bg-crema">
      <div className="contenitore pt-32 pb-10 md:pt-40 md:pb-14">
        <motion.p
          className="etichetta mb-6 text-corallo"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUSSO, delay: 0.5 }}
        >
          {etichetta}
        </motion.p>
        <TestoDiviso as="h1" subito ritardo={0.6} testo={titolo} className="titolo-hero max-w-[14ch]" />
        {sottotitolo && (
          <motion.p
            className="mt-6 max-w-xl text-lg text-pietra"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_LUSSO, delay: 1.2 }}
          >
            {sottotitolo}
          </motion.p>
        )}
      </div>
      {foto && (
        <div className="contenitore">
          <motion.div
            ref={ref}
            className="relative h-[42svh] overflow-hidden rounded-[2rem] md:h-[60svh] md:rounded-[3rem]"
            initial={{ clipPath: 'inset(30% 10% 0% 10% round 3rem)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 3rem)' }}
            transition={{ duration: 1.4, ease: EASE_LUSSO, delay: 0.8 }}
          >
            <motion.div className="absolute inset-[-14%_0]" style={{ y }}>
              <Image src={foto} alt={altFoto} fill preload sizes="100vw" className="object-cover" />
            </motion.div>
          </motion.div>
        </div>
      )}
    </section>
  )
}
