import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import ElencoArticoli from '@/components/blog/ElencoArticoli'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import { ARTICOLI } from '@/lib/articoli'

export const metadata: Metadata = {
  alternates: { canonical: '/blog' },
  title: 'Blog',
  description: 'Guide, normativa e numeri sugli affitti brevi a Roma: cedolare secca, CIN, contributo di soggiorno, prezzi dinamici e molto altro.',
}

export default function Blog() {
  const articoli = [...ARTICOLI].sort((a, b) => b.data.localeCompare(a.data))
  return (
    <>
      <IntestazionePagina etichetta="Blog" titolo="Affitti brevi, *spiegati bene.*" sottotitolo="Guide pratiche, novità sulle regole e numeri veri sul turismo a Roma." />
      <section className="bg-crema">
        <div className="contenitore pb-20 md:pb-28">
          <ElencoArticoli articoli={articoli} />
        </div>
      </section>
      <InvitoFinale />
    </>
  )
}
