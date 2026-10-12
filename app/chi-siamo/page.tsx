import type { Metadata } from 'next'
import Image from 'next/image'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Recensioni from '@/components/sezioni/Recensioni'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Rivela from '@/components/ui/Rivela'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Icona from '@/components/ui/Icona'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/chi-siamo' },
  title: 'Chi siamo',
  description: 'Soluzione Affitto è un’azienda specializzata nella gestione di affitti a breve termine, principalmente a Roma e Milano.',
}

const TEAM = [
  {
    nome: 'Pietro Cozza',
    compiti: ['Pagamenti puntuali', 'Adempimenti normativi', 'Ospiti 24/24'],
    contatto: { label: `WhatsApp ${SITO.whatsapp.numero}`, href: SITO.whatsapp.href },
    colore: 'bg-pesca',
    foto: '/img/team/pietro.jpg',
    citta: 'Roma',
  },
  {
    nome: 'Francesco Ignoti',
    compiti: ['Rapporti con i proprietari', 'Logistica pulizie', 'Manutenzione'],
    contatto: { label: SITO.telefono.numero, href: SITO.telefono.href },
    colore: 'bg-cielo',
    foto: '/img/team/francesco.jpg',
    citta: 'Milano',
  },
]

const STORIA = [
  'Siamo Pietro e Francesco. Quattro anni fa abbiamo trasformato l’interesse e la passione per l’immobiliare in un mestiere.',
  'Siamo giovani, e si vede: usiamo gli strumenti più nuovi per prezzi, prenotazioni e check-in.',
  'Ma prima della tecnologia vengono le persone. Ci piace conoscere chi ci affida la casa, ascoltare e spiegare tutto con parole semplici. E trattiamo ogni appartamento come se fosse nostro.',
  'Vuoi conoscerci? Passa a trovarci a Roma o a Milano: il caffè lo offriamo noi.',
]
const STORIA_DATI = ['4 anni di attività', 'Roma e Milano', 'Rispondiamo di persona']

const VALORI = [
  { icona: 'casa', testo: 'Esperienza maturata con le nostre strutture' },
  { icona: 'occhio', testo: 'Sappiamo ascoltare' },
  { icona: 'stretta', testo: 'Collaborazione su misura' },
]

export default function ChiSiamo() {
  return (
    <>
      <IntestazionePagina
        etichetta="Chi siamo"
        titolo="Ogni casa ha la sua *identità.*"
        sottotitolo="Gestiamo affitti brevi a Roma e Milano. Ogni proprietario ha esigenze diverse: per questo lavoriamo su misura."
        foto="/img/leonina/camera-ampia.jpg"
        altFoto="Camera della Suite Leonina, Rione Monti"
      />

      {/* La nostra storia: chi siamo davvero, in parole semplici */}
      <section aria-labelledby="titolo-storia" className="bg-crema">
        <div className="contenitore grid gap-10 pt-20 md:pt-28 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          <div>
            <Etichetta className="mb-6 text-corallo">La nostra storia</Etichetta>
            <TestoDiviso as="h2" testo="Due ragazzi e la passione *per l’immobiliare.*" className="titolo-xl" />
            <span id="titolo-storia" className="sr-only">
              La nostra storia
            </span>
            <ul className="mt-8 flex flex-wrap gap-2">
              {STORIA_DATI.map((d) => (
                <li key={d} className="rounded-full bg-pesca px-4 py-2 text-sm font-bold">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <Rivela className="space-y-5 text-lg leading-relaxed text-inchiostro/85">
            {STORIA.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </Rivela>
        </div>
      </section>

      <section className="bg-crema">
        <ul className="contenitore grid gap-3 py-16 sm:grid-cols-3">
          {VALORI.map((v, i) => (
            <Rivela as="li" key={v.testo} ritardo={i * 0.1} className="flex items-center gap-4 rounded-3xl bg-limone p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white">
                <Icona nome={v.icona} className="size-6 text-corallo" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">{v.testo}</span>
            </Rivela>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titolo-team" className="bg-sabbia">
        <div className="contenitore py-20 md:py-28">
          <h2 id="titolo-team" className="titolo-xl">
            Il <span className="italic text-corallo">team.</span>
          </h2>
          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {TEAM.map((t, i) => (
              <Rivela as="li" key={t.nome} ritardo={i * 0.12} className={`flex flex-col items-center rounded-[2rem] p-8 text-center md:p-10 ${t.colore}`}>
                <div className="relative size-40 overflow-hidden rounded-full border-[6px] border-white shadow-[0_20px_40px_-20px_rgba(29,34,54,0.5)] md:size-48">
                  <Image src={t.foto} alt={`Foto di ${t.nome}`} fill sizes="192px" quality={90} className="object-cover" />
                </div>
                <h3 className="mt-5 font-display text-3xl font-bold tracking-tight">{t.nome}</h3>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-inchiostro shadow-sm">
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="currentColor" />
                    <circle cx="12" cy="9.5" r="2.5" fill="white" />
                  </svg>
                  Lavora a {t.citta}
                </p>
                <ul className="mt-5 flex flex-wrap justify-center gap-2">
                  {t.compiti.map((c) => (
                    <li key={c} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium">
                      {c}
                    </li>
                  ))}
                </ul>
                <a href={t.contatto.href} className="mt-6 inline-block text-sm font-bold underline-offset-4 hover:text-corallo hover:underline">
                  {t.contatto.label}
                </a>
              </Rivela>
            ))}
          </ul>
        </div>
      </section>

      <Recensioni iniziale="airbnb" />
      <InvitoFinale />
    </>
  )
}
