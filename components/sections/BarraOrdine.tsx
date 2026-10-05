'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '@/lib/cart'
import { euro } from '@/lib/menu'
import { scrollToId } from '@/lib/scroll'
import { EASE_OUT } from '@/lib/animations'

/** Su mobile: barra fissa in basso con totale e "Ordina", appena c'è qualcosa nel carrello */
export default function BarraOrdine() {
  const { count, totaleProdotti } = useCart()
  const [riepilogoVisibile, setRiepilogoVisibile] = useState(false)

  // si nasconde quando il riepilogo è già sullo schermo
  useEffect(() => {
    const el = document.getElementById('riepilogo')
    if (!el) return
    const io = new IntersectionObserver(([e]) => setRiepilogoVisibile(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <AnimatePresence>
      {count > 0 && !riepilogoVisibile && (
        <motion.div
          initial={{ y: '120%' }}
          animate={{ y: 0 }}
          exit={{ y: '120%' }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="fixed inset-x-0 bottom-0 z-[70] px-3 md:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div className="flex items-center justify-between gap-3 rounded-full bg-superficie/95 py-2 pl-5 pr-2 ring-1 ring-bordo backdrop-blur-md">
            <p className="text-sm">
              <span className="text-crema-muta">
                {count} {count === 1 ? 'prodotto' : 'prodotti'} ·{' '}
              </span>
              <span className="font-bold tabular-nums text-ambra">{euro(totaleProdotti)}</span>
            </p>
            <button type="button" onClick={() => scrollToId('riepilogo')} className="h-11 rounded-full bg-ambra px-6 text-sm font-bold text-notte">
              Ordina
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
