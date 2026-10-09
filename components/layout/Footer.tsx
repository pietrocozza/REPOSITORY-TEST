import Link from 'next/link'
import { NAV, SITO } from '@/lib/site'
import { Capitello } from './Logo'
import Pulsante from '@/components/ui/Pulsante'
import TestoDiviso from '@/components/ui/TestoDiviso'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-notte text-avorio">
      <div className="contenitore pt-24 pb-10 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="etichetta mb-6 text-nebbia">Fai fruttare il tuo immobile</p>
            <TestoDiviso as="p" testo="Senza nessun *pensiero.*" className="titolo-xl" accento="text-terracotta-chiara" />
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <Pulsante href="/calcola-guadagno" variante="chiaro">Calcola il guadagno</Pulsante>
            <Pulsante href={SITO.whatsapp.href} esterno variante="contorno" className="text-avorio">
              Scrivici su WhatsApp
            </Pulsante>
          </div>
        </div>

        <div className="mt-20 grid gap-10 border-t border-white/10 pt-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="etichetta mb-4 text-nebbia">Contatti</p>
            <p className="text-nebbia">Telefono ({SITO.telefono.referente})</p>
            <a href={SITO.telefono.href} className="mb-3 block hover:text-terracotta-chiara">{SITO.telefono.numero}</a>
            <p className="text-nebbia">Solo WhatsApp ({SITO.whatsapp.referente})</p>
            <a href={SITO.whatsapp.href} target="_blank" rel="noopener noreferrer" className="mb-3 block hover:text-terracotta-chiara">
              {SITO.whatsapp.numero}
            </a>
            <a href={`mailto:${SITO.email}`} className="block break-all hover:text-terracotta-chiara">{SITO.email}</a>
          </div>
          {SITO.sedi.map((s) => (
            <div key={s.citta}>
              <p className="etichetta mb-4 text-nebbia">Sede di {s.citta}</p>
              <a href={s.mappa} target="_blank" rel="noopener noreferrer" className="hover:text-terracotta-chiara">{s.indirizzo}</a>
              <p className="mt-2 text-nebbia">Su appuntamento</p>
            </div>
          ))}
          <nav aria-label="Pagine">
            <p className="etichetta mb-4 text-nebbia">Pagine</p>
            <ul className="space-y-1.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-terracotta-chiara">{n.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div aria-hidden="true" className="mt-20 flex items-end gap-[2vw] select-none">
          <Capitello className="size-[12vw] text-avorio/90" />
          <p className="font-display text-[12.5vw] leading-[0.8] tracking-tight whitespace-nowrap">
            Soluzione <span className="italic text-terracotta-chiara">Affitto</span>
          </p>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-xs text-nebbia sm:flex-row">
          <p>© {new Date().getFullYear()} Soluzione Affitto · P.IVA {SITO.piva}</p>
          <p>Gestione affitti brevi a Roma e Milano</p>
        </div>
      </div>
    </footer>
  )
}
