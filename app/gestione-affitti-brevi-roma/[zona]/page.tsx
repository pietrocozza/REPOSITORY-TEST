import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Simulatore from '@/components/sezioni/Simulatore'
import GrigliaZone from '@/components/sezioni/GrigliaZone'
import Piani from '@/components/sezioni/Piani'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Etichetta from '@/components/ui/Etichetta'
import { CAMERE_NOMI, ZONE_ROMA, migliaia, zonaRoma } from '@/lib/zone'
import { SITO } from '@/lib/site'

const BASE = '/gestione-affitti-brevi-roma'

export const dynamicParams = false

export function generateStaticParams() {
  return ZONE_ROMA.map((z) => ({ zona: z.slug }))
}

export async function generateMetadata({ params }: PageProps<'/gestione-affitti-brevi-roma/[zona]'>): Promise<Metadata> {
  const z = zonaRoma((await params).zona)
  if (!z) return {}
  const due = z.camere['2']
  return {
    title: { absolute: `Gestione affitti brevi ${z.nome}, Roma | Soluzione Affitto` },
    description: `Affitti brevi a ${z.nome}: un 2 camere incassa ${migliaia(due.min)}–${migliaia(due.max)} € l’anno. Gestiamo tutto noi: ospiti, pulizie, prezzi e burocrazia.`,
    alternates: { canonical: `${BASE}/${z.slug}` },
  }
}

export default async function ZonaRoma({ params }: PageProps<'/gestione-affitti-brevi-roma/[zona]'>) {
  const z = zonaRoma((await params).zona)
  if (!z) notFound()
  const vicine = ZONE_ROMA.filter((x) => x.gruppo === z.gruppo && x.slug !== z.slug).slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITO.url },
      { '@type': 'ListItem', position: 2, name: 'Gestione affitti brevi Roma', item: `${SITO.url}${BASE}` },
      { '@type': 'ListItem', position: 3, name: z.nome, item: `${SITO.url}${BASE}/${z.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <IntestazionePagina etichetta={`Gestione affitti brevi · Roma`} titolo={`Affitti brevi a *${z.nome}*`} sottotitolo={z.descrizione} />

      <section aria-labelledby="titolo-numeri" className="bg-crema">
        <div className="contenitore pb-20">
          <nav aria-label="Percorso" className="mb-8 text-sm text-pietra">
            <Link href="/" className="hover:text-corallo">Home</Link> /{' '}
            <Link href={BASE} className="hover:text-corallo">Gestione affitti brevi Roma</Link> / <span className="text-inchiostro">{z.nome}</span>
          </nav>
          <h2 id="titolo-numeri" className="mb-6 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Quanto incassa una casa a {z.nome}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(CAMERE_NOMI) as (keyof typeof CAMERE_NOMI)[]).map((k) => {
              const d = z.camere[k]
              return (
                <li key={k} className="rounded-3xl bg-white p-5 shadow-[0_20px_40px_-30px_rgba(29,34,54,0.4)]">
                  <p className="text-sm font-bold">{CAMERE_NOMI[k]}</p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-tight text-corallo">
                    {migliaia(d.min)} – {migliaia(d.max)} €
                  </p>
                  <p className="mt-1 text-sm text-pietra">
                    l’anno · {d.tariffa} € a notte · {Math.round((d.notti / 365) * 100)}% di occupazione
                  </p>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-xs text-pietra">Stime prudenti sulle case intere attive tutto l’anno in zona ({migliaia(z.n)} annunci analizzati), al netto delle commissioni dei portali, prima delle tasse.</p>
        </div>
      </section>

      <section aria-labelledby="titolo-simulatore" className="bg-pesca">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Simulatore di guadagno</Etichetta>
          <h2 id="titolo-simulatore" className="titolo-xl mb-12 max-w-[18ch]">
            Calcola quanto ti <span className="italic text-corallo">resta in tasca</span>
          </h2>
          <Simulatore vetrina cittaIniziale="roma" zonaIniziale={z.nome} />
        </div>
      </section>

      <section aria-labelledby="titolo-piani" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <h2 id="titolo-piani" className="titolo-xl mb-12">
            Gestiamo tutto noi, <span className="italic text-corallo">anche a {z.nome}</span>
          </h2>
          <Piani conExtra={false} />
        </div>
      </section>

      {vicine.length > 0 && (
        <section aria-labelledby="titolo-vicine" className="bg-sabbia">
          <div className="contenitore py-20">
            <h2 id="titolo-vicine" className="mb-8 font-display text-3xl font-bold tracking-tight">Altre zone di Roma</h2>
            <GrigliaZone zone={vicine} base={BASE} />
            <p className="mt-8">
              <Link href={BASE} className="font-semibold underline underline-offset-4 hover:text-corallo">
                Tutte le zone di Roma →
              </Link>
            </p>
          </div>
        </section>
      )}

      <InvitoFinale />
    </>
  )
}
