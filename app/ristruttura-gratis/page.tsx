import type { Metadata } from 'next'
import Image from 'next/image'
import StoriaLeonina from '@/components/storia/StoriaLeonina'
import IntestazioneStoria from '@/components/storia/IntestazioneStoria'
import PrimaDopo from '@/components/sezioni/PrimaDopo'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Domande from '@/components/ui/Domande'
import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Contatore from '@/components/ui/Contatore'
import Pulsante from '@/components/ui/Pulsante'
import Icona from '@/components/ui/Icona'
import { FAQ_LOCAZIONE, PASSI_LOCAZIONE, TESTIMONIANZE_PROPRIETARI, VANTAGGI_LOCAZIONE_BREVI } from '@/lib/contenuti'

export const metadata: Metadata = {
  alternates: { canonical: '/ristruttura-gratis' },
  title: 'Ristruttura gratis',
  description:
    'Hai una casa a Roma in zona centrale da ristrutturare? La rinnoviamo a nostre spese, la prendiamo in locazione a lungo termine e ti paghiamo l’affitto in anticipo.',
}

const COLORI = ['bg-pesca', 'bg-cielo', 'bg-limone', 'bg-salvia']

export default function RistrutturaGratis() {
  return (
    <>
      <IntestazioneStoria />

      {/* La storia a tappe */}
      <section id="storia" aria-label="La storia di Via Leonina" className="bg-crema">
        <div className="contenitore py-16 md:py-24">
          <StoriaLeonina />
        </div>
      </section>

      {/* Prima e dopo */}
      <section aria-labelledby="titolo-confronto" className="bg-sabbia">
        <div className="contenitore py-20 md:py-28">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <TestoDiviso as="h2" testo="Trascina e *guarda tu.*" className="titolo-xl" />
            <p id="titolo-confronto" className="text-pietra">Via Leonina, prima e dopo i lavori.</p>
          </div>
          <Rivela>
            <PrimaDopo prima="/img/ristrutturazione/leonina-prima-ricostruzione.jpg" dopo="/img/ristrutturazione/leonina-dopo.jpg" alt="Camera in Via Leonina" />
            <p className="mt-3 text-xs text-pietra">Il “prima” è una ricostruzione illustrativa dello stato iniziale.</p>
          </Rivela>
        </div>
      </section>

      {/* Come funziona */}
      <section aria-labelledby="titolo-passi" className="bg-crema">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-corallo">Come funziona</Etichetta>
          <TestoDiviso as="h2" testo="Quattro passi, *zero spese.*" className="titolo-xl" />
          <span id="titolo-passi" className="sr-only">Come funziona la ristrutturazione gratuita</span>
          <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PASSI_LOCAZIONE.map((p, i) => (
              <Rivela as="li" key={p.titolo} ritardo={i * 0.12} className={`relative rounded-[2rem] p-7 ${COLORI[i % COLORI.length]}`}>
                <span className="font-display text-6xl font-bold tracking-tighter text-inchiostro/20">{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{p.titolo}</h3>
                <p className="mt-2 text-inchiostro/75">{p.testo}</p>
              </Rivela>
            ))}
          </ol>
        </div>
      </section>

      {/* Vantaggi in pillole */}
      <section aria-labelledby="titolo-guadagni" className="bg-corallo text-white">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-white/80">Cosa ci guadagni</Etichetta>
          <TestoDiviso as="h2" testo="Meglio del *classico inquilino.*" className="titolo-xl" accento="text-sole" />
          <span id="titolo-guadagni" className="sr-only">Cosa ci guadagni</span>
          <ul className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {VANTAGGI_LOCAZIONE_BREVI.map((v, i) => (
              <Rivela as="li" key={v.titolo} ritardo={(i % 4) * 0.08} className="group rounded-3xl bg-white/[0.12] p-5 transition-colors duration-500 hover:bg-white/[0.2] md:p-6">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-sole text-inchiostro transition-transform duration-500 group-hover:rotate-[-8deg]">
                  <Icona nome={v.icona} className="size-6" />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold tracking-tight">{v.titolo}</h3>
                <p className="mt-1.5 text-sm text-white/80">{v.testo}</p>
              </Rivela>
            ))}
          </ul>
        </div>
      </section>

      {/* Prove */}
      <section aria-labelledby="titolo-prove" className="overflow-hidden bg-pesca">
        <div className="contenitore grid gap-12 py-20 md:py-28 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="font-display text-[clamp(5rem,13vw,10rem)] leading-[0.85] font-bold tracking-tighter text-corallo">
              <Contatore a={23} prefisso="+" />
            </p>
            <h2 id="titolo-prove" className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">proprietari soddisfatti</h2>
            <p className="mt-4 max-w-md text-inchiostro/75">
              Dopo più di un anno, Leonardo ci ha scritto una referenza. Qualche mese dopo abbiamo fatto lo stesso con la casa di Riccardo.
            </p>
          </div>
          <Rivela className="mx-auto w-full max-w-md rotate-[-3deg] rounded-3xl bg-white p-4 shadow-[0_40px_80px_-30px_rgba(29,34,54,0.45)] transition-transform duration-700 ease-lusso hover:rotate-0">
            <Image src="/img/ristrutturazione/referenza-leonardo.png" alt="Lettera di referenza firmata dal proprietario dell’immobile di Via Leonina" width={716} height={624} className="h-auto w-full rounded-2xl" />
          </Rivela>
        </div>

        <div className="group pb-20 md:pb-28">
          <ul className="flex w-max gap-4 motion-safe:nastro group-hover:[animation-play-state:paused]" style={{ '--durata': '60s' } as React.CSSProperties}>
            {[...TESTIMONIANZE_PROPRIETARI, ...TESTIMONIANZE_PROPRIETARI].map((t, i) => (
              <li key={`${t.nome}-${i}`} aria-hidden={i >= TESTIMONIANZE_PROPRIETARI.length ? true : undefined} className="w-[80vw] shrink-0 rounded-3xl bg-white p-6 sm:w-[22rem]">
                <p className="line-clamp-4 text-inchiostro/85">“{t.testo}”</p>
                <p className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-bold">{t.nome}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.citta === 'Roma' ? 'bg-sole' : 'bg-cielo'}`}>{t.citta}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Domande */}
      <section aria-labelledby="titolo-faq-locazione" className="bg-crema">
        <div className="contenitore grid gap-10 py-20 md:py-28 lg:grid-cols-[1fr_2fr]">
          <div>
            <TestoDiviso as="h2" testo="Hai *dubbi?*" className="titolo-xl" />
            <span id="titolo-faq-locazione" className="sr-only">Domande frequenti sulla locazione</span>
            <div className="mt-8">
              <Pulsante href="/contatti" variante="corallo">Organizza una visita</Pulsante>
            </div>
          </div>
          <Domande domande={FAQ_LOCAZIONE} chiuse />
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
