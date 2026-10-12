import type { Metadata } from 'next'
import Image from 'next/image'
import IntestazioneStoria from '@/components/storia/IntestazioneStoria'
import PrimaDopo from '@/components/sezioni/PrimaDopo'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import PropostaImmobile from '@/components/sezioni/PropostaImmobile'
import Domande from '@/components/ui/Domande'
import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Pulsante from '@/components/ui/Pulsante'
import Icona from '@/components/ui/Icona'
import { CANTIERI_BREVI, FAQ_LOCAZIONE, LAVORI_RISTRUTTURAZIONE, VANTAGGI_LOCAZIONE_BREVI } from '@/lib/contenuti'

export const metadata: Metadata = {
  alternates: { canonical: '/ristruttura-gratis' },
  title: 'Ristruttura gratis',
  description:
    'Hai una casa a Roma in zona centrale da ristrutturare? La rinnoviamo a nostre spese, la prendiamo in locazione a lungo termine e ti paghiamo l’affitto in anticipo.',
}


export default function RistrutturaGratis() {
  return (
    <>
      <IntestazioneStoria />

      {/* I lavori che facciamo */}
      <section id="lavori" aria-labelledby="titolo-lavori" className="scroll-mt-24 bg-crema">
        <div className="contenitore grid gap-12 pt-12 pb-20 md:py-28 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Etichetta className="mb-6 text-corallo">I lavori</Etichetta>
            <h2 id="titolo-lavori" className="titolo-xl">
              Cosa rifacciamo, <span className="italic text-corallo">a spese nostre.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-pietra">Seguiamo noi tutto il cantiere, con un designer. Tu non anticipi nulla e non cerchi nessuna ditta.</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {LAVORI_RISTRUTTURAZIONE.map((l) => (
                <li key={l.titolo} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-pesca text-corallo">
                    <Icona nome={l.icona} className="size-5" />
                  </span>
                  <span>
                    <span className="block font-display text-lg leading-tight font-bold tracking-tight">{l.titolo}</span>
                    <span className="text-sm text-pietra">{l.testo}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Rivela>
            <PrimaDopo prima="/img/ristrutturazione/leonina-prima-ricostruzione.jpg" dopo="/img/ristrutturazione/leonina-dopo.jpg" alt="Camera in Via Leonina" />
            <p className="mt-3 text-xs text-pietra">Via Leonina, prima e dopo: trascina per confrontare. Il “prima” è una ricostruzione illustrativa dello stato iniziale.</p>
          </Rivela>
        </div>
      </section>

      {/* Prove */}
      <section aria-labelledby="titolo-prove" className="overflow-hidden bg-pesca">
        <div className="contenitore grid gap-12 py-20 md:py-28 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Etichetta className="mb-6 text-corallo">Chi ci ha già scelto</Etichetta>
            <h2 id="titolo-prove" className="titolo-xl">
              Lo dicono <span className="italic text-corallo">i proprietari.</span>
            </h2>
            <p className="mt-5 max-w-md text-inchiostro/75">Dopo più di un anno, Leonardo ci ha scritto una referenza.</p>
            <p className="mt-8 text-sm font-bold">Alcuni nostri progetti</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {Object.keys(CANTIERI_BREVI).map((c) => (
                <li key={c} className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <Rivela className="mx-auto w-full max-w-md rotate-[-3deg] rounded-3xl bg-white p-4 shadow-[0_40px_80px_-30px_rgba(29,34,54,0.45)] transition-transform duration-700 ease-lusso hover:rotate-0">
            <Image
              src="/img/ristrutturazione/referenza-leonardo.png"
              alt="Lettera di referenza firmata dal proprietario dell’immobile di Via Leonina"
              width={716}
              height={624}
              className="h-auto w-full rounded-2xl"
            />
          </Rivela>
        </div>
      </section>

      {/* Vantaggi in pillole */}
      <section aria-labelledby="titolo-guadagni" className="bg-corallo text-white">
        <div className="contenitore py-20 md:py-28">
          <Etichetta className="mb-6 text-white/80">Cosa ci guadagni</Etichetta>
          <TestoDiviso as="h2" testo="Meglio del *classico inquilino.*" className="titolo-xl" accento="text-sole" />
          <span id="titolo-guadagni" className="sr-only">
            Cosa ci guadagni
          </span>
          <ul className="mt-12 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {VANTAGGI_LOCAZIONE_BREVI.map((v, i) => (
              <Rivela as="li" key={v.titolo} ritardo={(i % 4) * 0.08} className="group rounded-3xl bg-white/[0.12] p-5 transition-colors duration-500 hover:bg-white/[0.2] md:p-6">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-sole text-inchiostro transition-transform duration-500 group-hover:rotate-[-8deg]">
                  <Icona nome={v.icona} className="size-6" />
                </span>
                <h3 className="mt-6 font-display text-[clamp(1rem,4.4vw,1.25rem)] font-bold tracking-tight break-words hyphens-auto">{v.titolo}</h3>
                <p className="mt-1.5 text-sm text-white/80">{v.testo}</p>
              </Rivela>
            ))}
          </ul>
        </div>
      </section>

      {/* Proponi la tua casa */}
      <section id="proponi" aria-labelledby="titolo-proponi" className="scroll-mt-24 bg-sabbia">
        <div className="contenitore grid gap-10 py-20 md:py-28 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div>
            <Etichetta className="mb-6 text-corallo">Proponi la tua casa</Etichetta>
            <h2 id="titolo-proponi" className="titolo-xl">
              Hai una casa da <span className="italic text-corallo">sistemare?</span>
            </h2>
            <p className="mt-6 max-w-md text-lg text-pietra">
              Raccontaci com’è in un minuto. Non tutte le case sono adatte agli affitti brevi: lo valutiamo insieme, poi organizziamo un sopralluogo gratuito.
            </p>
          </div>
          <PropostaImmobile />
        </div>
      </section>

      {/* Domande */}
      <section aria-labelledby="titolo-faq-locazione" className="bg-crema">
        <div className="contenitore grid gap-10 py-20 md:py-28 lg:grid-cols-[1fr_2fr]">
          <div>
            <TestoDiviso as="h2" testo="Hai *dubbi?*" className="titolo-xl" />
            <span id="titolo-faq-locazione" className="sr-only">
              Domande frequenti sulla locazione
            </span>
            <div className="mt-8">
              <Pulsante href="/contatti" variante="corallo">
                Organizza una visita
              </Pulsante>
            </div>
          </div>
          <Domande domande={FAQ_LOCAZIONE} chiuse />
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
