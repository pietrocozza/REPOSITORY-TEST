'use client'

import type { UseFormReturn } from 'react-hook-form'
import { AnimatePresence, motion } from 'motion/react'
import { ZONE, euro, findBurger } from '@/lib/menu'
import { useCart } from '@/lib/cart'
import { costoConsegna, prezzoRiga, subtotale } from '@/lib/pricing'
import type { Dati } from '@/lib/order-schema'
import { useScossa } from './Campo'
import { descriviItem } from './StepPanino'

export default function StepRiepilogo({ form, tentativo, erroreServer }: { form: UseFormReturn<Dati>; tentativo: number; erroreServer: string | null }) {
  const { items } = useCart()
  const {
    register,
    watch,
    formState: { errors },
  } = form
  const dati = watch()
  const sub = subtotale(items)
  const consegna = costoConsegna(dati.zona, sub)
  const zona = ZONE.find((z) => z.id === dati.zona)
  const scossaPag = useScossa(!!errors.pagamento, tentativo)
  const scossaConsenso = useScossa(!!errors.consenso, tentativo)

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
      <div>
        <h3 className="eyebrow mb-4">Il tuo ordine</h3>
        <ul className="divide-y divide-nero/10 border-y border-nero/15">
          {items.map((i) => (
            <li key={i.key} className="flex items-start justify-between gap-4 py-4">
              <span>
                <span className="block font-display text-xl">
                  {i.qty}× {findBurger(i.burgerId)?.nome}
                </span>
                <span className="block text-sm text-nero/60">{descriviItem(i)}</span>
              </span>
              <span className="font-display text-xl">{euro(prezzoRiga(i))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2">
          <div className="flex justify-between">
            <dt>Subtotale</dt>
            <dd>{euro(sub)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Consegna {zona ? `· ${zona.nome}` : ''}</dt>
            <dd>{consegna === 0 ? <span className="font-semibold text-lattuga">Gratis</span> : euro(consegna)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-nero/15 pt-4">
            <dt className="font-display text-2xl italic">Totale</dt>
            <dd className="font-display text-4xl" aria-live="polite">
              {euro(sub + consegna)}
            </dd>
          </div>
        </dl>
        <p className="mt-6 rounded-2xl bg-white/50 p-4 text-sm leading-relaxed text-nero/70 ring-1 ring-nero/10">
          Consegna a <strong>{dati.nome}</strong>, {dati.indirizzo} {dati.civico}, citofono “{dati.citofono}”. {dati.quando === 'asap' ? 'Il prima possibile.' : `Fascia ${dati.fascia}.`}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <fieldset ref={scossaPag} aria-describedby={errors.pagamento ? 'pagamento-errore' : undefined}>
          <legend className="eyebrow mb-4">Pagamento alla consegna</legend>
          <div className="grid gap-2">
            {[
              { id: 'contanti', nome: 'Contanti', nota: 'Il rider ha il resto (quasi sempre).' },
              { id: 'carta', nome: 'Carta / bancomat', nota: 'POS portatile, contactless.' },
            ].map((p) => (
              <label key={p.id} className="cursor-pointer">
                <input type="radio" value={p.id} className="peer sr-only" {...register('pagamento')} />
                <span className="flex min-h-16 flex-col justify-center rounded-2xl bg-white/60 px-5 py-3 ring-1 ring-nero/15 transition-all duration-300 peer-checked:bg-nero peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-pomodoro hover:ring-nero/50">
                  <span className="font-display text-lg">{p.nome}</span>
                  <span className="text-sm opacity-70">{p.nota}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-nero/55">Nessun pagamento online: paghi solo quando il panino è tra le tue mani.</p>
          <AnimatePresence>
            {errors.pagamento && (
              <motion.p id="pagamento-errore" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm font-medium text-pomodoro">
                ● {errors.pagamento.message}
              </motion.p>
            )}
          </AnimatePresence>
        </fieldset>

        <div ref={scossaConsenso}>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-nero"
              aria-invalid={!!errors.consenso}
              aria-describedby={errors.consenso ? 'consenso-errore' : undefined}
              {...register('consenso')}
            />
            <span className="text-sm leading-relaxed">
              Acconsento al trattamento dei miei dati personali al solo scopo di gestire e consegnare questo ordine. <span className="text-nero/50">(obbligatorio)</span>
            </span>
          </label>
          <AnimatePresence>
            {errors.consenso && (
              <motion.p id="consenso-errore" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm font-medium text-pomodoro">
                ● {errors.consenso.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {erroreServer && (
          <p role="alert" className="rounded-2xl bg-pomodoro/10 p-4 text-sm font-medium text-pomodoro">
            {erroreServer}
          </p>
        )}
      </div>
    </div>
  )
}
