import Hero from '@/components/sezioni/Hero'
import Partner from '@/components/sezioni/Partner'
import Vantaggi from '@/components/sezioni/Vantaggi'
import Servizi from '@/components/sezioni/Servizi'
import Appartamenti from '@/components/sezioni/Appartamenti'
import Recensioni from '@/components/sezioni/Recensioni'
import Piani from '@/components/sezioni/Piani'
import PrimaDopo from '@/components/sezioni/PrimaDopo'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Rivela from '@/components/ui/Rivela'
import Pulsante from '@/components/ui/Pulsante'
import Icona from '@/components/ui/Icona'

const RISULTATI = [
  { icona: 'euro', testo: '0 € anticipati' },
  { icona: 'casa', testo: 'Casa valorizzata' },
  { icona: 'calendario', testo: 'Affitto in anticipo' },
]

export default function Home() {
  return (
    <>
      <Hero />
      <Partner />
      <Vantaggi />
      <Servizi />
      <Appartamenti />

      {/* Piani di gestione */}
      <section aria-labelledby="titolo-piani" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Gestione</Etichetta>
          <TestoDiviso as="h2" testo="Due formule, *scegli tu.*" className="titolo-xl mb-12" />
          <span id="titolo-piani" className="sr-only">Piani di gestione</span>
          <Piani conExtra={false} />
        </div>
      </section>

      <Recensioni />

      {/* Ristruttura gratis */}
      <section aria-labelledby="titolo-ristruttura" className="bg-salvia">
        <div className="contenitore grid gap-12 py-20 md:py-28 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <Etichetta className="mb-6 text-inchiostro/70">Ristruttura gratis</Etichetta>
            <TestoDiviso as="h2" testo="Casa da sistemare? *La rinnoviamo noi.*" className="titolo-xl" />
            <span id="titolo-ristruttura" className="sr-only">Ristrutturazione gratuita</span>
            <ul className="mt-8 flex flex-wrap gap-3">
              {RISULTATI.map((r, i) => (
                <Rivela as="li" key={r.testo} ritardo={i * 0.1} className="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 font-semibold">
                  <Icona nome={r.icona} className="size-5 text-corallo" />
                  {r.testo}
                </Rivela>
              ))}
            </ul>
            <div className="mt-10">
              <Pulsante href="/ristruttura-gratis">Guarda la storia</Pulsante>
            </div>
          </div>
          <Rivela>
            <PrimaDopo prima="/img/ristrutturazione/leonina-prima.jpg" dopo="/img/ristrutturazione/leonina-dopo.jpg" alt="Camera in Via Leonina, Rione Monti" />
          </Rivela>
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
