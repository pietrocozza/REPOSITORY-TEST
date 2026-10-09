import Image from 'next/image'
import Rivela from '@/components/ui/Rivela'

// Riconoscimenti dei portali, come nella sezione "I nostri partner" del sito attuale
const BADGE = [
  { src: '/img/partner/airbnb-superhost.png', alt: 'Airbnb Superhost', w: 327, h: 149 },
  { src: '/img/partner/booking-premier-partner.png', alt: 'Booking.com Premier Partner', w: 449, h: 103 },
  { src: '/img/partner/vrbo-premier-partner.png', alt: 'Vrbo Premier Partner', w: 366, h: 176 },
]

const PORTALI = ['Airbnb', 'Booking.com', 'Vrbo']

export default function Partner({ scuro = false }: { scuro?: boolean }) {
  return (
    <section aria-labelledby="titolo-partner" className={scuro ? 'bg-notte text-avorio' : 'bg-avorio'}>
      <div className="contenitore py-16 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_2fr]">
          <Rivela>
            <p className={`etichetta mb-3 ${scuro ? 'text-nebbia' : 'text-pietra'}`}>I nostri partner</p>
            <h2 id="titolo-partner" className="font-display text-3xl leading-tight md:text-4xl">
              Pubblichiamo la tua casa su <span className="italic text-terracotta">Airbnb, Booking e Vrbo</span>.
            </h2>
          </Rivela>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BADGE.map((b, i) => (
              <Rivela as="li" key={b.src} ritardo={i * 0.1}>
                <div className="group flex h-36 items-center justify-center rounded-sm bg-white px-8 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-transform duration-700 ease-lusso hover:-translate-y-1.5">
                  <Image src={b.src} alt={b.alt} width={b.w} height={b.h} className="max-h-20 w-auto object-contain" />
                </div>
              </Rivela>
            ))}
          </ul>
        </div>
      </div>

      {/* Nastro scorrevole con i nomi dei portali */}
      <div aria-hidden="true" className={`overflow-hidden border-y py-5 ${scuro ? 'border-white/10' : 'border-linea'}`}>
        <div className="motion-safe:nastro flex w-max gap-12 whitespace-nowrap" style={{ '--durata': '30s' } as React.CSSProperties}>
          {Array.from({ length: 2 }, (_, k) => (
            <div key={k} className="flex gap-12">
              {Array.from({ length: 4 }, (_, j) =>
                PORTALI.map((p) => (
                  <span key={`${j}-${p}`} className="flex items-center gap-12 font-display text-4xl md:text-5xl">
                    {p}
                    <span className="text-terracotta">✦</span>
                  </span>
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
