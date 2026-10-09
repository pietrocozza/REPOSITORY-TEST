import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Icona from '@/components/ui/Icona'
import Pulsante from '@/components/ui/Pulsante'
import { SERVIZI } from '@/lib/contenuti'

export default function Servizi() {
  return (
    <section aria-labelledby="titolo-servizi" className="bg-carta">
      <div className="contenitore py-24 md:py-36">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Etichetta numero="03" className="mb-8 text-pietra">Ci occupiamo noi di tutto</Etichetta>
            <TestoDiviso as="h2" testo="Pensiamo a ogni dettaglio, *tu ricevi solo i profitti.*" className="titolo-xl" />
            <span id="titolo-servizi" className="sr-only">I nostri servizi</span>
          </div>
          <Rivela className="flex lg:justify-end">
            <Pulsante href="/gestione" variante="contorno">Piani e commissioni</Pulsante>
          </Rivela>
        </div>

        <ul className="mt-16 grid border-t border-l border-linea sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          {SERVIZI.map((s, i) => (
            <Rivela as="li" key={s.titolo} ritardo={(i % 4) * 0.08} className="group relative border-r border-b border-linea">
              <div className="relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden p-7 md:p-8">
                <span aria-hidden="true" className="absolute inset-0 origin-bottom scale-y-0 bg-inchiostro transition-transform duration-700 ease-lusso group-hover:scale-y-100" />
                <div className="relative flex items-start justify-between transition-colors duration-500 group-hover:text-avorio">
                  <Icona nome={s.titolo} className="size-10 text-terracotta transition-colors duration-500 group-hover:text-terracotta-chiara" />
                  <span className="font-display text-sm italic opacity-60">0{i + 1}</span>
                </div>
                <div className="relative transition-colors duration-500 group-hover:text-avorio">
                  <h3 className="font-display text-3xl">{s.titolo}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-pietra transition-colors duration-500 group-hover:text-avorio/75">{s.testo}</p>
                </div>
              </div>
            </Rivela>
          ))}
        </ul>
      </div>
    </section>
  )
}
