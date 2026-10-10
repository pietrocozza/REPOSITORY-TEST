import Image from 'next/image'
import type { Blocco } from '@/lib/articoli'
import Grafico from './Grafico'
import PrimaDopo from '@/components/sezioni/PrimaDopo'
import Icona from '@/components/ui/Icona'

const COLORI = ['bg-pesca', 'bg-cielo', 'bg-limone', 'bg-salvia']

/** Trasforma i blocchi di un articolo in pagina */
export default function Blocchi({ blocchi }: { blocchi: Blocco[] }) {
  return (
    <div className="text-lg leading-relaxed text-inchiostro/85">
      {blocchi.map((b, i) => {
        switch (b.t) {
          case 'p':
            return (
              <p key={i} className="my-5">
                {b.testo}
              </p>
            )
          case 'h2':
            return (
              <h2 key={i} className="mt-12 mb-4 font-display text-3xl font-bold tracking-tight text-inchiostro">
                {b.testo}
              </h2>
            )
          case 'punti':
            return (
              <ul key={i} className="my-8 grid gap-3 sm:grid-cols-2">
                {b.voci.map((v, j) => (
                  <li key={v.titolo} className={`flex gap-4 rounded-3xl p-5 ${COLORI[j % COLORI.length]}`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white">
                      <Icona nome="check" className="size-5 text-corallo" />
                    </span>
                    <span>
                      <span className="block font-display text-lg font-bold tracking-tight text-inchiostro">{v.titolo}</span>
                      <span className="mt-1 block text-base text-inchiostro/75">{v.testo}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )
          case 'confronto':
            return (
              <div key={i} className="my-8 grid gap-3 sm:grid-cols-2">
                {[b.sinistra, b.destra].map((lato, j) => (
                  <div key={lato.titolo} className={`rounded-3xl p-6 ${j === 0 ? 'bg-salvia' : 'bg-sabbia'}`}>
                    <p className="font-display text-xl font-bold tracking-tight text-inchiostro">{lato.titolo}</p>
                    <ul className="mt-4 space-y-2.5 text-base">
                      {lato.voci.map((v) => (
                        <li key={v} className="flex gap-3">
                          <span className={`mt-2 size-2 shrink-0 rounded-full ${j === 0 ? 'bg-corallo' : 'bg-pietra'}`} />
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )
          case 'grafico':
            return <Grafico key={i} g={b.grafico} />
          case 'img':
            return (
              <figure key={i} className="my-10">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem]">
                  <Image src={b.src} alt={b.alt} fill sizes="(min-width:768px) 720px, 100vw" className="object-cover" />
                </div>
                {b.didascalia && <figcaption className="mt-3 text-sm text-pietra">{b.didascalia}</figcaption>}
              </figure>
            )
          case 'prima-dopo':
            return (
              <div key={i} className="my-10">
                <PrimaDopo prima={b.prima} dopo={b.dopo} alt={b.alt} />
                <p className="mt-3 text-xs text-pietra">Il “prima” è una ricostruzione illustrativa dello stato iniziale.</p>
              </div>
            )
          case 'citazione':
            return (
              <blockquote key={i} className="my-10 border-l-4 border-sole pl-6 font-display text-2xl font-semibold tracking-tight text-inchiostro">
                {b.testo}
              </blockquote>
            )
          case 'numeri':
            return (
              <div key={i} className="my-10 grid grid-cols-3 gap-3">
                {b.voci.map((n) => (
                  <div key={n.etichetta} className="rounded-3xl bg-white p-5 text-center shadow-[0_20px_40px_-30px_rgba(29,34,54,0.4)]">
                    <p className="font-display text-3xl font-bold tracking-tighter text-corallo md:text-4xl">{n.valore}</p>
                    <p className="mt-1 text-xs font-medium text-pietra md:text-sm">{n.etichetta}</p>
                  </div>
                ))}
              </div>
            )
          case 'tappe':
            return (
              <ol key={i} className="relative my-10 space-y-6 border-l-2 border-linea pl-8">
                {b.voci.map((v) => (
                  <li key={v.data} className="relative">
                    <span className="absolute top-1.5 -left-[2.55rem] size-4 rounded-full border-4 border-crema bg-corallo" />
                    <p className="text-sm font-bold text-corallo">{v.data}</p>
                    <p className="mt-1 text-base">{v.testo}</p>
                  </li>
                ))}
              </ol>
            )
          case 'nota':
            return (
              <p key={i} className="my-8 flex gap-3 rounded-3xl bg-limone p-5 text-base">
                <Icona nome="documento" className="mt-0.5 size-5 shrink-0 text-inchiostro" />
                {b.testo}
              </p>
            )
        }
      })}
    </div>
  )
}
