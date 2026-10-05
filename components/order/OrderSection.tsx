'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import KineticText from '@/components/ui/KineticText'
import Magnetic from '@/components/ui/Magnetic'
import Mascot from '@/components/ui/Mascot'
import { useCart } from '@/lib/cart'
import { CAMPI_CONFERMA, CAMPI_CONSEGNA, datiSchema, type Dati } from '@/lib/order-schema'
import { scrollToId } from '@/lib/scroll'
import { EASE_OUT } from '@/lib/animations'
import StepPanino from './StepPanino'
import StepConsegna from './StepConsegna'
import StepRiepilogo from './StepRiepilogo'
import Conferma, { type Esito } from './Conferma'
import { useRiduciMovimento } from '@/lib/hooks'

const PASSI = ['Il panino', 'La consegna', 'Conferma']

export default function OrderSection() {
  const reduce = useRiduciMovimento()
  const { items, clear, preselezioneTick } = useCart()
  const [passo, setPasso] = useState(0)
  const [verso, setVerso] = useState(1)
  const [tentativo, setTentativo] = useState(0)
  const [erroreCarrello, setErroreCarrello] = useState(false)
  const [invio, setInvio] = useState(false)
  const [erroreServer, setErroreServer] = useState<string | null>(null)
  const [esito, setEsito] = useState<Esito | null>(null)

  // Un solo modulo per i passaggi 2 e 3: i dati restano se torni indietro
  const form = useForm<Dati>({
    resolver: zodResolver(datiSchema),
    mode: 'onTouched',
    defaultValues: { nome: '', telefono: '', indirizzo: '', civico: '', citofono: '', note: '', quando: 'asap', fascia: '', consenso: false },
  })

  // "Ordina" su una card del menu: si torna al passaggio 1 con quel panino selezionato
  const [tickVisto, setTickVisto] = useState(preselezioneTick)
  if (preselezioneTick !== tickVisto) {
    setTickVisto(preselezioneTick)
    setEsito(null)
    setVerso(-1)
    setPasso(0)
  }

  const vai = (n: number) => {
    setVerso(n > passo ? 1 : -1)
    setPasso(n)
    scrollToId('ordina')
  }

  const avanti = async () => {
    if (passo === 0) {
      if (!items.length) {
        setErroreCarrello(true)
        setTentativo((t) => t + 1)
        return
      }
      return vai(1)
    }
    if (passo === 1) {
      const ok = await form.trigger([...CAMPI_CONSEGNA])
      if (!ok) {
        setTentativo((t) => t + 1)
        return
      }
      return vai(2)
    }
  }

  const invia = form.handleSubmit(
    async (dati) => {
      setInvio(true)
      setErroreServer(null)
      try {
        const r = await fetch('/api/ordine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carrello: items, dati }),
        })
        const json = await r.json()
        if (!r.ok || !json.ok) throw new Error(json.messaggio ?? 'Qualcosa è andato storto.')
        setEsito({ numero: json.numero, eta: json.eta, totale: json.totale, nome: dati.nome })
        clear()
        form.reset()
        setPasso(0)
        scrollToId('ordina')
      } catch (e) {
        setErroreServer(e instanceof Error ? e.message : 'Errore di rete: riprova tra un attimo.')
      } finally {
        setInvio(false)
      }
    },
    (errori) => {
      setTentativo((t) => t + 1)
      // se l'errore è in un campo del passaggio 2, torniamo lì
      if (CAMPI_CONSEGNA.some((k) => k in errori)) vai(1)
      else if (!CAMPI_CONFERMA.some((k) => k in errori)) vai(1)
    },
  )

  const varianti = {
    entra: (v: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: v * 80, rotate: v * 1.5 }),
    centro: { opacity: 1, x: 0, rotate: 0 },
    esce: (v: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: v * -80, rotate: v * -1.5 }),
  }

  return (
    <section id="ordina" data-bg="#FFF4E0" aria-labelledby="ordina-titolo" className="relative px-4 pb-28 pt-36 md:px-10 md:pb-36 md:pt-48">
      <div className="mx-auto max-w-7xl">
        <header className="mb-14 grid items-end gap-8 md:mb-20 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-3">
              <span className="inline-block h-px w-10 bg-current" /> Ordina a domicilio
            </p>
            <h2 id="ordina-titolo" className="font-display text-fluid-xl">
              <KineticText as="span" text="Te lo portiamo" className="block" />
              <KineticText as="span" text="a casa." className="block italic text-pomodoro" delay={0.3} />
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-nero/70">Tre passaggi, nessun pagamento online, solo a Viterbo. Il rider arriva caldo quanto il panino.</p>
          </div>
          <Mascot className="w-28 justify-self-end md:w-40" />
        </header>

        <div className="rounded-[2.5rem] bg-white/45 p-5 ring-1 ring-nero/10 backdrop-blur-sm md:p-10 lg:p-14">
          {esito ? (
            <Conferma esito={esito} onNuovo={() => setEsito(null)} />
          ) : (
            <form onSubmit={invia} noValidate>
              {/* Indicatore di avanzamento */}
              <ol className="relative mb-12 grid grid-cols-3" aria-label="Passaggi dell'ordine">
                <div aria-hidden="true" className="absolute left-[16.66%] right-[16.66%] top-5 h-px bg-nero/15">
                  <motion.div className="h-full origin-left bg-nero" animate={{ scaleX: passo / 2 }} transition={{ duration: 0.7, ease: EASE_OUT }} />
                </div>
                {PASSI.map((p, i) => (
                  <li key={p} className="relative flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => i < passo && vai(i)}
                      disabled={i >= passo}
                      aria-current={i === passo ? 'step' : undefined}
                      aria-label={`Passaggio ${i + 1}: ${p}${i < passo ? ' (torna indietro)' : ''}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full disabled:cursor-default"
                    >
                      <motion.span
                        animate={{ scale: i === passo ? 1.1 : 1, backgroundColor: i <= passo ? '#1A1A1A' : '#FFF4E0', color: i <= passo ? '#FFF4E0' : '#1A1A1A' }}
                        className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg ring-1 ring-nero/30"
                      >
                        {i < passo ? '✓' : i + 1}
                      </motion.span>
                    </button>
                    <span className={`text-center text-xs font-semibold uppercase tracking-[0.18em] ${i === passo ? '' : 'text-nero/45'}`}>{p}</span>
                  </li>
                ))}
              </ol>

              <AnimatePresence mode="wait" custom={verso} initial={false}>
                <motion.div key={passo} custom={verso} variants={varianti} initial="entra" animate="centro" exit="esce" transition={{ duration: 0.45, ease: EASE_OUT }}>
                  {passo === 0 && <StepPanino erroreCarrello={erroreCarrello && !items.length} tentativo={tentativo} />}
                  {passo === 1 && <StepConsegna form={form} tentativo={tentativo} />}
                  {passo === 2 && <StepRiepilogo form={form} tentativo={tentativo} erroreServer={erroreServer} />}
                </motion.div>
              </AnimatePresence>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-nero/10 pt-8">
                {passo > 0 ? (
                  <button type="button" onClick={() => vai(passo - 1)} className="group flex h-12 items-center gap-2 rounded-full px-5 font-semibold ring-1 ring-nero/20 transition-colors hover:bg-nero hover:text-crema">
                    <span className="transition-transform group-hover:-translate-x-1">←</span> Indietro
                  </button>
                ) : (
                  <span />
                )}
                <Magnetic>
                  {passo < 2 ? (
                    <button type="button" onClick={avanti} className="group relative flex h-14 items-center gap-3 overflow-hidden rounded-full bg-nero pl-7 pr-2 font-semibold text-crema">
                      <span className="absolute inset-0 translate-y-full rounded-full bg-pomodoro transition-transform duration-500 ease-out group-hover:translate-y-0" />
                      <span className="relative">{passo === 0 ? 'Avanti: la consegna' : 'Avanti: riepilogo'}</span>
                      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-crema text-nero transition-transform group-hover:translate-x-0.5">→</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={invio}
                      className="group relative flex h-14 items-center gap-3 overflow-hidden rounded-full bg-pomodoro pl-7 pr-2 font-semibold text-crema disabled:opacity-70"
                    >
                      <span className="absolute inset-0 translate-y-full rounded-full bg-nero transition-transform duration-500 ease-out group-hover:translate-y-0" />
                      <span className="relative">{invio ? 'Invio in corso…' : 'Invia ordine'}</span>
                      <motion.span
                        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-crema text-nero"
                        animate={invio && !reduce ? { rotate: 360 } : { rotate: 0 }}
                        transition={invio ? { duration: 0.8, repeat: Infinity, ease: 'linear' } : undefined}
                      >
                        {invio ? '◌' : '✓'}
                      </motion.span>
                    </button>
                  )}
                </Magnetic>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
