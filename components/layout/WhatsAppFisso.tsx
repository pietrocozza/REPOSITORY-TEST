'use client'

import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { SITO, linkWhatsApp } from '@/lib/site'
import { EASE_LUSSO } from '@/lib/animazioni'

/** Pulsante WhatsApp sempre a portata di mano, compare dopo il primo scroll */
export default function WhatsAppFisso() {
  const { scrollY } = useScroll()
  const [visibile, setVisibile] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setVisibile(y > 400))

  return (
    <motion.a
      href={linkWhatsApp('Ciao Soluzione Affitto, vorrei informazioni sulla gestione del mio appartamento.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Scrivici su WhatsApp (${SITO.whatsapp.numero})`}
      className="group fixed right-4 bottom-4 z-30 flex items-center gap-3 rounded-full bg-[#1f7a4d] py-3 pr-3 pl-5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] md:right-8 md:bottom-8"
      initial={false}
      animate={{ y: visibile ? 0 : 120, opacity: visibile ? 1 : 0 }}
      transition={{ duration: 0.7, ease: EASE_LUSSO }}
      tabIndex={visibile ? 0 : -1}
    >
      <span className="hidden sm:inline">Scrivici</span>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.1c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3Zm0 23.2c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.2 1.3-4-.3-.4a10.4 10.4 0 0 1-1.6-5.6C5.5 9.9 10.2 5.3 16 5.3s10.5 4.6 10.5 10.3S21.8 26.2 16 26.2Zm5.8-7.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.6 8.6 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.4 3.4c.2.2 2.4 3.6 5.8 5 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z"
        />
      </svg>
    </motion.a>
  )
}
