import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Blocchi from '@/components/blog/Blocchi'
import InvitoArticolo from '@/components/blog/InvitoArticolo'
import { Scheda } from '@/components/blog/ElencoArticoli'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { ARTICOLI, articoloDa, formattaData } from '@/lib/articoli'
import { SITO } from '@/lib/site'

export function generateStaticParams() {
  return ARTICOLI.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const a = articoloDa(slug)
  if (!a) return {}
  const titolo = a.seo?.titolo ?? a.titolo
  const descrizione = a.seo?.descrizione ?? a.estratto
  return {
    title: titolo,
    description: descrizione,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: {
      title: titolo,
      description: descrizione,
      type: 'article',
      url: `/blog/${a.slug}`,
      locale: 'it_IT',
      siteName: SITO.nome,
      publishedTime: a.data,
      section: a.categoria,
      authors: [SITO.nome],
      images: [{ url: a.copertina, alt: a.titolo }],
    },
    twitter: { card: 'summary_large_image', title: titolo, description: descrizione, images: [a.copertina] },
  }
}

export default async function PaginaArticolo({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const a = articoloDa(slug)
  if (!a) notFound()

  const altri = ARTICOLI.filter((x) => x.slug !== a.slug)
    .sort((x, y) => Number(y.categoria === a.categoria) - Number(x.categoria === a.categoria) || y.data.localeCompare(x.data))
    .slice(0, 3)

  const url = `${SITO.url}/blog/${a.slug}`
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      headline: a.titolo,
      description: a.seo?.descrizione ?? a.estratto,
      image: `${SITO.url}${a.copertina}`,
      datePublished: a.data,
      dateModified: a.data,
      inLanguage: 'it-IT',
      articleSection: a.categoria,
      author: [
        { '@type': 'Person', name: 'Pietro Cozza', url: `${SITO.url}/chi-siamo` },
        { '@type': 'Person', name: 'Francesco Ignoti', url: `${SITO.url}/chi-siamo` },
      ],
      publisher: { '@type': 'Organization', name: SITO.nome, url: SITO.url, logo: { '@type': 'ImageObject', url: `${SITO.url}/icon.png` } },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITO.url },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITO.url}/blog` },
        { '@type': 'ListItem', position: 3, name: a.titolo, item: url },
      ],
    },
  ]

  // Riquadro contatti a metà lettura: prima del secondo sottotitolo, o a metà degli articoli brevi
  const titoli = a.blocchi.flatMap((b, i) => (b.t === 'h2' ? [i] : []))
  const meta = titoli[1] ?? (a.blocchi.length >= 4 ? Math.ceil(a.blocchi.length / 2) : undefined)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="bg-crema">
        <header className="contenitore pt-32 md:pt-40">
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Percorso" className="text-sm font-semibold text-pietra">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-corallo">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  <Link href="/blog" className="hover:text-corallo">
                    Blog
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="text-inchiostro/60">{a.categoria}</li>
              </ol>
            </nav>
            <p className="mt-8 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-sole px-3 py-1 font-bold">{a.categoria}</span>
              <time dateTime={a.data} className="text-pietra">
                {formattaData(a.data)}
              </time>
              <span className="text-pietra">· {a.minuti} min di lettura</span>
            </p>
            <TestoDiviso as="h1" subito ritardo={0.5} testo={a.titolo} className="titolo-xl mt-5" />
            <p className="mt-6 text-xl text-pietra">{a.estratto}</p>
          </div>
          <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-[2rem] md:rounded-[3rem]">
            <Image src={a.copertina} alt={a.titolo} fill preload sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </header>
        <div className="contenitore pt-6 pb-20">
          <div className="mx-auto max-w-3xl">
            <Blocchi blocchi={a.blocchi} inserto={meta !== undefined ? { prima: meta, nodo: <InvitoArticolo articolo={a} variante="meta" /> } : undefined} />
            <InvitoArticolo articolo={a} variante="fine" />
          </div>
        </div>
      </article>

      <section aria-labelledby="titolo-altri" className="bg-sabbia">
        <div className="contenitore py-20">
          <TestoDiviso as="h2" testo="Leggi *anche*" className="titolo-lg mb-10" />
          <span id="titolo-altri" className="sr-only">
            Altri articoli
          </span>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {altri.map((x) => (
              <li key={x.slug}>
                <Scheda a={x} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <InvitoFinale />
    </>
  )
}
