import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Blocchi from '@/components/blog/Blocchi'
import { Scheda } from '@/components/blog/ElencoArticoli'
import BarraLettura from '@/components/blog/BarraLettura'
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
  return {
    title: a.titolo,
    description: a.estratto,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { title: a.titolo, description: a.estratto, type: 'article', publishedTime: a.data, images: [a.copertina] },
  }
}

export default async function PaginaArticolo({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const a = articoloDa(slug)
  if (!a) notFound()

  const altri = ARTICOLI.filter((x) => x.slug !== a.slug)
    .sort((x, y) => Number(y.categoria === a.categoria) - Number(x.categoria === a.categoria) || y.data.localeCompare(x.data))
    .slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.titolo,
    datePublished: a.data,
    description: a.estratto,
    image: `${SITO.url}${a.copertina}`,
    publisher: { '@type': 'Organization', name: SITO.nome },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BarraLettura />
      <article className="bg-crema">
        <header className="contenitore pt-32 md:pt-40">
          <div className="mx-auto max-w-3xl">
            <Link href="/blog" className="text-sm font-semibold text-pietra hover:text-corallo">
              ← Tutti gli articoli
            </Link>
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
            <Image src={a.copertina} alt="" fill preload sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </header>
        <div className="contenitore pt-6 pb-20">
          <div className="mx-auto max-w-3xl">
            <Blocchi blocchi={a.blocchi} />
          </div>
        </div>
      </article>

      <section aria-labelledby="titolo-altri" className="bg-sabbia">
        <div className="contenitore py-20">
          <TestoDiviso as="h2" testo="Leggi *anche*" className="titolo-lg mb-10" />
          <span id="titolo-altri" className="sr-only">Altri articoli</span>
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
