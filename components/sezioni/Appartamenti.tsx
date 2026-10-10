import Image from 'next/image'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import { APPARTAMENTI } from '@/lib/contenuti'

// Carosello che scorre da solo (si ferma al passaggio del mouse; su telefono si sfoglia col dito).
// Non blocca lo scorrimento della pagina.
export default function Appartamenti() {
  const schede = APPARTAMENTI.slice(0, 7)
  return (
    <section aria-labelledby="titolo-appartamenti" className="overflow-hidden bg-cielo py-20 md:py-28">
      <div className="contenitore flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Etichetta className="mb-6 text-azzurro">Appartamenti</Etichetta>
          <TestoDiviso as="h2" testo="Case che *gestiamo.*" className="titolo-xl" accento="text-azzurro" />
          <span id="titolo-appartamenti" className="sr-only">Appartamenti gestiti</span>
        </div>
        <p className="max-w-xs text-pietra">Dal Rione Monti a Brera, tra Roma e Milano.</p>
      </div>

      <div className="group mt-12">
        <div className="senza-barra overflow-x-auto md:overflow-visible">
          <ul className="flex w-max gap-4 px-4 sm:px-8 md:gap-6 md:px-0 motion-safe:md:nastro md:group-hover:[animation-play-state:paused]" style={{ '--durata': '55s' } as React.CSSProperties}>
            {[...schede, ...schede].map((a, i) => (
              <li key={`${a.nome}-${i}`} aria-hidden={i >= schede.length ? true : undefined} className={`w-[72vw] shrink-0 sm:w-[24rem] ${i >= schede.length ? 'hidden md:block' : ''}`}>
                <figure className="group/scheda rounded-[1.75rem] bg-white p-2.5 shadow-[0_20px_50px_-25px_rgba(29,34,54,0.4)] transition-transform duration-500 hover:-translate-y-2 hover:rotate-[-1deg]" data-cursore="Vedi">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem]">
                    <Image src={a.foto} alt={`${a.nome}, ${a.dettaglio}`} fill sizes="(min-width:640px) 24rem, 72vw" className="object-cover transition-transform duration-1000 ease-lusso group-hover/scheda:scale-110" />
                    {a.citta && (
                      <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold ${a.citta === 'Roma' ? 'bg-sole text-inchiostro' : a.citta === 'Milano' ? 'bg-azzurro text-white' : 'bg-salvia text-inchiostro'}`}>{a.citta}</span>
                    )}
                  </div>
                  <figcaption className="px-2.5 pt-4 pb-2">
                    <p className="font-display text-xl font-bold tracking-tight">{a.nome}</p>
                    <p className="mt-0.5 text-sm text-pietra">{a.dettaglio}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
