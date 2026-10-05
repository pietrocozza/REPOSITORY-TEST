'use client'

import { AnimatePresence, motion } from 'motion/react'
import Burger from '@/components/burger/Burger'
import { LAYERS, type LayerId } from '@/components/burger/layers'
import { BIBITE, BURGERS, CONTORNI, COTTURE, EXTRA, euro, findBurger } from '@/lib/menu'
import { BOZZA_VUOTA, useCart } from '@/lib/cart'
import { RIMOVIBILI, prezzoRiga, prezzoUnitario, ricetta, subtotale, type CartItem } from '@/lib/pricing'
import { Pillola, inputCls, useScossa } from './Campo'

export function descriviItem(i: CartItem) {
  const parti = [COTTURE.find((c) => c.id === i.cottura)?.nome.toLowerCase()]
  i.extra.forEach((e) => parti.push(`+ ${EXTRA.find((x) => x.id === e)?.nome.toLowerCase()}`))
  i.senza.forEach((s) => parti.push(`senza ${LAYERS[s].nome.split(' ')[0].toLowerCase()}`))
  const c = CONTORNI.find((x) => x.id === i.contorno)
  const b = BIBITE.find((x) => x.id === i.bibita)
  if (c) parti.push(`+ ${c.nome.toLowerCase()}`)
  if (b) parti.push(`+ ${b.nome.toLowerCase()}`)
  return parti.filter(Boolean).join(' · ')
}

export default function StepPanino({ erroreCarrello, tentativo }: { erroreCarrello: boolean; tentativo: number }) {
  const { bozza, setBozza, add, items, remove } = useCart()
  const burger = findBurger(bozza.burgerId) ?? BURGERS[0]
  const strati = ricetta(bozza.burgerId, bozza.extra, bozza.senza)
  const togli = [...new Set(burger.strati.filter((s) => RIMOVIBILI.includes(s)))] as LayerId[]
  const scossa = useScossa(erroreCarrello, tentativo)

  const toggle = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v])

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
      {/* Anteprima dal vivo */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-cheddar/90">
          <motion.div
            aria-hidden="true"
            className="absolute inset-[12%] rounded-full border border-nero/15"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            style={{ borderStyle: 'dashed' }}
          />
          <div className="relative w-[58%] max-w-[300px]">
            <Burger strati={strati} label={`Anteprima del tuo ${burger.nome}`} />
          </div>
          <p className="absolute bottom-5 left-6 font-display text-2xl italic">{burger.nome}</p>
          <p className="absolute bottom-5 right-6 font-display text-2xl" aria-live="polite">
            {euro(prezzoUnitario(bozza) * bozza.qty)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-9">
        {/* Scelta del panino */}
        <fieldset>
          <legend className="eyebrow mb-4">1 · Scegli il panino</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BURGERS.map((b) => (
              <label key={b.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="burger"
                  className="peer sr-only"
                  checked={bozza.burgerId === b.id}
                  onChange={() => setBozza({ ...BOZZA_VUOTA, burgerId: b.id })}
                />
                <motion.span
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex h-full flex-col items-center gap-2 rounded-3xl bg-white/60 p-3 text-center ring-1 ring-nero/10 transition-colors duration-300 peer-checked:bg-nero peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-pomodoro"
                >
                  <span className="block w-16">
                    <Burger strati={b.strati} label={b.nome} />
                  </span>
                  <span className="font-display text-base leading-tight">{b.nome}</span>
                  <span className="text-xs opacity-70">{euro(b.prezzo)}</span>
                </motion.span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-9 sm:grid-cols-2">
          {/* Quantità */}
          <fieldset>
            <legend className="eyebrow mb-4">2 · Quantità</legend>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Togli uno"
                onClick={() => setBozza((b) => ({ ...b, qty: Math.max(1, b.qty - 1) }))}
                className="flex h-12 w-12 items-center justify-center rounded-full text-xl ring-1 ring-nero/25 transition-colors hover:bg-nero hover:text-crema"
              >
                −
              </button>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.output
                  key={bozza.qty}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="w-10 text-center font-display text-4xl tabular-nums"
                  aria-live="polite"
                >
                  {bozza.qty}
                </motion.output>
              </AnimatePresence>
              <button
                type="button"
                aria-label="Aggiungi uno"
                onClick={() => setBozza((b) => ({ ...b, qty: Math.min(20, b.qty + 1) }))}
                className="flex h-12 w-12 items-center justify-center rounded-full text-xl ring-1 ring-nero/25 transition-colors hover:bg-nero hover:text-crema"
              >
                +
              </button>
            </div>
          </fieldset>

          {/* Cottura */}
          {burger.id !== 'orto' && (
            <fieldset>
              <legend className="eyebrow mb-4">3 · Cottura</legend>
              <div className="flex flex-wrap gap-2">
                {COTTURE.map((c) => (
                  <Pillola key={c.id} tipo="radio" name="cottura" checked={bozza.cottura === c.id} onChange={() => setBozza((b) => ({ ...b, cottura: c.id }))}>
                    {c.nome}
                  </Pillola>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {/* Extra */}
        <fieldset>
          <legend className="eyebrow mb-4">Extra</legend>
          <div className="flex flex-wrap gap-2">
            {EXTRA.map((e) => (
              <Pillola key={e.id} tipo="checkbox" name="extra" checked={bozza.extra.includes(e.id)} onChange={() => setBozza((b) => ({ ...b, extra: toggle(b.extra, e.id) }))} extra={`+${euro(e.prezzo)}`}>
                {e.nome}
              </Pillola>
            ))}
          </div>
        </fieldset>

        {/* Ingredienti da togliere */}
        {togli.length > 0 && (
          <fieldset>
            <legend className="eyebrow mb-4">Togli qualcosa</legend>
            <div className="flex flex-wrap gap-2">
              {togli.map((s) => (
                <Pillola key={s} tipo="checkbox" name="senza" checked={bozza.senza.includes(s)} onChange={() => setBozza((b) => ({ ...b, senza: toggle(b.senza, s) }))}>
                  <span className={bozza.senza.includes(s) ? 'line-through' : ''}>{LAYERS[s].nome}</span>
                </Pillola>
              ))}
            </div>
          </fieldset>
        )}

        {/* Contorno e bibita */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contorno" className="eyebrow mb-3 block">
              Contorno <span className="normal-case tracking-normal text-nero/50">(facoltativo)</span>
            </label>
            <select id="contorno" className={inputCls} value={bozza.contorno ?? ''} onChange={(e) => setBozza((b) => ({ ...b, contorno: e.target.value || undefined }))}>
              <option value="">Nessun contorno</option>
              {CONTORNI.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} (+{euro(c.prezzo)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bibita" className="eyebrow mb-3 block">
              Bibita <span className="normal-case tracking-normal text-nero/50">(facoltativa)</span>
            </label>
            <select id="bibita" className={inputCls} value={bozza.bibita ?? ''} onChange={(e) => setBozza((b) => ({ ...b, bibita: e.target.value || undefined }))}>
              <option value="">Nessuna bibita</option>
              {BIBITE.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} (+{euro(c.prezzo)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={() => {
            add(bozza)
            setBozza((b) => ({ ...BOZZA_VUOTA, burgerId: b.burgerId }))
          }}
          whileTap={{ scale: 0.97 }}
          className="group relative flex h-16 items-center justify-between overflow-hidden rounded-full bg-pomodoro pl-7 pr-2 text-lg font-semibold text-crema"
        >
          <span className="absolute inset-0 translate-y-full rounded-full bg-nero transition-transform duration-500 ease-out group-hover:translate-y-0" />
          <span className="relative">Aggiungi al carrello</span>
          <span className="relative rounded-full bg-crema px-5 py-3 text-base text-nero">{euro(prezzoUnitario(bozza) * bozza.qty)}</span>
        </motion.button>

        {/* Carrello riepilogativo */}
        <div ref={scossa} className="rounded-[1.75rem] bg-white/55 p-5 ring-1 ring-nero/10 md:p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-display text-2xl italic">Il tuo carrello</h3>
            <span className="text-sm text-nero/60">{items.reduce((s, i) => s + i.qty, 0)} panini</span>
          </div>
          {items.length === 0 ? (
            <p className={`text-sm ${erroreCarrello ? 'font-semibold text-pomodoro' : 'text-nero/60'}`} role={erroreCarrello ? 'alert' : undefined}>
              {erroreCarrello ? 'Aggiungi almeno un panino al carrello per continuare.' : 'Ancora vuoto. Il panino là sopra ti sta guardando.'}
            </p>
          ) : (
            <ul className="divide-y divide-nero/10">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li
                    key={i.key}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, x: 40 }}
                    className="flex items-start gap-3 overflow-hidden py-3"
                  >
                    <span className="w-10 shrink-0 pt-1">
                      <Burger strati={ricetta(i.burgerId, i.extra, i.senza)} label="" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">
                        {i.qty}× {findBurger(i.burgerId)?.nome}
                      </span>
                      <span className="block text-sm text-nero/60">{descriviItem(i)}</span>
                    </span>
                    <span className="font-display text-lg">{euro(prezzoRiga(i))}</span>
                    <button
                      type="button"
                      onClick={() => remove(i.key)}
                      aria-label={`Rimuovi ${findBurger(i.burgerId)?.nome} dal carrello`}
                      className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-nero/50 transition-colors hover:bg-nero hover:text-crema"
                    >
                      ×
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          {items.length > 0 && (
            <p className="mt-3 flex justify-between border-t border-nero/15 pt-3 font-semibold">
              <span>Subtotale</span>
              <span>{euro(subtotale(items))}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
