'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SITO, linkWhatsApp } from '@/lib/site'
import { EASE_LUSSO } from '@/lib/animazioni'

// Stesse domande del simulatore del sito attuale, divise in tre passaggi.
// La richiesta parte via WhatsApp o email già compilata: nessun dato passa da server di terzi.

type Dati = {
  citta: string
  metro: string
  mq: string
  camere: number
  ascensore: string
  piano: number
  arredo: string
  aria: string
  spazi: string[]
  indirizzo: string
  nome: string
  cognome: string
  telefono: string
  email: string
  messaggio: string
}

const VUOTO: Dati = {
  citta: '',
  metro: '',
  mq: '',
  camere: 0,
  ascensore: '',
  piano: 0,
  arredo: '',
  aria: '',
  spazi: [],
  indirizzo: '',
  nome: '',
  cognome: '',
  telefono: '',
  email: '',
  messaggio: '',
}

const PASSI = ['La casa', 'I dettagli', 'I tuoi contatti'] as const

function Scelta({
  domanda,
  opzioni,
  valore,
  onChange,
  multipla = false,
}: {
  domanda: string
  opzioni: string[]
  valore: string | string[]
  onChange: (v: string) => void
  multipla?: boolean
}) {
  const id = useId()
  return (
    <fieldset>
      <legend className="mb-4 font-display text-2xl md:text-3xl">
        {domanda} <span className="text-terracotta" aria-hidden="true">*</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {opzioni.map((o) => {
          const attiva = multipla ? (valore as string[]).includes(o) : valore === o
          return (
            <label
              key={o}
              className={`relative cursor-pointer rounded-full border px-5 py-3 text-sm font-medium capitalize transition-all duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                attiva ? 'border-inchiostro bg-inchiostro text-avorio' : 'border-linea hover:border-inchiostro'
              }`}
            >
              <input type={multipla ? 'checkbox' : 'radio'} name={id} value={o} checked={attiva} onChange={() => onChange(o)} className="sr-only" />
              {o}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function Cursore({ domanda, valore, onChange }: { domanda: string; valore: number; onChange: (v: number) => void }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-4 flex items-baseline justify-between font-display text-2xl md:text-3xl">
        {domanda}
        <span className="font-display text-4xl text-terracotta italic">{valore}</span>
      </label>
      <input id={id} type="range" min={0} max={10} step={1} value={valore} onChange={(e) => onChange(Number(e.target.value))} className="cursore-range w-full" />
      <div className="mt-2 flex justify-between text-xs text-pietra" aria-hidden="true">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  )
}

function Campo({
  etichetta,
  valore,
  onChange,
  tipo = 'text',
  area = false,
  autoComplete,
}: {
  etichetta: string
  valore: string
  onChange: (v: string) => void
  tipo?: string
  area?: boolean
  autoComplete?: string
}) {
  const id = useId()
  const classi =
    'peer w-full border-0 border-b border-linea bg-transparent px-0 pt-6 pb-3 text-lg placeholder-transparent outline-none transition-colors focus:border-inchiostro focus:ring-0'
  return (
    <div className="relative">
      {area ? (
        <textarea id={id} rows={3} required placeholder={etichetta} value={valore} onChange={(e) => onChange(e.target.value)} className={`${classi} resize-none`} />
      ) : (
        <input id={id} type={tipo} required placeholder={etichetta} autoComplete={autoComplete} value={valore} onChange={(e) => onChange(e.target.value)} className={classi} />
      )}
      <label
        htmlFor={id}
        className="pointer-events-none absolute top-0 left-0 text-xs font-semibold tracking-[0.16em] text-pietra uppercase transition-all duration-300 peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:tracking-[0.16em] peer-focus:uppercase"
      >
        {etichetta} <span className="text-terracotta">*</span>
      </label>
    </div>
  )
}

function riepilogo(d: Dati) {
  return [
    'Richiesta dal simulatore di guadagno di soluzioneaffitto.com',
    '',
    `Hai una casa nel centro di: ${d.citta}`,
    `È a meno di 500 m dalla metropolitana? ${d.metro}`,
    `Quanti metri quadrati? ${d.mq}`,
    `Quante camere da letto? ${d.camere}`,
    `C'è l'ascensore? ${d.ascensore}`,
    `A quale piano si trova? ${d.piano}`,
    `Vuoto o già arredato? ${d.arredo}`,
    `C'è l'aria condizionata? ${d.aria}`,
    `Altri spazi: ${d.spazi.join(', ')}`,
    `Indirizzo: ${d.indirizzo}`,
    '',
    `Nome: ${d.nome} ${d.cognome}`,
    `Telefono: ${d.telefono}`,
    `Email: ${d.email}`,
    '',
    `Il mio appartamento: ${d.messaggio}`,
  ].join('\n')
}

export default function Calcolatore() {
  const [passo, setPasso] = useState(0)
  const [direzione, setDirezione] = useState(1)
  const [d, setD] = useState<Dati>(VUOTO)
  const [errore, setErrore] = useState('')

  const imposta = <K extends keyof Dati>(k: K, v: Dati[K]) => {
    setD((x) => ({ ...x, [k]: v }))
    setErrore('')
  }
  const alterna = (v: string) => imposta('spazi', d.spazi.includes(v) ? d.spazi.filter((s) => s !== v) : [...d.spazi, v])

  const completo = [
    d.citta && d.metro && d.mq,
    d.ascensore && d.arredo && d.aria && d.spazi.length > 0,
    d.indirizzo && d.nome && d.cognome && d.telefono && /\S+@\S+\.\S+/.test(d.email) && d.messaggio,
  ]

  const vai = (n: number) => {
    if (n > passo && !completo[passo]) {
      setErrore('Rispondi a tutte le domande con l’asterisco per continuare.')
      return
    }
    setErrore('')
    setDirezione(n > passo ? 1 : -1)
    setPasso(n)
  }

  const testo = riepilogo(d)

  return (
    <div className="rounded-sm border border-linea bg-avorio p-6 md:p-12">
      {/* Avanzamento */}
      <ol className="mb-10 grid grid-cols-3 gap-3" aria-label="Passaggi">
        {PASSI.map((p, i) => (
          <li key={p} aria-current={passo === i ? 'step' : undefined}>
            <div className="h-px w-full bg-linea">
              <motion.div className="h-px bg-terracotta" initial={false} animate={{ width: passo >= i ? '100%' : '0%' }} transition={{ duration: 0.8, ease: EASE_LUSSO }} />
            </div>
            <p className={`mt-3 text-xs font-semibold tracking-[0.16em] uppercase ${passo >= i ? 'text-inchiostro' : 'text-pietra'}`}>
              <span className="font-display text-sm tracking-normal normal-case italic">0{i + 1}</span> {p}
            </p>
          </li>
        ))}
      </ol>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direzione} initial={false}>
          <motion.div
            key={passo}
            custom={direzione}
            initial={{ opacity: 0, x: direzione * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direzione * -60 }}
            transition={{ duration: 0.55, ease: EASE_LUSSO }}
            className="space-y-10"
          >
            {passo === 0 && (
              <>
                <Scelta domanda="Hai una casa nel centro di:" opzioni={['Roma', 'Milano', 'altro']} valore={d.citta} onChange={(v) => imposta('citta', v)} />
                <Scelta domanda="È a meno di 500 m dalla metropolitana?" opzioni={['sì', 'no']} valore={d.metro} onChange={(v) => imposta('metro', v)} />
                <Scelta domanda="Quanti metri quadrati?" opzioni={['50-100 mq', '100-150 mq', '150+ mq']} valore={d.mq} onChange={(v) => imposta('mq', v)} />
                <Cursore domanda="Quante camere da letto?" valore={d.camere} onChange={(v) => imposta('camere', v)} />
              </>
            )}
            {passo === 1 && (
              <>
                <Scelta domanda="C’è l’ascensore?" opzioni={['sì', 'no']} valore={d.ascensore} onChange={(v) => imposta('ascensore', v)} />
                <Cursore domanda="A quale piano si trova?" valore={d.piano} onChange={(v) => imposta('piano', v)} />
                <Scelta domanda="Vuoto o già arredato?" opzioni={['vuoto', 'già arredato', 'da ristrutturare']} valore={d.arredo} onChange={(v) => imposta('arredo', v)} />
                <Scelta domanda="C’è l’aria condizionata?" opzioni={['sì', 'no']} valore={d.aria} onChange={(v) => imposta('aria', v)} />
                <Scelta domanda="Altri spazi?" multipla opzioni={['balcone', 'terrazzo', 'giardino privato', 'posto auto', 'altro']} valore={d.spazi} onChange={alterna} />
              </>
            )}
            {passo === 2 && (
              <div className="grid gap-8 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Campo etichetta="Indirizzo dell’immobile" valore={d.indirizzo} onChange={(v) => imposta('indirizzo', v)} autoComplete="street-address" />
                </div>
                <Campo etichetta="Nome" valore={d.nome} onChange={(v) => imposta('nome', v)} autoComplete="given-name" />
                <Campo etichetta="Cognome" valore={d.cognome} onChange={(v) => imposta('cognome', v)} autoComplete="family-name" />
                <Campo etichetta="Numero di telefono" tipo="tel" valore={d.telefono} onChange={(v) => imposta('telefono', v)} autoComplete="tel" />
                <Campo etichetta="Email" tipo="email" valore={d.email} onChange={(v) => imposta('email', v)} autoComplete="email" />
                <div className="md:col-span-2">
                  <Campo etichetta="Parlaci del tuo appartamento" area valore={d.messaggio} onChange={(v) => imposta('messaggio', v)} />
                </div>
              </div>
            )}
            {passo === 3 && (
              <div>
                <p className="font-display text-4xl leading-tight md:text-5xl">
                  Grazie {d.nome}, ci siamo <span className="italic text-terracotta">quasi.</span>
                </p>
                <p className="mt-4 max-w-xl text-pietra">
                  Invia la richiesta con il canale che preferisci: il messaggio è già scritto con tutte le tue risposte. Ti ricontattiamo con la stima del guadagno per il tuo appartamento.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={linkWhatsApp(testo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-full bg-[#1f7a4d] px-7 py-4 text-sm font-semibold text-white transition-transform duration-500 ease-lusso hover:-translate-y-0.5"
                  >
                    Invia su WhatsApp
                  </a>
                  <a
                    href={`mailto:${SITO.email}?subject=${encodeURIComponent(`Simulatore guadagno — ${d.nome} ${d.cognome}`)}&body=${encodeURIComponent(testo)}`}
                    className="inline-flex items-center gap-3 rounded-full bg-inchiostro px-7 py-4 text-sm font-semibold text-avorio transition-transform duration-500 ease-lusso hover:-translate-y-0.5"
                  >
                    Invia via email
                  </a>
                </div>
                <details className="mt-8 text-sm text-pietra">
                  <summary className="cursor-pointer font-semibold text-inchiostro">Rivedi le tue risposte</summary>
                  <pre className="mt-4 font-sans whitespace-pre-wrap">{testo}</pre>
                </details>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p role="alert" className="mt-6 min-h-6 text-sm text-terracotta">{errore}</p>

      <div className="mt-4 flex items-center justify-between border-t border-linea pt-6">
        {passo > 0 ? (
          <button type="button" onClick={() => vai(passo - 1)} className="text-sm font-semibold underline-offset-4 hover:underline">
            ← Indietro
          </button>
        ) : (
          <span className="text-xs text-pietra">I campi con * sono obbligatori</span>
        )}
        {passo < 3 && (
          <button
            type="button"
            onClick={() => vai(passo + 1)}
            className="group inline-flex items-center gap-3 rounded-full bg-inchiostro px-7 py-4 text-sm font-semibold text-avorio transition-colors duration-500 hover:bg-terracotta"
          >
            {passo === 2 ? 'Prepara la richiesta' : 'Avanti'}
            <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-500 ease-lusso group-hover:translate-x-1" aria-hidden="true">
              <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
