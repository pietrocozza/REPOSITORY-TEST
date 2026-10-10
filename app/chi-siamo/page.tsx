import type { Metadata } from 'next'
import Image from 'next/image'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Recensioni from '@/components/sezioni/Recensioni'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Rivela from '@/components/ui/Rivela'
import Icona from '@/components/ui/Icona'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Chi siamo',
  description: 'Soluzione Affitto è un’azienda specializzata nella gestione di affitti a breve termine, principalmente a Roma e Milano.',
}

const TEAM = [
  {
    nome: 'Francesco Ignoti',
    ruolo: 'Responsabile proprietari',
    compiti: ['Rapporti con i proprietari', 'Logistica pulizie', 'Manutenzione'],
    contatto: { label: SITO.telefono.numero, href: SITO.telefono.href },
    colore: 'bg-cielo',
  },
  {
    nome: 'Pietro Cozza',
    ruolo: 'Amministrazione',
    compiti: ['Pagamenti puntuali', 'Adempimenti normativi', 'Ospiti 24/24'],
    contatto: { label: `WhatsApp ${SITO.whatsapp.numero}`, href: SITO.whatsapp.href },
    colore: 'bg-pesca',
  },
]

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
        foto="/img/hero/leonina-camera.jpg"
        altFoto="Camera della Suite Leonina, Rione Monti"
      />

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
        <div className="contenitore grid gap-10 py-20 md:py-28 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Rivela className="relative aspect-square overflow-hidden rounded-[2rem] md:rounded-[3rem]">
            <Image src="/img/team/team.jpg" alt="Il team di Soluzione Affitto" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </Rivela>
          <div>
            <h2 id="titolo-team" className="titolo-xl">
              Il <span className="italic text-corallo">team.</span>
            </h2>
            <ul className="mt-10 space-y-4">
              {TEAM.map((t, i) => (
                <Rivela as="li" key={t.nome} ritardo={i * 0.12} className={`rounded-[2rem] p-6 md:p-8 ${t.colore}`}>
                  <p className="text-sm font-bold text-corallo">{t.ruolo}</p>
                  <h3 className="mt-1 font-display text-3xl font-bold tracking-tight">{t.nome}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {t.compiti.map((c) => (
                      <li key={c} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium">{c}</li>
                    ))}
                  </ul>
                  <a href={t.contatto.href} className="mt-5 inline-block text-sm font-bold underline-offset-4 hover:text-corallo hover:underline">
                    {t.contatto.label}
                  </a>
                </Rivela>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Recensioni iniziale="airbnb" />
      <InvitoFinale />
    </>
  )
}
