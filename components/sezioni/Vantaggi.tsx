import Image from 'next/image'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Rivela from '@/components/ui/Rivela'
import Icona from '@/components/ui/Icona'
import { VANTAGGI_BREVI } from '@/lib/contenuti'

const COLORI = ['bg-pesca', 'bg-cielo', 'bg-limone', 'bg-salvia', 'bg-sabbia']

/** I vantaggi degli affitti brevi: schede compatte con icona, da leggere in un colpo d’occhio */
export default function Vantaggi() {
  return (
    <section aria-labelledby="titolo-vantaggi" className="relative isolate overflow-hidden bg-notte text-crema">
      {/* foto di Roma sullo sfondo, scurita: stacca dalle sezioni chiare sopra e sotto */}
      <Image src="/img/roma/piazza-san-pietro.jpg" alt="" fill sizes="100vw" quality={70} className="-z-20 object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-notte/75" />
      <div className="contenitore py-16 md:py-20">
        <Etichetta className="mb-5 text-sole">Perché gli affitti brevi</Etichetta>
        <TestoDiviso as="h2" testo="Più guadagno, *zero pensieri.*" className="titolo-xl max-w-3xl" accento="text-sole" />
        <span id="titolo-vantaggi" className="sr-only">
          I vantaggi degli affitti brevi
        </span>
        <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 md:mt-10 md:gap-4 lg:grid-cols-5">
          {VANTAGGI_BREVI.map((v, i) => (
            <Rivela as="li" key={v.titolo} ritardo={i * 0.06} className={`flex items-start gap-4 rounded-3xl p-4 text-inchiostro md:p-6 lg:block ${COLORI[i % COLORI.length]}`}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                <Icona nome={v.icona} className="size-6 text-corallo" />
              </span>
              <div>
                <p className="font-display text-lg leading-tight font-bold tracking-tight lg:mt-4 lg:text-[1.35rem]">{v.titolo}</p>
                <p className="mt-1 text-sm text-inchiostro/75">{v.testo}</p>
              </div>
            </Rivela>
          ))}
        </ul>
      </div>
    </section>
  )
}
