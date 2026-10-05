'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { useRiduciMovimento } from '@/lib/hooks'

/** Stile comune dei campi di testo */
export const inputCls =
  'h-14 w-full rounded-2xl bg-white/70 px-5 text-base text-nero ring-1 ring-nero/15 transition-shadow placeholder:text-nero/35 focus:outline-none focus:ring-2 focus:ring-nero aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-pomodoro'

/** Hook: fa "tremare" un elemento quando c'è un errore (a ogni nuovo tentativo) */
export function useScossa(attivo: boolean, tentativo: number) {
  const [scope, animate] = useAnimate()
  const reduce = useRiduciMovimento()
  useEffect(() => {
    if (!attivo || reduce || !scope.current) return
    animate(scope.current, { x: [0, -10, 10, -7, 7, -3, 0] }, { duration: 0.45 })
  }, [attivo, tentativo, animate, reduce, scope])
  return scope
}

/** Etichetta + campo + messaggio d'errore in italiano accanto al campo */
export default function Campo({
  id,
  label,
  errore,
  tentativo,
  children,
  aiuto,
  className,
}: {
  id: string
  label: string
  errore?: string
  tentativo: number
  children: ReactNode
  aiuto?: string
  className?: string
}) {
  const scope = useScossa(!!errore, tentativo)
  return (
    <div ref={scope} className={className}>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between gap-3 text-sm font-semibold">
        {label}
        {aiuto && <span className="text-xs font-normal text-nero/50">{aiuto}</span>}
      </label>
      {children}
      <AnimatePresence>
        {errore && (
          <motion.p
            id={`${id}-errore`}
            role="alert"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="mt-2 flex items-center gap-2 text-sm font-medium text-pomodoro"
          >
            <span aria-hidden="true">●</span>
            {errore}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Pulsante-pillola per scelte singole o multiple (radio/checkbox nascosti ma accessibili) */
export function Pillola({
  tipo,
  name,
  checked,
  onChange,
  children,
  extra,
}: {
  tipo: 'radio' | 'checkbox'
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
  extra?: ReactNode
}) {
  return (
    <label className="relative cursor-pointer">
      <input type={tipo} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-nero/20 transition-all duration-300 peer-checked:bg-nero peer-checked:text-crema peer-checked:ring-nero peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pomodoro hover:ring-nero/60">
        {children}
        {extra && <span className="text-xs opacity-70">{extra}</span>}
      </span>
    </label>
  )
}
