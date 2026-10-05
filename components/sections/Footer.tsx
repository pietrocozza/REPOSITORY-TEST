import { INFO, ORARI } from '@/lib/info'

/** Footer compatto: orari, indirizzo, telefono, social (tutti dati fittizi, vedi lib/info.ts) */
export default function Footer() {
  return (
    <footer className="border-t border-bordo px-4 pb-28 pt-14 md:px-8 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-3xl uppercase">
            Brace <span className="text-ambra">&amp;</span> Peperino
          </p>
          <p className="mt-2 text-sm text-crema-muta">{INFO.payoff}.</p>
        </div>
        <div>
          <h2 className="etichetta mb-3 text-crema-muta">Orari</h2>
          {/* PLACEHOLDER: orari fittizi */}
          <ul className="space-y-1 text-sm">
            {ORARI.map((o) => (
              <li key={o.giorni}>
                <span className="text-crema-muta">{o.giorni}:</span> {o.orario}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="etichetta mb-3 text-crema-muta">Dove</h2>
          {/* PLACEHOLDER: indirizzo e telefono fittizi */}
          <address className="space-y-1 text-sm not-italic">
            <p>{INFO.indirizzo}</p>
            <p>{INFO.citta}</p>
            <p>
              <a href={INFO.telefonoHref} className="underline decoration-bordo underline-offset-4 hover:text-ambra">
                {INFO.telefono}
              </a>
            </p>
          </address>
        </div>
        <div>
          <h2 className="etichetta mb-3 text-crema-muta">Social</h2>
          {/* PLACEHOLDER: profili social fittizi */}
          <ul className="flex flex-wrap gap-2">
            {INFO.social.map((s) => (
              <li key={s.nome}>
                <a href={s.href} className="flex h-11 items-center rounded-full px-4 text-sm ring-1 ring-bordo transition-colors hover:text-ambra hover:ring-ambra/50">
                  {s.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl text-xs text-crema-muta">© {INFO.nome} · Locale inventato, sito dimostrativo.</p>
    </footer>
  )
}
