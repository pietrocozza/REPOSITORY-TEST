import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Domande from '@/components/ui/Domande'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Pulsante from '@/components/ui/Pulsante'
import { FAQ_GESTIONE } from '@/lib/contenuti'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Domande e risposte',
  description: 'Commissioni, pagamenti, danni, tariffe, portali e utenze: tutte le risposte sulla gestione del tuo appartamento in affitto breve.',
}

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GESTIONE.map((f) => ({
    '@type': 'Question',
    name: f.domanda,
    acceptedAnswer: { '@type': 'Answer', text: [f.risposta, ...(f.punti ?? [])].join(' ') },
  })),
}

export default function DomandeRisposte() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <IntestazionePagina etichetta="Domande e risposte" titolo="Ancora dei *dubbi?*" sottotitolo="Le risposte alle domande che ci fanno più spesso i proprietari." />
      <section className="bg-crema">
        <div className="contenitore grid gap-12 pb-28 lg:grid-cols-[1fr_2.4fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-pietra">Non trovi la risposta che cerchi?</p>
            <div className="mt-6">
              <Pulsante href={SITO.whatsapp.href} esterno>Scrivici su WhatsApp</Pulsante>
            </div>
          </aside>
          <Domande domande={FAQ_GESTIONE} />
        </div>
      </section>
      <InvitoFinale />
    </>
  )
}
