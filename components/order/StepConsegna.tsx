'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { UseFormReturn } from 'react-hook-form'
import { FASCE_CONSEGNA } from '@/lib/info'
import { SOGLIA_CONSEGNA_GRATIS, ZONE, euro } from '@/lib/menu'
import type { Dati } from '@/lib/order-schema'
import Campo, { Pillola, inputCls, useScossa } from './Campo'

export default function StepConsegna({ form, tentativo }: { form: UseFormReturn<Dati>; tentativo: number }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form
  const quando = watch('quando')
  const err = (k: keyof Dati) => (errors[k]?.message as string | undefined) ?? undefined
  const aria = (k: keyof Dati) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-errore` : undefined })
  const scossaZona = useScossa(!!errors.zona, tentativo)

  return (
    <div className="grid gap-x-6 gap-y-7 md:grid-cols-6">
      <Campo id="nome" label="Nome e cognome" errore={err('nome')} tentativo={tentativo} className="md:col-span-3">
        <input id="nome" autoComplete="name" className={inputCls} placeholder="Rosa Santa" {...register('nome')} {...aria('nome')} />
      </Campo>
      <Campo id="telefono" label="Telefono" aiuto="per avvisarti all'arrivo" errore={err('telefono')} tentativo={tentativo} className="md:col-span-3">
        {/* type="tel" + inputMode: su mobile appare la tastiera numerica */}
        <input id="telefono" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} placeholder="333 1234567" {...register('telefono')} {...aria('telefono')} />
      </Campo>
      <Campo id="indirizzo" label="Via o piazza" errore={err('indirizzo')} tentativo={tentativo} className="md:col-span-4">
        <input id="indirizzo" autoComplete="address-line1" className={inputCls} placeholder="Via San Pellegrino" {...register('indirizzo')} {...aria('indirizzo')} />
      </Campo>
      <Campo id="civico" label="Civico" errore={err('civico')} tentativo={tentativo} className="md:col-span-2">
        <input id="civico" inputMode="text" className={inputCls} placeholder="12/A" {...register('civico')} {...aria('civico')} />
      </Campo>
      <Campo id="citofono" label="Nome sul citofono" errore={err('citofono')} tentativo={tentativo} className="md:col-span-3">
        <input id="citofono" className={inputCls} placeholder="Rossi" {...register('citofono')} {...aria('citofono')} />
      </Campo>
      <Campo id="note" label="Note per il rider" aiuto="facoltative" errore={err('note')} tentativo={tentativo} className="md:col-span-3">
        <input id="note" className={inputCls} placeholder="Terzo piano, scala a destra" {...register('note')} {...aria('note')} />
      </Campo>

      {/* Zona di consegna */}
      <fieldset ref={scossaZona} className="md:col-span-6" aria-describedby={errors.zona ? 'zona-errore' : undefined}>
        <legend className="mb-2 text-sm font-semibold">Zona di consegna (solo Viterbo)</legend>
        <p className="mb-4 text-sm text-nero/60">Consegna gratuita sopra {euro(SOGLIA_CONSEGNA_GRATIS)}.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ZONE.map((z) => (
            <label key={z.id} className="cursor-pointer">
              <input type="radio" value={z.id} className="peer sr-only" {...register('zona')} />
              <span className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white/60 px-5 py-3 ring-1 ring-nero/15 transition-all duration-300 peer-checked:bg-nero peer-checked:text-crema peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-pomodoro hover:ring-nero/50">
                <span className="text-sm font-medium">{z.nome}</span>
                <span className="font-display text-base italic">{euro(z.costo)}</span>
              </span>
            </label>
          ))}
        </div>
        <AnimatePresence>
          {errors.zona && (
            <motion.p id="zona-errore" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm font-medium text-pomodoro">
              ● {errors.zona.message}
            </motion.p>
          )}
        </AnimatePresence>
      </fieldset>

      {/* Orario */}
      <fieldset className="md:col-span-6">
        <legend className="mb-4 text-sm font-semibold">Quando lo vuoi?</legend>
        <div className="flex flex-wrap gap-2">
          <Pillola tipo="radio" name="quando" checked={quando === 'asap'} onChange={() => setValue('quando', 'asap', { shouldValidate: true })}>
            Il prima possibile
          </Pillola>
          <Pillola tipo="radio" name="quando" checked={quando === 'fascia'} onChange={() => setValue('quando', 'fascia', { shouldValidate: true })}>
            Scelgo una fascia oraria
          </Pillola>
        </div>
        <AnimatePresence initial={false}>
          {quando === 'fascia' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Campo id="fascia" label="Fascia oraria" aiuto="dentro l'orario di apertura" errore={err('fascia')} tentativo={tentativo} className="mt-5 max-w-sm pb-1">
                <select id="fascia" className={inputCls} {...register('fascia')} {...aria('fascia')}>
                  <option value="">Scegli…</option>
                  {FASCE_CONSEGNA.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </Campo>
            </motion.div>
          )}
        </AnimatePresence>
      </fieldset>
    </div>
  )
}
