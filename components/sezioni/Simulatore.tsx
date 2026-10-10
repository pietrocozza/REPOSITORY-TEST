'use client'

import { useEffect, useId, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import DATI from '@/lib/simulatore-dati.json'
import { PIANI } from '@/lib/contenuti'
import { EASE_LUSSO } from '@/lib/animazioni'
import { useRiduciMovimento } from '@/lib/hooks'

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
// Media mensile di quanto resta al proprietario dopo la nostra commissione
const alMese = (anno: number, percentuale: number) => arrotonda((anno * (1 - percentuale / 100)) / 12, 50)

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
export default function Simulatore({ vetrina = false }: { vetrina?: boolean }) {
  const idCanone = useId()
  const [citta, setCitta] = useState<Citta>('roma')
  const [zona, setZona] = useState(ZONA_INIZIALE.roma)
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
  const affittoMese = Number(canone.replace(/\D/g, ''))
  const completa = PIANI[1].percentuale
    const nettoMese = alMese(s.max, completa)
  const volte = affittoMese > 0 ? nettoMese / affittoMese : 0

  const cambiaCitta = (k: Citta) => {
    setCitta(k)
    setZona(ZONA_INIZIALE[k])
    setAltre(false)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      {/* Domande */}
      <div className="space-y-10">
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

        {!vetrina && (
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
        )}
      </div>

      {/* Risultato */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_60px_-40px_rgba(29,34,54,0.5)]" aria-live="polite">
          <div className="bg-sole p-6 md:p-8">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold">
              <span className="size-2 rounded-full bg-[#1f7a4d]" aria-hidden="true" />
              Dati reali di {punti(c.annunci)} annunci Airbnb · {MESI_ESTESI[Number(DATI.rilevazione.slice(5)) - 1]} {DATI.rilevazione.slice(0, 4)}
            </p>
            <p className="text-sm font-bold">
              {CAMERE.find((k) => k.id === camere)?.nome} · {z.nome}, {c.nome}
            </p>
            <p className="mt-3 text-sm font-semibold text-inchiostro/70">Incasso lordo stimato in un anno</p>
            <p className="mt-1 font-display text-[clamp(2.4rem,6vw,4rem)] leading-none font-bold tracking-tighter">
              <Numero valore={s.min} />
              <span className="mx-2 text-inchiostro/40">–</span>
              <Numero valore={s.max} /> €
            </p>
          </div>

          <div className="p-6 md:p-8">
            <dl className="grid grid-cols-3 gap-3">
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
                <div key={x.e} className="rounded-2xl bg-crema p-3 text-center md:p-4">
                  <dd className="font-display text-2xl font-bold tracking-tight text-corallo md:text-3xl">
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
              <p className="font-display text-lg font-bold tracking-tight">Ti restano in tasca, al mese</p>
              <ul className="mt-3 space-y-2">
                {PIANI.map((p) => (
                  <li key={p.nome} className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                    <span>
                      {p.nome} <span className="text-inchiostro/60">({p.percentuale}%)</span>
                    </span>
                    <strong className="font-display text-xl tracking-tight">
                      {punti(alMese(s.min, p.percentuale))} – {punti(alMese(s.max, p.percentuale))} €
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-inchiostro/65">Media dell’anno, prima delle tasse (che variano per ognuno).</p>
            </div>

            <AnimatePresence initial={false}>
              {!vetrina && volte > 0 && (
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
                        ? `Fino a ${punti(nettoMese)} € al mese con la gestione completa, contro ${punti(affittoMese)} € dell’affitto tradizionale.`
                        : `In questa zona l’affitto tradizionale (${punti(affittoMese)} € al mese) rende già bene: parliamone per una valutazione su misura.`}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {s.stimata && <p className="mt-4 text-xs text-pietra">In questa zona ci sono poche case con questo numero di camere: la stima parte dalla media della zona.</p>}

            <a
              href={vetrina ? '/calcola-guadagno#richiesta' : '#richiesta'}
              className="group mt-6 flex items-center justify-between gap-3 rounded-full bg-corallo px-7 py-4 text-sm font-semibold text-white transition-transform duration-500 ease-lusso hover:-translate-y-0.5"
            >
              Voglio la stima precisa per la mia casa
              <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-500 ease-lusso group-hover:translate-y-0.5" aria-hidden="true">
                <path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        <p className="mt-4 px-2 text-xs leading-relaxed text-pietra">
          Stima, non garanzia di guadagno: incassi lordi prima di tasse e commissioni dei portali. Stima prudente, sulla fascia centrale delle case intere attive in zona
          (almeno 6 recensioni negli ultimi 12 mesi), {punti(c.annunci)} annunci a {c.nome}. Dati{' '}
          <a href="https://insideairbnb.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Inside Airbnb
          </a>{' '}
          (licenza CC BY 4.0), rilevazione di {MESI_ESTESI[Number(DATI.rilevazione.slice(5)) - 1]} {DATI.rilevazione.slice(0, 4)}.
        </p>
      </div>
    </div>
  )
}
