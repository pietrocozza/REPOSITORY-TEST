import type { Metadata } from 'next'
import Image from 'next/image'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Rivela from '@/components/ui/Rivela'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import { CANTIERI, CANTIERI_BREVI } from '@/lib/contenuti'

export const metadata: Metadata = {
  alternates: { canonical: '/operazioni-immobiliari' },
  title: 'Operazioni immobiliari',
  description: 'Le nostre ristrutturazioni a Roma (Rione Monti) e Milano (Brera, San Babila): appartamenti trasformati e valorizzati.',
}

export default function OperazioniImmobiliari() {
  return (
    <>
      <IntestazionePagina etichetta="Operazioni immobiliari" titolo="I nostri *cantieri.*" sottotitolo="Appartamenti acquisiti e trasformati, tra Roma e Milano." />
      <section className="bg-crema">
        <ul className="contenitore grid gap-5 pb-20 md:grid-cols-2 md:pb-28">
          {CANTIERI.map((c, i) => (
            <Rivela as="li" key={c.titolo} ritardo={(i % 2) * 0.12}>
              <article className="group h-full overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_-30px_rgba(29,34,54,0.4)]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={c.foto} alt={c.titolo} fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover transition-transform duration-1000 ease-lusso group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.citta === 'Roma' ? 'bg-sole text-inchiostro' : 'bg-azzurro text-white'}`}>{c.citta}</span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-inchiostro">{c.stato}</span>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-sm font-semibold text-corallo">{c.sottotitolo}</p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">{c.titolo}</h2>
                  <p className="mt-3 text-pietra">{CANTIERI_BREVI[c.titolo] ?? c.testo}</p>
                  {'video' in c && (
                    <a href={c.video} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-3 rounded-full bg-corallo py-2 pr-5 pl-2 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5">
                      <span className="flex size-8 items-center justify-center rounded-full bg-white text-corallo">
                        <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5" aria-hidden="true">
                          <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
                        </svg>
                      </span>
                      Guarda il video
                    </a>
                  )}
                </div>
              </article>
            </Rivela>
          ))}
        </ul>
      </section>
      <InvitoFinale />
    </>
  )
}
