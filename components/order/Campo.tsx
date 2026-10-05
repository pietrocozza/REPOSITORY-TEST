'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

export const inputCls =
  'h-12 w-full rounded-xl bg-notte px-4 text-base text-crema ring-1 ring-bordo transition-shadow placeholder:text-crema/30 focus:outline-none focus:ring-2 focus:ring-ambra aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-brace'

/** Piccola scossa (solo transform) quando un campo è sbagliato */
export function useScossa(attivo: boolean, tentativo: number) {
  const [scope, animate] = useAnimate()
  const reduce = useRiduciMovimento()
  useEffect(() => {
    if (!attivo || reduce || !scope.current) return
    animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 })
  }, [attivo, tentativo, animate, reduce, scope])
  return scope
}

export function Errore({ id, testo }: { id: string; testo?: string }) {
  return (
    <AnimatePresence>
      {testo && (
        <motion.p id={id} role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-sm text-[#ff8a75]">
          {testo}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

/** Etichetta + campo + errore in italiano accanto al campo */
export default function Campo({ id, label, errore, tentativo, children }: { id: string; label: string; errore?: string; tentativo: number; children: ReactNode }) {
  const scope = useScossa(!!errore, tentativo)
  return (
    <div ref={scope}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-crema-muta">
        {label}
      </label>
      {children}
      <Errore id={`${id}-errore`} testo={errore} />
    </div>
  )
}
