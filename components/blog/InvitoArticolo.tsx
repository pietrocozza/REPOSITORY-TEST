import Link from 'next/link'
import Image from 'next/image'
import type { Articolo } from '@/lib/articoli'
import { linkWhatsApp } from '@/lib/site'

// Il gancio cambia con l’argomento: chi legge di norme vuole togliersi il pensiero, chi legge di numeri vuole sapere quanto rende
const GANCIO: Record<Articolo['categoria'], { titolo: string; testo: string }> = {
  Normativa: {
    titolo: 'Le regole cambiano spesso. Con noi non devi starci dietro.',
    testo: 'CIN, Alloggiati Web, tassa di soggiorno e adempimenti li seguiamo noi, casa per casa.',
  },
  Mercato: { titolo: 'Quanto può rendere la tua casa?', testo: 'Fai una stima in un minuto con i dati reali della tua zona, già al netto delle tasse.' },
  Gestione: { titolo: 'Preferisci che se ne occupi qualcun altro?', testo: 'Ospiti, pulizie, prezzi e manutenzione: pensiamo a tutto noi, tu ricevi i profitti.' },
  Guide: { titolo: 'Hai una casa a Roma o a Milano?', testo: 'Ti diciamo con sincerità se conviene l’affitto breve e quanto può rendere.' },
}

const IconaWhatsApp = () => (
  <svg viewBox="0 0 32 32" className="size-5 shrink-0" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.1c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3Zm0 23.2c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.2 1.3-4-.3-.4a10.4 10.4 0 0 1-1.6-5.6C5.5 9.9 10.2 5.3 16 5.3s10.5 4.6 10.5 10.3S21.8 26.2 16 26.2Zm5.8-7.7c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.6 8.6 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.1-1.2 2.7 1.2 3.1 1.4 3.4c.2.2 2.4 3.6 5.8 5 2.1.9 3 1 4 .8.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z"
    />
  </svg>
)

/** Riquadro contatti dentro gli articoli: a metà lettura (compatto) e in fondo (con le nostre facce) */
export default function InvitoArticolo({ articolo, variante }: { articolo: Articolo; variante: 'meta' | 'fine' }) {
  const g = GANCIO[articolo.categoria]
  const whatsapp = linkWhatsApp(`Ciao, ho letto l’articolo “${articolo.titolo}” sul vostro sito e vorrei informazioni per la mia casa.`)

  if (variante === 'meta') {
    return (
      <aside aria-label="Contattaci" className="my-10 rounded-3xl bg-pesca p-6 md:p-7">
        <p className="font-display text-xl leading-tight font-bold tracking-tight text-inchiostro">{g.titolo}</p>
        <p className="mt-2 text-base text-inchiostro/75">{g.testo}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-base">
          <Link href="/calcola-guadagno" className="luce relative overflow-hidden rounded-full bg-corallo px-5 py-3 font-semibold text-white">
            Calcola quanto rende
          </Link>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-inchiostro">
            <IconaWhatsApp />
            Scrivici
          </a>
        </div>
      </aside>
    )
  }

  return (
    <aside aria-label="Parla con noi" className="mt-14 rounded-[2rem] bg-notte p-7 text-crema md:p-10">
      <div className="flex items-center gap-3">
        <span className="flex -space-x-3">
          {['/img/team/pietro.jpg', '/img/team/francesco.jpg'].map((f) => (
            <span key={f} className="relative size-12 overflow-hidden rounded-full border-2 border-notte">
              <Image src={f} alt="" fill sizes="48px" className="object-cover" />
            </span>
          ))}
        </span>
        <p className="text-sm text-nebbia">Pietro e Francesco, Soluzione Affitto</p>
      </div>
      <p className="mt-6 font-display text-2xl leading-tight font-bold tracking-tight md:text-3xl">{g.titolo}</p>
      <p className="mt-3 text-base text-nebbia md:text-lg">{g.testo} Rispondiamo noi, di persona.</p>
      <div className="mt-7 flex flex-wrap gap-3 text-base">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="luce relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#1f7a4d] px-6 py-3.5 font-semibold text-white"
        >
          <IconaWhatsApp />
          Scrivici su WhatsApp
        </a>
        <Link href="/calcola-guadagno" className="rounded-full border-2 border-crema/40 px-6 py-3 font-semibold text-crema hover:border-crema">
          Calcola quanto rende la tua casa
        </Link>
      </div>
    </aside>
  )
}
