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
    <section className="bg-avorio">
      <div className="contenitore pt-36 pb-14 md:pt-48 md:pb-20">
        <motion.p
          className="etichetta mb-8 text-pietra"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUSSO, delay: 0.5 }}
        >
          {etichetta}
        </motion.p>
        <TestoDiviso as="h1" subito ritardo={0.6} testo={titolo} className="titolo-hero max-w-[16ch]" />
        {sottotitolo && (
          <motion.p
            className="mt-10 max-w-2xl text-lg text-pietra"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_LUSSO, delay: 1.2 }}
          >
            {sottotitolo}
          </motion.p>
        )}
      </div>
      {foto && (
        <motion.div
          ref={ref}
          className="relative h-[60svh] overflow-hidden md:h-[80svh]"
          initial={{ clipPath: 'inset(18% 6% 0% 6%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.6, ease: EASE_LUSSO, delay: 0.9 }}
        >
          <motion.div className="absolute inset-[-14%_0]" style={{ y }}>
            <Image src={foto} alt={altFoto} fill preload sizes="100vw" className="object-cover" />
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
