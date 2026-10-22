'use client'

import { useState } from 'react'
import { SITO, linkWhatsApp } from '@/lib/site'

const TIPI = ['Appartamento', 'Casa indipendente', 'Villa', 'Altro']
const STATI = ['Come nuovo', 'Buono, abitabile', 'Da sistemare in parte', 'Da ristrutturare del tutto']

function Pillole({ titolo, opzioni, valore, onChange }: { titolo: string; opzioni: string[]; valore: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 font-display text-lg font-bold tracking-tight">{titolo}</legend>
      <div className="flex flex-wrap gap-2">
        {opzioni.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={valore === o}
            onClick={() => onChange(o)}
            className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${valore === o ? 'border-inchiostro bg-inchiostro text-crema' : 'border-linea bg-white hover:border-inchiostro'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Modulo breve per proporre una casa da ristrutturare: il messaggio parte già scritto su WhatsApp */
export default function PropostaImmobile() {
  const [tipo, setTipo] = useState('Appartamento')
  const [stato, setStato] = useState('')
  const [affittata, setAffittata] = useState('')
  const [mq, setMq] = useState('')
  const [zona, setZona] = useState('')
  const [nome, setNome] = useState('')
  const pronto = stato !== '' && zona.trim() !== '' && mq.trim() !== ''

  const testo = [
    `Ciao ${SITO.whatsapp.referente.split(' ')[0]}, vorrei proporvi una casa per Ristruttura gratis.`,
    `Tipo: ${tipo}`,
    `Metri quadri: ${mq}`,
    `Zona di Roma: ${zona}`,
    `Stato: ${stato}`,
    affittata && `Già affittata in modo classico: ${affittata}`,
    nome && `Mi chiamo ${nome}`,
  ]
    .filter(Boolean)
    .join('\n')

  const campo = 'w-full rounded-2xl border border-linea bg-white px-4 py-3 text-base outline-none focus:border-inchiostro'

  return (
    <form className="grid gap-7 rounded-[2rem] bg-white p-6 shadow-[0_30px_60px_-40px_rgba(29,34,54,0.5)] md:p-10" onSubmit={(e) => e.preventDefault()}>
      <Pillole titolo="Che tipo di casa è?" opzioni={TIPI} valore={tipo} onChange={setTipo} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Quanti metri quadri?
          <input className={campo} inputMode="numeric" placeholder="es. 70" value={mq} onChange={(e) => setMq(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          In che zona di Roma?
          <input className={campo} placeholder="es. Monti, Prati, Trastevere" value={zona} onChange={(e) => setZona(e.target.value.slice(0, 60))} />
        </label>
      </div>
      <Pillole titolo="In che stato è?" opzioni={STATI} valore={stato} onChange={setStato} />
      <Pillole titolo="L’hai mai affittata in modo classico?" opzioni={['Sì', 'No']} valore={affittata} onChange={setAffittata} />
      <label className="grid gap-2 text-sm font-semibold">
        Come ti chiami? (facoltativo)
        <input className={campo} placeholder="Nome e cognome" value={nome} onChange={(e) => setNome(e.target.value.slice(0, 60))} />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <a
          href={pronto ? linkWhatsApp(testo) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!pronto}
          className={`rounded-full px-7 py-4 font-semibold text-white transition-transform ${pronto ? 'bg-[#1f7a4d] hover:-translate-y-0.5' : 'pointer-events-none bg-pietra/50'}`}
        >
          Invia su WhatsApp
        </a>
        <p className="text-sm text-pietra">{pronto ? 'Il messaggio è già scritto: ti basta premere invio.' : 'Compila metri quadri, zona e stato della casa.'}</p>
      </div>
    </form>
  )
}
