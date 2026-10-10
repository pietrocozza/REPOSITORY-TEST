import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Simulatore from '@/components/sezioni/Simulatore'
import GrigliaZone from '@/components/sezioni/GrigliaZone'
import Servizi from '@/components/sezioni/Servizi'
import Piani from '@/components/sezioni/Piani'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Etichetta from '@/components/ui/Etichetta'
import DATI from '@/lib/simulatore-dati.json'
import { SITO } from '@/lib/site'

const URL = '/gestione-affitti-brevi-milano'

export const metadata: Metadata = {
  title: { absolute: 'Gestione affitti brevi Milano | Soluzione Affitto' },
  description: 'Gestione affitti brevi a Milano: annuncio, prezzi, ospiti, check-in, pulizie e burocrazia. Scopri quanto rende la tua casa quartiere per quartiere.',
  alternates: { canonical: URL },
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Gestione affitti brevi a Milano',
  serviceType: 'Gestione affitti brevi',
  areaServed: { '@type': 'City', name: 'Milano' },
  provider: {
    '@type': 'RealEstateAgent',
    name: SITO.nome,
    url: SITO.url,
    address: { '@type': 'PostalAddress', streetAddress: 'Via Macedonio Melloni 17', postalCode: '20129', addressLocality: 'Milano', addressRegion: 'MI', addressCountry: 'IT' },
  },
}

export default function GestioneMilano() {
  const zone = DATI.citta.milano.zone.filter((z) => z.gruppo !== 'Altri quartieri')
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <IntestazionePagina
        etichetta="Property manager a Milano"
        titolo="Gestione affitti brevi a *Milano*"
        sottotitolo="Affidaci la tua casa: annuncio, prezzi, ospiti, check-in, pulizie, manutenzione e burocrazia. Tu ricevi solo i profitti."
      />
      <section aria-labelledby="titolo-quanto" className="bg-pesca">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Simulatore di guadagno</Etichetta>
          <h2 id="titolo-quanto" className="titolo-xl mb-12 max-w-[18ch]">
            Quanto rende un affitto breve a <span className="italic text-corallo">Milano?</span>
          </h2>
          <Simulatore vetrina cittaIniziale="milano" />
        </div>
      </section>
      <section aria-labelledby="titolo-zone" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <h2 id="titolo-zone" className="titolo-xl mb-12 max-w-[20ch]">
            I quartieri <span className="italic text-corallo">più richiesti</span>
          </h2>
          <GrigliaZone zone={zone} />
        </div>
      </section>
      <Servizi />
      <section aria-labelledby="titolo-piani" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <h2 id="titolo-piani" className="titolo-xl mb-12">
            Una formula, <span className="italic text-corallo">tutto incluso.</span>
          </h2>
          <Piani conExtra={false} />
        </div>
      </section>
      <InvitoFinale />
    </>
  )
}
