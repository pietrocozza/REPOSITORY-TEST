'use client'

import { AnimatePresence, motion } from 'motion/react'
import CiboSospeso from '@/components/ui/CiboSospeso'
import Foto from '@/components/ui/Foto'
import Riepilogo from '@/components/order/Riepilogo'
import { EASE_OUT, VIEWPORT_ONCE } from '@/lib/animations'
import { useCart } from '@/lib/cart'
import { BURGERS, CONTORNI, euro, type Prodotto } from '@/lib/menu'

/** Sezione 4: menu compatto + riepilogo e modulo d'ordine accanto (sotto su mobile) */
export default function MenuOrdine() {
  return (
    <section id="ordina" aria-labelledby="menu-titolo" className="relative px-4 py-24 md:px-8 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="min-w-0">
          <header className="mb-10">
            <p className="etichetta mb-3 text-ambra">Scegli, aggiungi, ordina</p>
            <h2 id="menu-titolo" className="titolo-lg">
              Il menu
            </h2>
          </header>
          <Gruppo titolo="Burger" prodotti={BURGERS} />
          <Gruppo titolo="Contorni" prodotti={CONTORNI} />
        </div>

        <aside id="riepilogo" aria-label="Il tuo ordine" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-superficie p-5 ring-1 ring-bordo md:p-6">
            <Riepilogo />
          </div>
        </aside>
      </div>
    </section>
  )
}

function Gruppo({ titolo, prodotti }: { titolo: string; prodotti: Prodotto[] }) {
  return (
    <div className="mb-10">
      <h3 className="etichetta mb-4 text-crema-muta">{titolo}</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {prodotti.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: (i % 2) * 0.08 }}
          >
            <Card prodotto={p} />
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function Card({ prodotto }: { prodotto: Prodotto }) {
  const { aggiungi, righe } = useCart()
  const qty = righe.find((r) => r.id === prodotto.id)?.qty ?? 0
  const forma = prodotto.id === 'patatine' ? 'patatine' : prodotto.id === 'anelli' ? 'anelli' : 'burger'

  return (
    <article className="group relative flex h-full items-center gap-4 rounded-3xl bg-superficie p-3 pr-4 ring-1 ring-bordo transition-colors duration-300 hover:ring-ambra/40">
      <div className="w-24 shrink-0 xl:w-32">
        <CiboSospeso parallax={0} inclinazione={14} bagliore={0.7} onAggiungi={() => aggiungi(prodotto.id)} etichettaAggiungi={`Aggiungi ${prodotto.nome} al carrello`}>
          <Foto foto={prodotto.foto} alt={prodotto.nome} larghezza={800} altezza={600} forma={forma} mostraNome={false} sizes="128px" />
        </CiboSospeso>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-display text-2xl uppercase leading-none">{prodotto.nome}</h4>
        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-crema-muta">{prodotto.descrizione}</p>
        <p className="mt-2 font-bold tabular-nums text-ambra">{euro(prodotto.prezzo)}</p>
      </div>
      <div className="relative">
        <motion.button
          type="button"
          onClick={() => aggiungi(prodotto.id)}
          whileTap={{ scale: 0.9 }}
          aria-label={`Aggiungi ${prodotto.nome} al carrello`}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ambra text-2xl font-bold leading-none text-notte transition-transform duration-300 hover:scale-110"
        >
          +
        </motion.button>
        <AnimatePresence>
          {qty > 0 && (
            <motion.span
              key={qty}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-crema px-1 text-[0.65rem] font-bold text-notte"
              aria-label={`${qty} nel carrello`}
            >
              {qty}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </article>
  )
}
