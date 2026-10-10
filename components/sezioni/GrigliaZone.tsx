import Link from 'next/link'
import type { DatiZona } from '@/lib/zone'
import { migliaia } from '@/lib/zone'

/** Zone con la fascia di incasso annuo per un 2 camere; con `base` ogni scheda porta alla pagina della zona */
export default function GrigliaZone({ zone, base }: { zone: (DatiZona & { slug?: string })[]; base?: string }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {zone.map((z) => {
        const d = z.camere['2']
        const contenuto = (
          <>
            <span className="block font-display text-xl font-bold tracking-tight">{z.nome}</span>
            <span className="mt-1 block text-sm text-pietra">2 camere, incasso annuo</span>
            <span className="mt-3 block font-display text-2xl font-bold tracking-tight text-corallo">
              {migliaia(d.min)} – {migliaia(d.max)} €
            </span>
          </>
        )
        return (
          <li key={z.nome}>
            {base && z.slug ? (
              <Link
                href={`${base}/${z.slug}`}
                className="group block h-full rounded-3xl bg-white p-5 shadow-[0_20px_40px_-30px_rgba(29,34,54,0.4)] transition-transform duration-500 ease-lusso hover:-translate-y-1"
              >
                {contenuto}
                <span className="mt-3 block text-sm font-semibold group-hover:text-corallo">Scopri la zona →</span>
              </Link>
            ) : (
              <div className="h-full rounded-3xl bg-white p-5 shadow-[0_20px_40px_-30px_rgba(29,34,54,0.4)]">{contenuto}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
