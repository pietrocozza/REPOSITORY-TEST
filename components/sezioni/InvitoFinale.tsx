import Image from 'next/image'
import Pulsante from '@/components/ui/Pulsante'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Rivela from '@/components/ui/Rivela'

/** Chiusura delle pagine: invito al simulatore su foto di Roma */
export default function InvitoFinale() {
  return (
    <section className="relative overflow-hidden bg-notte text-avorio">
      <Image src="/img/roma/pantheon-alto.jpg" alt="" fill sizes="100vw" className="object-cover opacity-35" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-notte via-notte/60 to-notte/30" />
      <div className="contenitore relative py-28 md:py-44">
        <p className="etichetta mb-8 text-avorio/70">Calcola guadagno</p>
        <TestoDiviso as="h2" testo="Scopri quanto potresti *guadagnare.*" className="titolo-xl max-w-4xl" accento="text-terracotta-chiara" />
        <Rivela className="mt-8 max-w-xl text-lg text-avorio/80">
          Scopri subito quanto potresti guadagnare trasformando il tuo appartamento in una struttura ricettiva con il nostro simulatore online.
        </Rivela>
        <Rivela className="mt-10" ritardo={0.1}>
          <Pulsante href="/calcola-guadagno" variante="chiaro">Apri il simulatore</Pulsante>
        </Rivela>
      </div>
    </section>
  )
}
