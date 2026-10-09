import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import Contatore from '@/components/ui/Contatore'
import TestoAScorrimento from '@/components/ui/TestoAScorrimento'
import ImmagineParallasse from '@/components/ui/ImmagineParallasse'
import { VANTAGGI } from '@/lib/contenuti'

export default function Vantaggi() {
  return (
    <section aria-labelledby="titolo-vantaggi" className="bg-avorio">
      <div className="contenitore py-24 md:py-36">
        <Etichetta numero="01" className="mb-10 text-pietra">Perché gli affitti brevi</Etichetta>
        <h2 id="titolo-vantaggi" className="sr-only">I vantaggi degli affitti brevi</h2>
        <TestoAScorrimento
          testo="Scopri i vantaggi di affittare il tuo immobile a breve termine, affidandoti a degli esperti del settore."
          className="titolo-lg max-w-5xl"
        />

        <div className="mt-20 grid gap-12 lg:mt-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ImmagineParallasse src="/img/case/living.jpg" alt="Soggiorno luminoso di un appartamento gestito" className="aspect-[4/5] rounded-sm" />
          </div>
          <ol className="divide-y divide-linea border-y border-linea">
            {VANTAGGI.map((v, i) => (
              <Rivela as="li" key={v.titolo} className="grid gap-4 py-10 sm:grid-cols-[5rem_1fr] md:py-12">
                <span className="font-display text-xl text-terracotta italic">0{i + 1}</span>
                <div>
                  {'numero' in v && (
                    <p className="font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-none tracking-tight">
                      <Contatore a={v.numero} prefisso={v.prefisso} suffisso={v.suffisso} />
                    </p>
                  )}
                  <h3 className="mt-3 font-display text-3xl md:text-4xl">{v.titolo}</h3>
                  <p className="mt-3 max-w-xl text-pietra">{v.testo}</p>
                </div>
              </Rivela>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
