import type { Metadata } from 'next'
import Image from 'next/image'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Recensioni from '@/components/sezioni/Recensioni'
import Partner from '@/components/sezioni/Partner'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import TestoAScorrimento from '@/components/ui/TestoAScorrimento'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Chi siamo',
  description: 'Soluzione Affitto è un’azienda specializzata nella gestione di affitti a breve termine, principalmente a Roma e Milano.',
}

const TEAM = [
  {
    nome: 'Francesco Ignoti',
    ruolo: 'Responsabile proprietari',
    testo: 'Gestisce i rapporti con i proprietari e garantisce la massima affidabilità. Si occupa della logistica di pulizie e manutenzione degli immobili.',
    contatto: { label: SITO.telefono.numero, href: SITO.telefono.href },
  },
  {
    nome: 'Pietro Cozza',
    ruolo: 'Amministrazione',
    testo: 'Coordina i pagamenti puntuali e gli adempimenti normativi giornalieri dell’attività. Si occupa della comunicazione con gli ospiti 24/24.',
    contatto: { label: `WhatsApp ${SITO.whatsapp.numero}`, href: SITO.whatsapp.href },
  },
]

export default function ChiSiamo() {
  return (
    <>
      <IntestazionePagina
        etichetta="Chi siamo"
        titolo="Ogni casa ha la sua *identità.*"
        sottotitolo="Soluzione Affitto è un’azienda specializzata nella gestione di affitti a breve termine, principalmente nelle città di Roma e Milano."
        foto="/img/roma/pantheon.jpg"
        altFoto="Il Pantheon e Piazza della Rotonda a Roma"
      />

      <section className="bg-avorio">
        <div className="contenitore py-24 md:py-36">
          <Etichetta numero="01" className="mb-10 text-pietra">La nostra storia</Etichetta>
          <TestoAScorrimento
            className="titolo-lg max-w-5xl"
            testo="La nostra esperienza l’abbiamo maturata sul campo, direttamente con le nostre strutture. Abbiamo perseguito obiettivi ambiziosi, imparato dai nostri errori (perché no?) e compreso l’importanza di saper ascoltare."
          />
          <Rivela className="mt-14 ml-auto max-w-xl text-lg leading-relaxed text-pietra">
            <p>
              Ogni casa ha una sua identità specifica, esattamente come ogni proprietario ha delle esigenze altrettanto peculiari. Per questo motivo, ogni volta che
              firmiamo un contratto cerchiamo di venire incontro a ogni richiesta e di rendere l’esperienza della nostra collaborazione su misura per voi.
            </p>
          </Rivela>
        </div>
      </section>

      <section aria-labelledby="titolo-team" className="bg-carta">
        <div className="contenitore grid gap-14 py-24 md:py-32 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Rivela className="relative aspect-square overflow-hidden rounded-sm">
            <Image src="/img/team/team.jpg" alt="Il team di Soluzione Affitto" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </Rivela>
          <div>
            <Etichetta numero="02" className="mb-8 text-pietra">Il nostro team</Etichetta>
            <h2 id="titolo-team" className="titolo-lg">
              Le persone <span className="italic text-terracotta">dietro le chiavi.</span>
            </h2>
            <ul className="mt-12 space-y-10">
              {TEAM.map((t, i) => (
                <Rivela as="li" key={t.nome} ritardo={i * 0.1} className="border-t border-linea pt-8">
                  <p className="etichetta text-terracotta">{t.ruolo}</p>
                  <h3 className="mt-3 font-display text-4xl">{t.nome}</h3>
                  <p className="mt-4 text-pietra">{t.testo}</p>
                  <a href={t.contatto.href} className="mt-4 inline-block text-sm font-semibold underline-offset-4 hover:text-terracotta hover:underline">
                    {t.contatto.label}
                  </a>
                </Rivela>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Recensioni iniziale="airbnb" />
      <Partner />
      <InvitoFinale />
    </>
  )
}
