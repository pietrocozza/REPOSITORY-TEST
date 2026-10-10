import IntestazionePagina from '@/components/sezioni/IntestazionePagina'

/** Pagina di solo testo (privacy, cookie): titolo e sezioni con paragrafi ed elenchi */
export type SezioneTesto = { titolo: string; testo?: string[]; punti?: string[] }

export default function PaginaTesto({ etichetta, titolo, aggiornamento, sezioni }: { etichetta: string; titolo: string; aggiornamento: string; sezioni: SezioneTesto[] }) {
  return (
    <>
      <IntestazionePagina etichetta={etichetta} titolo={titolo} sottotitolo={`Ultimo aggiornamento: ${aggiornamento}`} />
      <section className="bg-crema">
        <div className="contenitore pb-28">
          <div className="max-w-3xl space-y-10 text-lg leading-relaxed text-inchiostro/85">
            {sezioni.map((s) => (
              <div key={s.titolo}>
                <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-inchiostro">{s.titolo}</h2>
                {s.testo?.map((t) => (
                  <p key={t} className="mb-3">
                    {t}
                  </p>
                ))}
                {s.punti && (
                  <ul className="space-y-2">
                    {s.punti.map((t) => (
                      <li key={t} className="flex gap-3">
                        <span className="mt-3 size-2 shrink-0 rounded-full bg-corallo" aria-hidden="true" />
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
