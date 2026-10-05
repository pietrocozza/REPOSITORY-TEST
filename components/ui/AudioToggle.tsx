'use client'

import { useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import { audio } from '@/lib/audio'
import Magnetic from './Magnetic'
import { useRiduciMovimento } from '@/lib/hooks'

const SERVER = { enabled: true, playing: false }

/** Icona audio sempre visibile: un disco che gira quando la musica suona */
export default function AudioToggle() {
  const stato = useSyncExternalStore(audio.subscribe, audio.getSnapshot, () => SERVER)
  const reduce = useRiduciMovimento()
  const attivo = stato.playing

  return (
    <div className="fixed bottom-4 right-4 z-[75] md:bottom-6 md:right-6">
      <Magnetic forza={0.4}>
        <button
          type="button"
          onClick={() => audio.toggle()}
          aria-pressed={attivo}
          aria-label={attivo ? 'Spegni la musica' : 'Accendi la musica'}
          className="group flex h-12 items-center gap-2 rounded-full border border-nero/15 bg-crema/85 py-1 pl-1 pr-4 backdrop-blur-md"
        >
          <motion.svg
            viewBox="0 0 40 40"
            className="h-10 w-10"
            animate={attivo && !reduce ? { rotate: 360 } : { rotate: 0 }}
            transition={attivo ? { duration: 3, ease: 'linear', repeat: Infinity } : { duration: 0.4 }}
          >
            <circle cx="20" cy="20" r="19" fill="#1A1A1A" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#3a3a3a" strokeWidth="1" />
            <circle cx="20" cy="20" r="10" fill="none" stroke="#3a3a3a" strokeWidth="1" />
            <circle cx="20" cy="20" r="6.5" fill="#E63B2E" />
            <circle cx="20" cy="20" r="1.6" fill="#FFF4E0" />
            <path d="M8 13 A14 14 0 0 1 14 7.5" stroke="#FFF4E0" strokeOpacity="0.35" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </motion.svg>
          {/* piccolo equalizzatore */}
          <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-nero"
                animate={attivo && !reduce ? { height: ['30%', '100%', '45%', '80%', '30%'] } : { height: '30%' }}
                transition={{ duration: 0.9 + i * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              />
            ))}
          </span>
          <span className="eyebrow text-[0.65rem]">{attivo ? 'On' : 'Off'}</span>
        </button>
      </Magnetic>
    </div>
  )
}
