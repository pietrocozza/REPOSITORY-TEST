import Rivela from '@/components/ui/Rivela'
import Pulsante from '@/components/ui/Pulsante'
import Contatore from '@/components/ui/Contatore'
import { EXTRA, PIANI } from '@/lib/contenuti'

export default function Piani({ conExtra = true }: { conExtra?: boolean }) {
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        {PIANI.map((p, i) => {
          const scuro = i === 1
          return (
            <Rivela key={p.nome} ritardo={i * 0.12}>
              <article
                className={`relative flex h-full flex-col overflow-hidden rounded-sm p-8 md:p-12 ${scuro ? 'bg-notte text-avorio' : 'border border-linea bg-avorio'}`}
              >
                {scuro && <span className="etichetta mb-6 self-start rounded-full bg-terracotta px-3 py-1.5 text-avorio sm:absolute sm:top-8 sm:right-8 sm:mb-0 md:top-12 md:right-12">Tutto incluso</span>}
                <h3 className="font-display text-4xl md:text-5xl">{p.nome}</h3>
                <p className={`mt-3 ${scuro ? 'text-nebbia' : 'text-pietra'}`}>{p.sottotitolo}</p>
                <p className="mt-10 flex items-end gap-3">
                  <span className="font-display text-[clamp(5rem,12vw,9rem)] leading-[0.8] tracking-tight">
                    <Contatore a={p.percentuale} suffisso="%" durata={1.6} />
                  </span>
                  <span className={`pb-2 text-sm ${scuro ? 'text-nebbia' : 'text-pietra'}`}>sull’affitto generato</span>
                </p>
                <ul className={`mt-10 grid gap-x-8 gap-y-3 border-t pt-8 text-sm sm:grid-cols-2 ${scuro ? 'border-white/15' : 'border-linea'}`}>
                  {p.voci.map((v) => (
                    <li key={v} className="flex gap-3">
                      <svg viewBox="0 0 16 16" className={`mt-0.5 size-4 shrink-0 ${scuro ? 'text-terracotta-chiara' : 'text-terracotta'}`} aria-hidden="true">
                        <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {v}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-10">
                  <Pulsante href="/contatti" variante={scuro ? 'chiaro' : 'pieno'}>Scopri di più</Pulsante>
                </div>
              </article>
            </Rivela>
          )
        })}
      </div>
      {conExtra && (
        <Rivela className="mt-6 grid gap-6 rounded-sm border border-linea p-8 md:grid-cols-[12rem_1fr] md:p-12">
          <p className="font-display text-4xl italic text-terracotta">Extra</p>
          <ul className="grid gap-4 md:grid-cols-3">
            {EXTRA.map((e) => (
              <li key={e} className="border-t border-linea pt-4 text-sm">{e}</li>
            ))}
          </ul>
        </Rivela>
      )}
    </div>
  )
}
