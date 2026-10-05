'use client'

import { useSyncExternalStore } from 'react'
import { motion } from 'motion/react'
import { audio } from '@/lib/audio'
import { useRiduciMovimento } from '@/lib/hooks'

const SERVER = { enabled: true, playing: false }

/** Icona della musica: barre che si muovono quando suona, clic per spegnere o riaccendere */
export default function AudioToggle() {
  const stato = useSyncExternalStore(audio.subscribe, audio.getSnapshot, () => SERVER)
  const reduce = useRiduciMovimento()
  const attivo = stato.playing

  return (
    <button
      type="button"
      onClick={() => audio.toggle()}
      aria-pressed={attivo}
      aria-label={attivo ? 'Spegni la musica' : 'Accendi la musica'}
      title={attivo ? 'Spegni la musica' : 'Accendi la musica'}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-superficie"
    >
      <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className={`w-[2.5px] rounded-full ${attivo ? 'bg-ambra' : 'bg-crema/50'}`}
            animate={attivo && !reduce ? { height: ['25%', '100%', '40%', '75%', '25%'] } : { height: '25%' }}
            transition={{ duration: 1.1 + i * 0.17, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
          />
        ))}
      </span>
    </button>
  )
}
