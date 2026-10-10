import Image from 'next/image'
import Link from 'next/link'
import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Rivela from '@/components/ui/Rivela'
import { RECENSIONI_GOOGLE } from '@/lib/contenuti'

const PERSONE = [
  { nome: 'Pietro Cozza', ruolo: 'Amministrazione e ospiti', foto: '/img/team/pietro.jpg', colore: 'bg-pesca' },
  { nome: 'Francesco Ignoti', ruolo: 'Proprietari e manutenzione', foto: '/img/team/francesco.jpg', colore: 'bg-cielo' },
]

// La recensione di una proprietaria: la frase che racconta meglio chi siamo
const CITAZIONE = {
  nome: RECENSIONI_GOOGLE[0].nome,
  testo: '…combinare un approccio strutturato e professionale con uno più umano e personalizzato.',
}

/** Le persone dietro il servizio, subito in home: chi ti affida casa sa con chi parla */
export default function ChiSiamoBreve() {
  return (
    <section aria-labelledby="titolo-noi" className="bg-sabbia">
      <div className="contenitore grid gap-12 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <Etichetta className="mb-6 text-corallo">Chi siamo</Etichetta>
          <TestoDiviso as="h2" testo="Dietro ogni casa, *due persone vere.*" className="titolo-xl max-w-[16ch]" />
          <span id="titolo-noi" className="sr-only">
            Chi siamo
          </span>
          <p className="mt-6 max-w-xl text-lg text-inchiostro/75">
            Siamo Pietro e Francesco. Quando ci affidi la tua casa non parli con un call center: hai due nomi, due numeri di telefono e qualcuno che risponde davvero.
          </p>
          <figure className="mt-8 max-w-xl border-l-4 border-corallo pl-5">
            <blockquote className="font-display text-xl font-bold tracking-tight">“{CITAZIONE.testo}”</blockquote>
            <figcaption className="mt-2 text-sm text-pietra">{CITAZIONE.nome}, proprietaria, recensione su Google</figcaption>
          </figure>
          <Link href="/chi-siamo" className="mt-8 inline-block font-semibold underline underline-offset-4 hover:text-corallo">
            Conosci il team →
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 max-lg:order-first">
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
