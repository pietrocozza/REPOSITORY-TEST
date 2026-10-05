'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCart } from '@/lib/cart'
import { FASCE_CONSEGNA } from '@/lib/info'
import { SOGLIA_CONSEGNA_GRATIS, ZONE, costoConsegna, euro, trovaProdotto } from '@/lib/menu'
import { datiSchema, type Dati } from '@/lib/order-schema'
import { EASE_OUT } from '@/lib/animations'
import Campo, { Errore, inputCls, useScossa } from './Campo'

type Esito = { numero: string; eta: string; totale: number; nome: string }

/** Riepilogo sempre visibile + dati di consegna + invio, tutto in un solo passaggio */
export default function Riepilogo() {
  const { righe, imposta, svuota, totaleProdotti } = useCart()
  const [tentativo, setTentativo] = useState(0)
  const [carrelloVuoto, setCarrelloVuoto] = useState(false)
  const [invio, setInvio] = useState(false)
  const [erroreServer, setErroreServer] = useState<string | null>(null)
  const [esito, setEsito] = useState<Esito | null>(null)
  const scossaCarrello = useScossa(carrelloVuoto && !righe.length, tentativo)

  const form = useForm<Dati>({
    resolver: zodResolver(datiSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', telefono: '', indirizzo: '', orario: 'asap', note: '', consenso: false },
  })
  const {
    register,
    formState: { errors },
  } = form
  const zona = useWatch({ control: form.control, name: 'zona' })
  const consegna = righe.length ? costoConsegna(zona, totaleProdotti) : 0
  const err = (k: keyof Dati) => errors[k]?.message as string | undefined
  const aria = (k: keyof Dati) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-errore` : undefined })

  const invia = form.handleSubmit(
    async (dati) => {
      if (!righe.length) {
        setCarrelloVuoto(true)
        setTentativo((t) => t + 1)
        return
      }
      setInvio(true)
      setErroreServer(null)
      try {
        const r = await fetch('/api/ordine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrello: righe, dati }),
        })
        const json = await r.json()
        if (!r.ok || !json.ok) throw new Error(json.messaggio ?? 'Qualcosa è andato storto. Riprova.')
        setEsito({ numero: json.numero, eta: json.eta, totale: json.totale, nome: dati.nome })
        svuota()
        form.reset()
      } catch (e) {
        setErroreServer(e instanceof Error ? e.message : 'Errore di rete: riprova tra un attimo.')
      } finally {
        setInvio(false)
      }
    },
    () => {
      setTentativo((t) => t + 1)
      if (!righe.length) setCarrelloVuoto(true)
    },
  )

  if (esito) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }} role="status" className="flex flex-col gap-6">
        <p className="etichetta text-ambra">Ordine ricevuto</p>
        <p className="font-display text-5xl uppercase leading-none">Grazie, {esito.nome.split(' ')[0]}!</p>
        <dl className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-notte p-4">
            <dt className="etichetta text-crema-muta">Numero</dt>
            <dd className="mt-1 font-display text-2xl">{esito.numero}</dd>
          </div>
          <div className="rounded-2xl bg-notte p-4">
            <dt className="etichetta text-crema-muta">Arriva</dt>
            <dd className="mt-1 font-display text-2xl">{esito.eta}</dd>
          </div>
          <div className="col-span-2 rounded-2xl bg-notte p-4">
            <dt className="etichetta text-crema-muta">Da pagare alla consegna</dt>
            <dd className="mt-1 font-display text-3xl text-ambra">{euro(esito.totale)}</dd>
          </div>
        </dl>
        <p className="text-sm text-crema-muta">Locale inventato: l’ordine non è stato inviato a nessuno.</p>
        <button type="button" onClick={() => setEsito(null)} className="h-12 rounded-full ring-1 ring-bordo transition-colors hover:bg-notte">
          Nuovo ordine
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={invia} noValidate className="flex flex-col gap-6">
      {/* Riepilogo */}
      <div ref={scossaCarrello}>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-3xl uppercase">Il tuo ordine</h3>
        </div>
        {righe.length === 0 ? (
          <p className={`text-sm ${carrelloVuoto ? 'text-[#ff8a75]' : 'text-crema-muta'}`} role={carrelloVuoto ? 'alert' : undefined}>
            {carrelloVuoto ? 'Aggiungi almeno un prodotto per ordinare.' : 'Vuoto. Premi + su un panino per iniziare.'}
          </p>
        ) : (
          <ul className="divide-y divide-bordo">
            <AnimatePresence initial={false}>
              {righe.map((r) => {
                const prod = trovaProdotto(r.id)!
                return (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 overflow-hidden py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">{prod.nome}</span>
                    <span className="flex items-center rounded-full ring-1 ring-bordo">
                      <button type="button" onClick={() => imposta(r.id, r.qty - 1)} aria-label={`Togli un ${prod.nome}`} className="h-11 w-10 text-lg text-crema-muta hover:text-crema">
                        −
                      </button>
                      <output className="w-6 text-center tabular-nums" aria-live="polite">
                        {r.qty}
                      </output>
                      <button type="button" onClick={() => imposta(r.id, r.qty + 1)} aria-label={`Aggiungi un ${prod.nome}`} className="h-11 w-10 text-lg text-crema-muta hover:text-crema">
                        +
                      </button>
                    </span>
                    <span className="w-16 text-right tabular-nums">{euro(prod.prezzo * r.qty)}</span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
        <dl className="mt-3 space-y-1 border-t border-bordo pt-3 text-sm">
          <div className="flex justify-between text-crema-muta">
            <dt>Prodotti</dt>
            <dd className="tabular-nums">{euro(totaleProdotti)}</dd>
          </div>
          <div className="flex justify-between text-crema-muta">
            <dt>Consegna {totaleProdotti < SOGLIA_CONSEGNA_GRATIS && `(gratis sopra ${euro(SOGLIA_CONSEGNA_GRATIS)})`}</dt>
            <dd className="tabular-nums">{righe.length && consegna === 0 && zona ? 'Gratis' : euro(consegna)}</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-semibold">Totale</dt>
            <dd className="font-display text-4xl tabular-nums text-ambra" aria-live="polite">
              {euro(totaleProdotti + consegna)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Dati di consegna */}
      <div className="flex flex-col gap-4 border-t border-bordo pt-6">
        <Campo id="nome" label="Nome e cognome" errore={err('nome')} tentativo={tentativo}>
          <input id="nome" autoComplete="name" className={inputCls} {...register('nome')} {...aria('nome')} />
        </Campo>
        <Campo id="telefono" label="Telefono" errore={err('telefono')} tentativo={tentativo}>
          <input id="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="333 1234567" className={inputCls} {...register('telefono')} {...aria('telefono')} />
        </Campo>
        <Campo id="indirizzo" label="Indirizzo e civico" errore={err('indirizzo')} tentativo={tentativo}>
          <input id="indirizzo" autoComplete="street-address" placeholder="Via San Pellegrino 12" className={inputCls} {...register('indirizzo')} {...aria('indirizzo')} />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="zona" label="Zona di Viterbo" errore={err('zona')} tentativo={tentativo}>
            <select id="zona" className={inputCls} defaultValue="" {...register('zona')} {...aria('zona')}>
              <option value="" disabled>
                Scegli…
              </option>
              {ZONE.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nome} ({euro(z.costo)})
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="orario" label="Orario" errore={err('orario')} tentativo={tentativo}>
            <select id="orario" className={inputCls} {...register('orario')} {...aria('orario')}>
              <option value="asap">Il prima possibile</option>
              {FASCE_CONSEGNA.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo id="note" label="Note per il rider (facoltative)" errore={err('note')} tentativo={tentativo}>
          <input id="note" placeholder="Citofono, piano, scala…" className={inputCls} {...register('note')} {...aria('note')} />
        </Campo>

        <fieldset aria-describedby={errors.pagamento ? 'pagamento-errore' : undefined}>
          <legend className="mb-1.5 text-sm font-semibold text-crema-muta">Pagamento alla consegna</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'contanti', nome: 'Contanti' },
              { id: 'carta', nome: 'Carta' },
            ].map((p) => (
              <label key={p.id} className="cursor-pointer">
                <input type="radio" value={p.id} className="peer sr-only" {...register('pagamento')} />
                <span className="flex h-12 items-center justify-center rounded-xl ring-1 ring-bordo transition-colors peer-checked:bg-ambra peer-checked:font-bold peer-checked:text-notte peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-ambra">
                  {p.nome}
                </span>
              </label>
            ))}
          </div>
          <Errore id="pagamento-errore" testo={err('pagamento')} />
        </fieldset>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-crema-muta">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#FFB020]" {...register('consenso')} {...aria('consenso')} />
            Acconsento al trattamento dei miei dati solo per gestire e consegnare questo ordine.
          </label>
          <Errore id="consenso-errore" testo={err('consenso')} />
        </div>

        {erroreServer && (
          <p role="alert" className="rounded-xl bg-brace/15 p-3 text-sm text-[#ff8a75]">
            {erroreServer}
          </p>
        )}

        <button type="submit" disabled={invio} className="flex h-14 items-center justify-between rounded-full bg-ambra pl-7 pr-2 font-bold text-notte transition-transform duration-300 hover:scale-[1.02] disabled:opacity-70">
          {invio ? 'Invio in corso…' : 'Invia ordine'}
          <span className="rounded-full bg-notte px-4 py-2.5 text-sm tabular-nums text-ambra">{euro(totaleProdotti + consegna)}</span>
        </button>
      </div>
    </form>
  )
}
