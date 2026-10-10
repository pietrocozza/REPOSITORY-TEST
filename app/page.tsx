import type { Metadata } from 'next'
import Link from 'next/link'
import Hero from '@/components/sezioni/Hero'
import Partner from '@/components/sezioni/Partner'
import Vantaggi from '@/components/sezioni/Vantaggi'
import Servizi from '@/components/sezioni/Servizi'
import Appartamenti from '@/components/sezioni/Appartamenti'
import Recensioni from '@/components/sezioni/Recensioni'
import Piani from '@/components/sezioni/Piani'
import PrimaDopo from '@/components/sezioni/PrimaDopo'
import Simulatore from '@/components/sezioni/Simulatore'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Rivela from '@/components/ui/Rivela'
import Pulsante from '@/components/ui/Pulsante'
import Icona from '@/components/ui/Icona'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

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

      {/* Simulatore di guadagno */}
      <section id="simulatore" aria-labelledby="titolo-simulatore" className="scroll-mt-20 bg-pesca">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Simulatore di guadagno</Etichetta>
          <TestoDiviso as="h2" testo="Quanto incassano *davvero* le case come la tua?" className="titolo-xl mb-4 max-w-[18ch]" />
          <span id="titolo-simulatore" className="sr-only">
            Simulatore di guadagno
          </span>
          <p className="mb-12 max-w-xl text-lg text-inchiostro/75">Zona per zona, camera per camera: i numeri veri degli annunci Airbnb di Roma e Milano.</p>
          <Simulatore vetrina />
          <p className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <Link href="/gestione-affitti-brevi-roma" className="underline underline-offset-4 hover:text-corallo">
              Gestione affitti brevi a Roma, zona per zona →
            </Link>
            <Link href="/gestione-affitti-brevi-milano" className="underline underline-offset-4 hover:text-corallo">
              Gestione affitti brevi a Milano →
            </Link>
          </p>
        </div>
      </section>
      <Vantaggi />
      <Servizi />
      <Appartamenti />

      {/* Piani di gestione */}
      <section aria-labelledby="titolo-piani" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Gestione</Etichetta>
          <TestoDiviso as="h2" testo="Due formule, *scegli tu.*" className="titolo-xl mb-12" />
          <span id="titolo-piani" className="sr-only">
            Piani di gestione
          </span>
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
            <span id="titolo-ristruttura" className="sr-only">
              Ristrutturazione gratuita
            </span>
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
            <PrimaDopo prima="/img/ristrutturazione/leonina-prima-ricostruzione.jpg" dopo="/img/ristrutturazione/leonina-dopo.jpg" alt="Camera in Via Leonina, Rione Monti" />
            <p className="mt-3 text-xs text-inchiostro/60">Il “prima” è una ricostruzione illustrativa dello stato iniziale.</p>
          </Rivela>
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
