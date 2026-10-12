'use client'

import { useEffect, useId, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import DATI from '@/lib/simulatore-dati.json'
import { PIANI } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'
import { useRiduciMovimento } from '@/lib/hooks'
import { SITO, linkWhatsApp } from '@/lib/site'

// Stime calcolate da scripts/genera-dati-simulatore.py sui dati aperti di Inside Airbnb

type Citta = keyof typeof DATI.citta
type Camere = '0' | '1' | '2' | '3'

const CAMERE: { id: Camere; nome: string }[] = [
  { id: '0', nome: 'Monolocale' },
  { id: '1', nome: '1 camera' },
  { id: '2', nome: '2 camere' },
  { id: '3', nome: '3 o più' },
]
const ZONA_INIZIALE: Record<Citta, string> = { roma: 'Monti', milano: 'Brera' }
const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const MESI_ESTESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

// Formato italiano scritto a mano: identico sul server e nel browser (12.500)
const punti = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const arrotonda = (v: number, passo = 500) => Math.round(v / passo) * passo
// Calcolo prudente, come prevede la norma per il proprietario privato in cedolare secca:
// il 21% si paga su tutto quello che l’ospite versa per il soggiorno, senza scalare nessun costo
const CEDOLARE = 0.21
// Cedolare sul canone concordato (3+2) a Roma e Milano
const CEDOLARE_CONCORDATO = 0.1
// Commissione media dei portali: l’incasso dei dati è già al netto, ma le tasse si pagano sul lordo
const COMMISSIONE_PORTALI = 0.15
// Pulizie pagate dagli ospiti nella prenotazione: le giriamo alla ditta, ma per il fisco sono affitto del proprietario
const PULIZIE: Record<Camere, number> = { '0': 450, '1': 450, '2': 600, '3': 800 }
// Spese medie al mese a carico del proprietario (utenze, internet, consumabili)
const SPESE: Record<Camere, number> = { '0': 100, '1': 100, '2': 100, '3': 100 }
// Quanto resta in tasca al mese: incasso – nostra commissione con IVA (non recuperabile) – tasse – spese
const nettoAlMese = (anno: number, percentuale: number, camere: Camere) => {
  const tasse = CEDOLARE * (anno / (1 - COMMISSIONE_PORTALI) + PULIZIE[camere] * 12)
  return arrotonda((anno * (1 - (percentuale / 100) * 1.22) - tasse) / 12 - SPESE[camere], 50)
}

/** Numero che scorre dal valore precedente al nuovo */
function Numero({ valore }: { valore: number }) {
  const riduci = useRiduciMovimento()
  const mv = useMotionValue(valore)
  const testo = useTransform(mv, (v) => punti(v))
  useEffect(() => {
    if (riduci) {
      mv.set(valore)
      return
    }
    const c = animate(mv, valore, { duration: 0.9, ease: EASE_LUSSO })
    return () => c.stop()
  }, [valore, riduci, mv])
  return (
    <span>
      <span className="sr-only">{punti(valore)}</span>
      <motion.span aria-hidden="true">{testo}</motion.span>
    </span>
  )
}

function Pillola({ attiva, onClick, children }: { attiva: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={attiva}
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corallo ${
        attiva ? 'border-inchiostro bg-inchiostro text-crema' : 'border-linea bg-white hover:border-inchiostro'
      }`}
    >
      {children}
    </button>
  )
}

function Domanda({ numero, titolo, children }: { numero: number; titolo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-4 flex items-baseline gap-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
        <span className="font-display text-base font-normal text-corallo italic">0{numero}</span>
        {titolo}
      </p>
      {children}
    </div>
  )
}

/** Simulatore di guadagno. In vetrina (home) mostra solo le domande essenziali e porta alla pagina completa */
export default function Simulatore({ vetrina = false, cittaIniziale = 'roma', zonaIniziale }: { vetrina?: boolean; cittaIniziale?: Citta; zonaIniziale?: string }) {
  const idCanone = useId()
  const [citta, setCitta] = useState<Citta>(cittaIniziale)
  const [zona, setZona] = useState(zonaIniziale ?? ZONA_INIZIALE[cittaIniziale])
  const [camere, setCamere] = useState<Camere>('1')
  const [altre, setAltre] = useState(false)
  const [canone, setCanone] = useState('')
  const [mese, setMese] = useState<number | null>(null)

  const c = DATI.citta[citta]
  const z = c.zone.find((x) => x.nome === zona) ?? c.zone[0]
  const s = z.camere[camere]
  const medio = (s.min + s.max) / 2
  const mensili = c.stagionalita.map((q) => medio * q)
  const picco = Math.max(...mensili)
  const gruppi = [...new Set(c.zone.map((x) => x.gruppo))]
  // L’affitto tradizionale oggi è quasi sempre a canone concordato 3+2, con cedolare al 10%: confrontiamo netto con netto
  const affittoMese = arrotonda(Number(canone.replace(/\D/g, '')) * (1 - CEDOLARE_CONCORDATO), 50)
  const completa = PIANI[0].percentuale
  const nettoMin = Math.max(0, nettoAlMese(s.min, completa, camere))
  const nettoMax = nettoAlMese(s.max, completa, camere)
  const nettoMese = nettoMax
  const volte = affittoMese > 0 ? nettoMese / affittoMese : 0

  // Il risultato parte già scritto su WhatsApp: chi arriva da Instagram ci manda i dati della casa in un tocco
  const canoneAttuale = Number(canone.replace(/\D/g, ''))
  const messaggio = [
    `Ciao ${SITO.whatsapp.referente.split(' ')[0]}, ho provato il simulatore sul sito.`,
    `Città: ${c.nome}`,
    `Zona: ${z.nome}`,
    `Casa: ${CAMERE.find((x) => x.id === camere)?.nome}`,
    `Stima netta: ${punti(nettoMin)} – ${punti(nettoMax)} € al mese`,
    canoneAttuale > 0 && `Oggi è affittata a ${punti(canoneAttuale)} € al mese`,
    'Vorrei una stima precisa per la mia casa.',
  ]
    .filter(Boolean)
    .join('\n')

  const cambiaCitta = (k: Citta) => {
    setCitta(k)
    setZona(ZONA_INIZIALE[k])
    setAltre(false)
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      {/* Domande */}
      <div className="min-w-0 space-y-10">
        <Domanda numero={1} titolo="Dove si trova la casa?">
          <div className="inline-flex rounded-full bg-sabbia p-1.5" role="group" aria-label="Città">
            {(Object.keys(DATI.citta) as Citta[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={citta === k}
                onClick={() => cambiaCitta(k)}
                className="relative rounded-full px-7 py-3 font-display text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-corallo"
              >
                {citta === k && <motion.span layoutId="citta-attiva" className="absolute inset-0 rounded-full bg-corallo" transition={{ duration: 0.5, ease: EASE_LUSSO }} />}
                <span className={`relative ${citta === k ? 'text-white' : ''}`}>{DATI.citta[k].nome}</span>
              </button>
            ))}
          </div>
        </Domanda>

        <Domanda numero={2} titolo="In che zona?">
          <div className="space-y-5">
            {gruppi.map((g, i) => {
              const zone = c.zone.filter((x) => x.gruppo === g)
              const chiuso = i > 0 && !altre && !zone.some((x) => x.nome === zona)
              return (
                <div key={g}>
                  <p className="mb-2.5 text-xs font-bold tracking-[0.14em] text-pietra uppercase">{g}</p>
                  {chiuso ? (
                    <button
                      type="button"
                      onClick={() => setAltre(true)}
                      className="rounded-full border border-dashed border-pietra px-4 py-2.5 text-sm font-semibold hover:border-inchiostro"
                    >
                      Mostra altri {zone.length} quartieri +
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {zone.map((x) => (
                        <Pillola key={x.nome} attiva={x.nome === zona} onClick={() => setZona(x.nome)}>
                          {x.nome}
                        </Pillola>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Domanda>

        <Domanda numero={3} titolo="Quante camere da letto?">
          <div className="flex flex-wrap gap-2">
            {CAMERE.map((k) => (
              <Pillola key={k.id} attiva={camere === k.id} onClick={() => setCamere(k.id)}>
                {k.nome}
              </Pillola>
            ))}
          </div>
        </Domanda>

        {
          <Domanda numero={4} titolo="Oggi la affitti? (facoltativo)">
            <label htmlFor={idCanone} className="mb-2 block text-sm text-pietra">
              Canone mensile dell’affitto tradizionale
            </label>
            <div className="flex max-w-xs items-center gap-2 rounded-full border border-linea bg-white px-5 py-3 focus-within:border-inchiostro">
              <input
                id={idCanone}
                inputMode="numeric"
                placeholder="es. 1.200"
                value={canone}
                onChange={(e) => setCanone(e.target.value.replace(/[^\d.]/g, '').slice(0, 7))}
                className="w-full border-0 bg-transparent p-0 text-lg outline-none focus:ring-0"
              />
              <span className="text-sm font-semibold text-pietra">€/mese</span>
            </div>
          </Domanda>
        }
      </div>

      {/* Risultato */}
      <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_60px_-40px_rgba(29,34,54,0.5)]" aria-live="polite">
          <div className="bg-sole p-5 sm:p-6 md:p-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold">
              <span className="size-2 rounded-full bg-[#1f7a4d]" aria-hidden="true" />
              Dati reali di {punti(c.annunci)} annunci Airbnb · {MESI_ESTESI[Number(DATI.rilevazione.slice(5)) - 1]} {DATI.rilevazione.slice(0, 4)}
            </p>
            <p className="text-sm font-bold">
              {CAMERE.find((k) => k.id === camere)?.nome} · {z.nome}, {c.nome}
            </p>
            <p className="mt-3 text-sm font-semibold text-inchiostro/70">Incasso stimato in un anno</p>
            <p className="mt-1 font-display text-[clamp(1.9rem,8.5vw,4rem)] leading-none font-bold tracking-tighter whitespace-nowrap">
              <Numero valore={s.min} />
              <span className="mx-[0.15em] text-inchiostro/40">–</span>
              <Numero valore={s.max} /> €
            </p>
          </div>

          <div className="p-5 sm:p-6 md:p-8">
            <dl className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { v: s.tariffa, p: '', u: '€', e: 'tariffa media a notte' },
                {
                  v: s.notti,
                  p: '',
                  u: '',
                  e: `notti prenotate (${Math.round((s.notti / 365) * 100)}%)`,
                },
                { v: z.n, p: '', u: '', e: 'case analizzate in zona' },
              ].map((x) => (
                <div key={x.e} className="min-w-0 rounded-2xl bg-crema px-1.5 py-3 text-center sm:p-3 md:p-4">
                  <dd className="font-display text-xl font-bold tracking-tight text-corallo sm:text-2xl md:text-3xl">
                    <Numero valore={x.v} />
                    {x.u && <span className="text-lg"> {x.u}</span>}
                  </dd>
                  <dt className="mt-1 text-[0.7rem] leading-tight font-medium text-pietra md:text-xs">{x.e}</dt>
                </div>
              ))}
            </dl>

            {/* Mese per mese */}
            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="font-display text-lg font-bold tracking-tight">Mese per mese</p>
                <p className="min-h-5 text-sm text-pietra">
                  {mese !== null ? (
                    <>
                      {MESI_ESTESI[mese]}: <strong className="text-inchiostro">circa {punti(arrotonda(mensili[mese], 100))} €</strong>
                    </>
                  ) : (
                    'tocca un mese'
                  )}
                </p>
              </div>
              <div
                className="flex h-36 items-end gap-1.5"
                role="img"
                aria-label={`Incasso stimato per mese: ${MESI_ESTESI.map((m, i) => `${m} ${punti(arrotonda(mensili[i], 100))} euro`).join(', ')}`}
              >
                {mensili.map((v, i) => (
                  <button
                    key={MESI[i]}
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    onPointerEnter={() => setMese(i)}
                    onPointerLeave={() => setMese(null)}
                    onClick={() => setMese(i)}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <motion.span
                      className={`block w-full rounded-t-[4px] transition-colors ${mese === null || mese === i ? 'bg-corallo' : 'bg-corallo/35'}`}
                      initial={false}
                      animate={{ height: `${(v / picco) * 100}%` }}
                      transition={{
                        duration: 0.7,
                        ease: EASE_LUSSO,
                        delay: i * 0.025,
                      }}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex gap-1.5 text-center text-[0.65rem] font-semibold text-pietra" aria-hidden="true">
                {MESI.map((m) => (
                  <span key={m} className="flex-1">
                    {m.slice(0, 1)}
                    <span className="max-sm:hidden">{m.slice(1)}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Netto al mese */}
            <div className="mt-8 rounded-2xl bg-salvia p-5">
              <p className="font-display text-lg font-bold tracking-tight">Ti restano in tasca, al mese, con la gestione completa</p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                <Numero valore={nettoMin} /> – <Numero valore={nettoMax} /> €
              </p>
              <p className="mt-3 text-xs text-inchiostro/65">
                Quello che ti metti in tasca: media dell’anno, già tolte le tasse, la nostra commissione del {completa}% + IVA (può variare in base all’immobile) e le spese della
                casa. Le pulizie le pagano gli ospiti.
              </p>
              <p className="mt-2 text-xs text-inchiostro/65">
                Tasse calcolate nel modo più prudente: cedolare secca al 21% su tutto quello che l’ospite paga per il soggiorno, pulizie e commissioni dei portali comprese, come
                prevede la norma per chi affitta senza partita IVA. Per chi affitta più case l’aliquota può essere diversa: per la tua situazione senti il tuo commercialista.
              </p>
            </div>

            <AnimatePresence initial={false}>
              {volte > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: EASE_LUSSO }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex items-center gap-4 rounded-2xl bg-cielo p-5">
                    <p className="font-display text-4xl font-bold tracking-tighter text-inchiostro">{volte >= 1 ? `×${volte.toFixed(1).replace('.', ',')}` : '–'}</p>
                    <p className="text-sm">
                      {volte >= 1
                        ? `Fino a ${punti(nettoMese)} € al mese con la gestione completa, contro ${punti(affittoMese)} € netti dell’affitto tradizionale (canone concordato 3+2, cedolare al 10%).`
                        : `In questa zona l’affitto tradizionale (${punti(affittoMese)} € netti al mese) rende già bene: parliamone per una valutazione su misura.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {s.stimata && <p className="mt-4 text-xs text-pietra">In questa zona ci sono poche case con questo numero di camere: la stima parte dalla media della zona.</p>}

            <a
              href={vetrina ? '/calcola-guadagno#richiesta' : '#richiesta'}
              className="group luce relative mt-6 flex items-center justify-between gap-3 overflow-hidden rounded-full bg-corallo px-7 py-4 text-sm font-semibold text-white transition-transform duration-500 ease-lusso hover:-translate-y-0.5"
            >
              Voglio la stima precisa per la mia casa
              <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-500 ease-lusso group-hover:translate-y-0.5" aria-hidden="true">
                <path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href={linkWhatsApp(messaggio)}
              target="_blank"
              rel="noopener noreferrer"
              className="group luce relative mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-full bg-[#1f7a4d] px-7 py-4 text-sm font-semibold text-white transition-transform duration-500 ease-lusso hover:-translate-y-0.5"
              style={{ '--luce-ritardo': '1.2s' } as React.CSSProperties}
            >
              Mandaci questa stima su WhatsApp
              <svg viewBox="0 0 32 32" className="size-6 shrink-0" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.1c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3Zm0 23.2c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.2 1.3-4-.3-.4a10.4 10.4 0 0 1-1.6-5.6C5.5 9.9 10.2 5.3 16 5.3s10.5 4.6 10.5 10.3S21.8 26.2 16 26.2Zm5.8-7.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.6 8.6 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.4 3.4c.2.2 2.4 3.6 5.8 5 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z"
                />
              </svg>
            </a>
            <p className="mt-2 text-center text-xs text-pietra">Il messaggio con i dati della tua casa è già scritto: ti basta premere invio.</p>
          </div>
        </div>

        {/* Le note sui dati restano a portata di mano ma chiuse: si aprono toccando "Disclaimer" */}
        <details className="group mt-4 px-2 text-xs text-pietra">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full py-1 font-semibold underline-offset-4 hover:text-inchiostro hover:underline [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 11v5m0-8.5v.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Disclaimer: come calcoliamo la stima
            <svg viewBox="0 0 24 24" className="size-3.5 transition-transform duration-300 group-open:rotate-180" aria-hidden="true">
              <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="mt-2 leading-relaxed">
            Stima, non garanzia di guadagno: incassi al netto delle commissioni dei portali; il netto in tasca è già tassato con la cedolare al 21%.{' '}
            {citta === 'roma' && 'Nel centro storico l’occupazione parte dall’80%, il minimo delle case che gestiamo. '}Stima prudente, sulla fascia centrale delle case intere
            attive in zona avviate e attive tutto l’anno (almeno 80 recensioni, 12 nell’ultimo anno), {punti(c.annunci)} annunci a {c.nome}. Dati{' '}
            <a href="https://insideairbnb.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              Inside Airbnb
            </a>{' '}
            (licenza CC BY 4.0), rilevazione di {MESI_ESTESI[Number(DATI.rilevazione.slice(5)) - 1]} {DATI.rilevazione.slice(0, 4)}.
          </p>
        </details>
      </div>
    </div>
  )
}
