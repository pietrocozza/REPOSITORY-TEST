import Image from 'next/image'
import Rivela from '@/components/ui/Rivela'

const PERSONE = [
  { nome: 'Pietro Cozza', ruolo: 'Amministrazione e ospiti', foto: '/img/team/pietro.jpg', colore: 'bg-pesca' },
  { nome: 'Francesco Ignoti', ruolo: 'Proprietari e manutenzione', foto: '/img/team/francesco.jpg', colore: 'bg-cielo' },
]

/** Le persone dietro il servizio, subito in home: chi ti affida casa sa con chi parla */
export default function ChiSiamoBreve() {
  return (
    <section aria-label="Chi siamo" className="bg-sabbia">
      <div className="contenitore py-16 md:py-20">
        <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-4">
          {PERSONE.map((p, i) => (
            <Rivela as="li" key={p.nome} ritardo={i * 0.12} className={`flex flex-col items-center rounded-[2rem] p-5 text-center md:p-8 ${p.colore}`}>
              <div className="relative size-28 overflow-hidden rounded-full border-[5px] border-white shadow-[0_20px_40px_-20px_rgba(29,34,54,0.5)] md:size-40">
                <Image src={p.foto} alt={`Foto di ${p.nome}`} fill sizes="160px" quality={90} className="object-cover" />
              </div>
              <p className="mt-4 font-display text-xl font-bold tracking-tight md:text-2xl">{p.nome}</p>
              <p className="mt-1 text-sm text-inchiostro/70">{p.ruolo}</p>
            </Rivela>
          ))}
        </ul>
      </div>
    </section>
  )
}
