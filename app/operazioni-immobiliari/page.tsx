import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import ImmagineParallasse from '@/components/ui/ImmagineParallasse'
import Rivela from '@/components/ui/Rivela'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import { CANTIERI } from '@/lib/contenuti'

export const metadata: Metadata = {
  title: 'Operazioni immobiliari',
  description: 'Le nostre ristrutturazioni a Roma (Rione Monti) e Milano (Brera, San Babila): appartamenti trasformati e valorizzati.',
}

export default function OperazioniImmobiliari() {
  return (
    <>
      <IntestazionePagina
        etichetta="Operazioni immobiliari"
        titolo="Cantieri tra *Roma* e *Milano.*"
        sottotitolo="Appartamenti che abbiamo acquisito e trasformato: dal Rione Monti, a pochi passi dal Colosseo, a Brera e San Babila."
      />
      <section className="bg-avorio">
        <ol className="contenitore space-y-24 pb-28 md:space-y-40">
          {CANTIERI.map((c, i) => (
            <li key={c.titolo} className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className={`lg:col-span-7 ${i % 2 ? 'lg:order-2' : ''}`}>
                <ImmagineParallasse src={c.foto} alt={c.titolo} className="aspect-[4/3] rounded-sm" sizes="(min-width:1024px) 58vw, 100vw" />
              </div>
              <Rivela className={`lg:col-span-5 ${i % 2 ? 'lg:order-1 lg:pr-10' : 'lg:pl-10'}`}>
                <div className="flex items-center gap-3">
                  <span className="etichetta rounded-full border border-linea px-3 py-1.5">{c.citta}</span>
                  <span className="etichetta text-terracotta">{c.stato}</span>
                </div>
                <p className="mt-8 font-display text-lg text-pietra italic">{c.sottotitolo}</p>
                <h2 className="mt-2 titolo-lg">{c.titolo}</h2>
                <p className="mt-6 text-lg leading-relaxed text-pietra">{c.testo}</p>
                {'video' in c && (
                  <a
                    href={c.video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-8 inline-flex items-center gap-4 text-sm font-semibold"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-inchiostro text-avorio transition-colors duration-500 group-hover:bg-terracotta">
                      <svg viewBox="0 0 24 24" className="ml-0.5 size-4" aria-hidden="true">
                        <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
                      </svg>
                    </span>
                    Guarda il video su YouTube (1ª parte)
                  </a>
                )}
              </Rivela>
            </li>
          ))}
        </ol>
      </section>
      <InvitoFinale />
    </>
  )
}
