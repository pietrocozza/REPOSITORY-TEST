'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CiboSospeso from '@/components/ui/CiboSospeso'
import Foto from '@/components/ui/Foto'
import Magnetic from '@/components/ui/Magnetic'
import { EASE_OUT, VIEWPORT_ONCE } from '@/lib/animations'
import { useCart } from '@/lib/cart'
import { useRiduciMovimento } from '@/lib/hooks'
import { SECONDO, euro, trovaProdotto } from '@/lib/menu'

/** Sezione 3: il secondo panino in evidenza */
export default function SecondoBurger() {
  const prodotto = trovaProdotto(SECONDO.id)!
  const { aggiungi } = useCart()
  const reduce = useRiduciMovimento()
  const [aggiunto, setAggiunto] = useState(false)

  const add = () => {
    aggiungi(prodotto.id)
    setAggiunto(true)
    setTimeout(() => setAggiunto(false), 1600)
  }

  return (
    <section aria-labelledby="secondo-titolo" className="relative flex min-h-svh items-center overflow-hidden px-4 py-24 md:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[70%]" style={{ background: 'radial-gradient(50% 60% at 30% 0%, rgba(255,190,110,0.12), transparent 70%)' }} />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-[1.2fr_1fr] md:gap-16">
        {/* la foto entra ruotando */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -28, scale: 0.7, x: -60 }}
          whileInView={{ opacity: 1, rotate: 0, scale: 1, x: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 1.3, ease: EASE_OUT }}
        >
          <CiboSospeso parallax={70} onAggiungi={add} etichettaAggiungi={`Aggiungi ${prodotto.nome} al carrello`}>
            <Foto foto={SECONDO.foto} alt={prodotto.nome} larghezza={1600} altezza={1200} forma="burger" sizes="(max-width: 768px) 90vw, 50vw" />
          </CiboSospeso>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.2 }}
        >
          <p className="etichetta mb-4 text-brace">Il più ricco</p>
          <h2 id="secondo-titolo" className="titolo-lg">
            {prodotto.nome}
          </h2>
          <ul className="mt-6 flex flex-col gap-2 text-lg text-crema-muta">
            {SECONDO.ingredienti.map((ing) => (
              <li key={ing} className="flex items-center gap-3">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ambra" />
                {ing}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <p className="font-display text-5xl text-ambra">{euro(prodotto.prezzo)}</p>
            <Magnetic>
              <button type="button" onClick={add} className="relative h-14 min-w-40 overflow-hidden rounded-full bg-ambra px-8 font-bold text-notte transition-transform duration-300 hover:scale-[1.04]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={aggiunto ? 'ok' : 'add'} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="block">
                    {aggiunto ? 'Aggiunto ✓' : 'Aggiungi'}
                  </motion.span>
                </AnimatePresence>
              </button>
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
