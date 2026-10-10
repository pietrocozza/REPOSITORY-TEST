import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Simulatore from '@/components/sezioni/Simulatore'
import GrigliaZone from '@/components/sezioni/GrigliaZone'
import Servizi from '@/components/sezioni/Servizi'
import Piani from '@/components/sezioni/Piani'
import Recensioni from '@/components/sezioni/Recensioni'
import Partner from '@/components/sezioni/Partner'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Domande from '@/components/ui/Domande'
import Etichetta from '@/components/ui/Etichetta'
import { FAQ_GESTIONE } from '@/lib/contenuti'
import { ZONE_ROMA } from '@/lib/zone'
import { SITO } from '@/lib/site'

const URL = '/gestione-affitti-brevi-roma'

export const metadata: Metadata = {
  title: { absolute: 'Gestione affitti brevi Roma | Soluzione Affitto' },
  description:
    'Gestione affitti brevi a Roma: annuncio, prezzi, ospiti, check-in, pulizie e burocrazia. Scopri quanto rende la tua casa zona per zona con il nostro simulatore.',
  alternates: { canonical: URL },
}

const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Gestione affitti brevi a Roma',
    serviceType: 'Gestione affitti brevi',
    areaServed: { '@type': 'City', name: 'Roma' },
    provider: {
      '@type': 'RealEstateAgent',
      name: SITO.nome,
      url: SITO.url,
      telephone: SITO.telefono.numero.replaceAll(' ', ''),
      address: { '@type': 'PostalAddress', streetAddress: 'Via Leonina 21', postalCode: '00184', addressLocality: 'Roma', addressRegion: 'RM', addressCountry: 'IT' },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITO.url },
      { '@type': 'ListItem', position: 2, name: 'Gestione affitti brevi Roma', item: `${SITO.url}${URL}` },
    ],
  },
]

export default function GestioneRoma() {
  const centro = ZONE_ROMA.filter((z) => z.gruppo === 'Centro storico')
  const altre = ZONE_ROMA.filter((z) => z.gruppo !== 'Centro storico')
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <IntestazionePagina
        etichetta="Property manager a Roma"
        titolo="Gestione affitti brevi a *Roma*"
        sottotitolo="Affidaci la tua casa: annuncio, prezzi, ospiti, check-in, pulizie, manutenzione e burocrazia. Tu ricevi solo i profitti."
        foto="/img/roma/san-pietro-tevere.jpg"
        altFoto="Il Tevere, Ponte Sant’Angelo e la cupola di San Pietro"
      />

      <section aria-labelledby="titolo-quanto" className="bg-pesca">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Simulatore di guadagno</Etichetta>
          <h2 id="titolo-quanto" className="titolo-xl mb-12 max-w-[18ch]">
            Quanto rende un affitto breve a <span className="italic text-corallo">Roma?</span>
          </h2>
          <Simulatore vetrina cittaIniziale="roma" />
        </div>
      </section>

      <section aria-labelledby="titolo-zone" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Zona per zona</Etichetta>
          <h2 id="titolo-zone" className="titolo-xl mb-4 max-w-[20ch]">
            Gestiamo case in tutto il <span className="italic text-corallo">centro di Roma</span>
          </h2>
          <p className="mb-12 max-w-xl text-lg text-pietra">Scegli la tua zona per vedere i numeri reali degli affitti brevi e come lavoriamo.</p>
          <h3 className="mb-5 font-display text-2xl font-bold tracking-tight">Centro storico</h3>
          <GrigliaZone zone={centro} base={URL} />
          <h3 className="mt-14 mb-5 font-display text-2xl font-bold tracking-tight">Altri quartieri</h3>
          <GrigliaZone zone={altre} base={URL} />
        </div>
      </section>

      <Servizi />

      <section aria-labelledby="titolo-piani" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Commissioni</Etichetta>
          <h2 id="titolo-piani" className="titolo-xl mb-12">
            Due formule, <span className="italic text-corallo">scegli tu.</span>
          </h2>
          <Piani conExtra={false} />
        </div>
      </section>

      <Recensioni />
      <Partner />

      <section aria-labelledby="titolo-faq" className="bg-crema">
        <div className="contenitore grid gap-12 py-20 md:py-28 lg:grid-cols-[1fr_2.4fr]">
          <h2 id="titolo-faq" className="titolo-xl">
            Domande <span className="italic text-corallo">frequenti</span>
          </h2>
          <Domande domande={FAQ_GESTIONE.slice(0, 6)} chiuse />
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
