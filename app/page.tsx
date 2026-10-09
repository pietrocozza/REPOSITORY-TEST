import Image from 'next/image'
import Hero from '@/components/sezioni/Hero'
import Partner from '@/components/sezioni/Partner'
import Vantaggi from '@/components/sezioni/Vantaggi'
import Zero from '@/components/sezioni/Zero'
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

export default function Home() {
  return (
    <>
      <Hero />
      <Partner />
      <Vantaggi />
      <Zero />
      <Servizi />
      <Appartamenti />

      {/* Piani di gestione */}
      <section aria-labelledby="titolo-piani" className="bg-avorio">
        <div className="contenitore py-24 md:py-36">
          <Etichetta numero="05" className="mb-8 text-pietra">Gestione</Etichetta>
          <div className="mb-16 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <TestoDiviso as="h2" testo="Due formule, *nessun pensiero.*" className="titolo-xl" />
            <Rivela className="max-w-md text-pietra lg:justify-self-end">
              Una commissione in percentuale sull’affitto generato. Scegli quanto vuoi delegare: al resto pensiamo noi.
            </Rivela>
          </div>
          <span id="titolo-piani" className="sr-only">Piani di gestione</span>
          <Piani conExtra={false} />
        </div>
      </section>

      <Recensioni numero="06" />

      {/* Ristruttura gratis */}
      <section aria-labelledby="titolo-ristruttura" className="bg-avorio">
        <div className="contenitore grid gap-14 py-24 md:py-36 lg:grid-cols-[1fr_1.25fr] lg:items-center">
          <div>
            <Etichetta numero="07" className="mb-8 text-pietra">Ristruttura gratis</Etichetta>
            <TestoDiviso as="h2" testo="Casa da sistemare? *La ristrutturiamo noi.*" className="titolo-lg" />
            <span id="titolo-ristruttura" className="sr-only">Ristrutturazione gratuita</span>
            <Rivela className="mt-8 space-y-4 text-pietra">
              <p>
                Aiutiamo i proprietari a ridare valore alle loro proprietà investendo direttamente sull’immobile. Lo prendiamo in locazione a lungo termine e lo
                destiniamo a ospitare la nostra clientela internazionale.
              </p>
              <p>Tu ritrovi una casa più bella e di valore, senza anticipare un euro e senza gestire operai o pratiche.</p>
            </Rivela>
            <Rivela className="mt-10" ritardo={0.1}>
              <Pulsante href="/ristruttura-gratis">Leggi la storia di Via Leonina</Pulsante>
            </Rivela>
          </div>
          <Rivela>
            <PrimaDopo prima="/img/ristrutturazione/leonina-prima.jpg" dopo="/img/ristrutturazione/leonina-dopo.jpg" alt="Camera in Via Leonina, Rione Monti" />
            <p className="mt-4 text-sm text-pietra">Via Leonina, Rione Monti — trascina per confrontare.</p>
          </Rivela>
        </div>
      </section>

      {/* Team */}
      <section className="bg-carta">
        <div className="contenitore grid gap-12 py-24 md:py-32 lg:grid-cols-[1fr_1fr] lg:items-center">
          <Rivela className="relative aspect-square overflow-hidden rounded-sm">
            <Image src="/img/team/team.jpg" alt="Il team di Soluzione Affitto" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </Rivela>
          <div>
            <Etichetta numero="08" className="mb-8 text-pietra">Chi siamo</Etichetta>
            <TestoDiviso as="h2" testo="Esperienza maturata *sul campo.*" className="titolo-lg" />
            <Rivela className="mt-8 max-w-xl text-pietra">
              La nostra esperienza l’abbiamo maturata direttamente con le nostre strutture. Ogni casa ha una sua identità specifica, esattamente come ogni
              proprietario ha delle esigenze altrettanto peculiari: per questo rendiamo ogni collaborazione su misura per te.
            </Rivela>
            <Rivela className="mt-10" ritardo={0.1}>
              <Pulsante href="/chi-siamo" variante="contorno">Conosci il team</Pulsante>
            </Rivela>
          </div>
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
