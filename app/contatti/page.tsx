import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Calcolatore from '@/components/sezioni/Calcolatore'
import Recensioni from '@/components/sezioni/Recensioni'
import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contattaci',
  description: 'Telefono, WhatsApp ed email di Soluzione Affitto. Sedi a Roma (Via Leonina 21) e Milano (Via Macedonio Melloni 17), su appuntamento.',
}

const CANALI = [
  { tipo: 'Telefono', nota: SITO.telefono.referente, valore: SITO.telefono.numero, href: SITO.telefono.href, esterno: false },
  { tipo: 'Solo WhatsApp', nota: SITO.whatsapp.referente, valore: SITO.whatsapp.numero, href: SITO.whatsapp.href, esterno: true },
  { tipo: 'Email', nota: 'Scrivici quando vuoi', valore: SITO.email, href: `mailto:${SITO.email}`, esterno: false },
]

export default function Contatti() {
  return (
    <>
      <IntestazionePagina
        etichetta="Contattaci"
        titolo="Parliamo della *tua casa.*"
        sottotitolo="Vuoi ottenere di più dalla tua proprietà? Valutiamo insieme la soluzione migliore."
      />

      <section className="bg-crema">
        <div className="contenitore pb-24 md:pb-32">
          <ul className="border-t border-linea">
            {CANALI.map((c, i) => (
              <Rivela as="li" key={c.tipo} ritardo={i * 0.06} className="border-b border-linea">
                <a
                  href={c.href}
                  {...(c.esterno ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group grid gap-2 py-8 md:grid-cols-[14rem_1fr_auto] md:items-center md:py-10"
                >
                  <span>
                    <span className="etichetta block text-pietra">{c.tipo}</span>
                    <span className="text-sm text-pietra">{c.nota}</span>
                  </span>
                  <span className="font-display text-[clamp(1.6rem,4.4vw,3.4rem)] leading-none font-bold tracking-tight break-all transition-all duration-500 ease-lusso group-hover:translate-x-3 group-hover:text-corallo">
                    {c.valore}
                  </span>
                  <svg viewBox="0 0 24 24" className="hidden size-8 transition-transform duration-500 ease-lusso group-hover:rotate-[-45deg] md:block" aria-hidden="true">
                    <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </Rivela>
            ))}
          </ul>

          <div className="mt-20">
            <Etichetta className="mb-6 text-corallo">Le nostre sedi, su appuntamento</Etichetta>
            <div className="grid gap-6 md:grid-cols-2">
              {SITO.sedi.map((s, i) => (
                <Rivela key={s.citta} ritardo={i * 0.1}>
                  <a
                    href={s.mappa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group block rounded-[2rem] p-8 text-inchiostro transition-transform duration-500 hover:-translate-y-1.5 md:p-12 ${i === 0 ? 'bg-sole' : 'bg-cielo'}`}
                  >
                    <p className="font-display text-5xl font-bold tracking-tighter md:text-7xl">{s.citta}</p>
                    <p className="mt-6 text-inchiostro/80">{s.indirizzo}</p>
                    <p className="etichetta mt-8 flex items-center gap-3">
                      Apri in Google Maps
                      <span aria-hidden="true" className="transition-transform duration-500 ease-lusso group-hover:translate-x-2">→</span>
                    </p>
                  </a>
                </Rivela>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="titolo-simulatore" className="bg-sabbia">
        <div className="contenitore grid gap-12 py-24 md:py-32 lg:grid-cols-[1fr_2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Etichetta className="mb-6 text-corallo">Simulatore di guadagno online</Etichetta>
            <h2 id="titolo-simulatore" className="titolo-lg">
              Raccontaci <span className="italic text-corallo">la tua casa.</span>
            </h2>
            <p className="mt-6 text-pietra">Bastano pochi passaggi: ti ricontattiamo con la stima del guadagno.</p>
          </div>
          <Calcolatore />
        </div>
      </section>

      <Recensioni />
    </>
  )
}
