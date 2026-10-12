import Image from 'next/image'
import Link from 'next/link'
import Rivela from '@/components/ui/Rivela'

const PERSONE = [
  { nome: 'Pietro Cozza', foto: '/img/team/pietro.jpg', citta: 'Roma', colore: 'bg-pesca' },
  { nome: 'Francesco Ignoti', foto: '/img/team/francesco.jpg', citta: 'Milano', colore: 'bg-cielo' },
]

/** Le persone dietro il servizio, subito in home: chi ti affida casa sa con chi parla */
export default function ChiSiamoBreve() {
  return (
    <section aria-label="Chi siamo" className="bg-sabbia">
      <div className="contenitore pt-6 pb-16 md:pt-8 md:pb-20">
        <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-4 lg:max-w-5xl lg:gap-6">
          {PERSONE.map((p, i) => (
            <Rivela as="li" key={p.nome} ritardo={i * 0.12} className={`flex flex-col items-center rounded-[2rem] p-5 text-center md:p-8 ${p.colore}`}>
              <div className="relative size-28 overflow-hidden rounded-full border-[5px] border-white shadow-[0_20px_40px_-20px_rgba(29,34,54,0.5)] md:size-40 lg:size-64">
                <Image src={p.foto} alt={`Foto di ${p.nome}`} fill sizes="(min-width: 1024px) 256px, 160px" quality={90} className="object-cover" />
              </div>
              <p className="mt-4 font-display text-xl leading-tight font-bold tracking-tight md:text-2xl lg:text-3xl">{p.nome}</p>
              <p className="mt-3 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold text-inchiostro shadow-sm lg:text-sm">
                <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="currentColor" />
                  <circle cx="12" cy="9.5" r="2.5" fill="white" />
                </svg>
                Lavora a {p.citta}
              </p>
            </Rivela>
          ))}
        </ul>
        <div className="mx-auto mt-10 max-w-2xl text-center md:mt-12">
          <h2 className="font-display text-[clamp(1.6rem,6vw,2.75rem)] leading-tight font-bold tracking-tight">
            Piacere, siamo <span className="italic text-corallo">Pietro e Francesco.</span>
          </h2>
          <Link href="/chi-siamo" className="group mt-4 inline-flex items-center gap-2 text-lg font-semibold text-corallo underline-offset-4 hover:underline">
            Ci presentiamo
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
