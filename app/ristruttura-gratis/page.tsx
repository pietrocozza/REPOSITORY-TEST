import type { Metadata } from 'next'
import Image from 'next/image'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import PrimaDopo from '@/components/sezioni/PrimaDopo'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Domande from '@/components/ui/Domande'
import Etichetta from '@/components/ui/Etichetta'
import Rivela from '@/components/ui/Rivela'
import TestoDiviso from '@/components/ui/TestoDiviso'
import Contatore from '@/components/ui/Contatore'
import Pulsante from '@/components/ui/Pulsante'
import ImmagineParallasse from '@/components/ui/ImmagineParallasse'
import { FAQ_LOCAZIONE, TESTIMONIANZE_PROPRIETARI, VANTAGGI_LOCAZIONE } from '@/lib/contenuti'

export const metadata: Metadata = {
  title: 'Ristruttura gratis',
  description:
    'Hai una casa a Roma in zona centrale da ristrutturare? La rinnoviamo a nostre spese, la prendiamo in locazione a lungo termine e ti paghiamo l’affitto in anticipo.',
}

export default function RistrutturaGratis() {
  return (
    <>
      <IntestazionePagina
        etichetta="Ristruttura gratis"
        titolo="“E se la facessi *io* la ristrutturazione?”"
        sottotitolo="Così nasce l’idea della ristrutturazione gratuita: una storia vera, nel Rione Monti."
        foto="/img/ristrutturazione/leonina-dopo.jpg"
        altFoto="La camera di Via Leonina dopo la ristrutturazione"
      />

      {/* La storia */}
      <section aria-labelledby="titolo-storia" className="bg-avorio">
        <div className="contenitore grid gap-14 py-24 md:py-32 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Etichetta numero="01" className="mb-8 text-pietra">La storia</Etichetta>
            <h2 id="titolo-storia" className="titolo-lg">
              Via Leonina, <span className="italic text-terracotta">ottobre 2023.</span>
            </h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-pietra">
            <Rivela>
              <p>
                A ottobre del 2023 ho incontrato per la prima volta <strong className="text-inchiostro">Leonardo S.</strong> in occasione della visita di un appartamento a
                Monti, in Via Leonina, nel centro storico di Roma. Si trovava in una palazzina caratteristica del XV secolo, quindi con i vincoli tipici di un edificio
                storico.
              </p>
            </Rivela>
            <Rivela>
              <p>
                L’immobile non era in buono stato: era rimasto fermo per tanti anni, anche a causa di una precedente esperienza con inquilini morosi che lo aveva
                scoraggiato dal rimetterlo sul mercato. Impianti obsoleti, un bagno che non veniva toccato dagli anni ’60, arredi lasciati lì più per inerzia che per
                scelta. Aveva luce, soffitti alti e una metratura importante, ma nessuno aveva più avuto voglia di investirci tempo e denaro.
              </p>
            </Rivela>
            <Rivela>
              <blockquote className="border-l-2 border-terracotta py-2 pl-6 font-display text-3xl leading-snug text-inchiostro md:text-4xl">
                “Lo so che andrebbe sistemato, ma solo a pensarci mi passa la voglia.”
              </blockquote>
            </Rivela>
            <Rivela>
              <p>
                Lo capivo, e quasi d’istinto gli ho risposto: <em className="text-inchiostro">“E se la facessi io la ristrutturazione?”</em>
              </p>
            </Rivela>
            <Rivela>
              <p>
                Da lì abbiamo costruito un accordo. Ho preso l’appartamento in affitto a lungo termine e, poiché l’investimento per i lavori sarebbe stato interamente a
                mio carico, Leonardo mi ha concesso un mese iniziale senza canone per permettermi di intervenire.
              </p>
            </Rivela>
            <Rivela>
              <p>
                In quel periodo abbiamo <strong className="text-inchiostro">rifatto completamente il bagno, tinteggiato l’intero immobile, installato l’aria condizionata</strong> che
                prima non c’era, sostituito l’arredo e curato ogni dettaglio per dare alla casa una personalità, una vera e propria anima, senza snaturarne il carattere
                storico.
              </p>
            </Rivela>
          </div>
        </div>

        <div className="contenitore pb-24 md:pb-32">
          <Rivela>
            <PrimaDopo prima="/img/ristrutturazione/leonina-prima.jpg" dopo="/img/ristrutturazione/leonina-dopo.jpg" alt="Camera in Via Leonina" />
          </Rivela>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <Rivela className="text-lg leading-relaxed text-pietra">
              <p>Alla fine dei lavori l’immobile era lo stesso, ma la percezione era completamente diversa.</p>
              <p className="mt-4">
                Leonardo si è ritrovato con una casa più bella e con un valore aumentato, <strong className="text-inchiostro">senza aver anticipato un euro</strong> e senza dover
                gestire operai o pratiche.
              </p>
            </Rivela>
            <Rivela className="text-lg leading-relaxed text-pietra" ritardo={0.1}>
              <p>
                Oggi riceve un canone mensile costante, ha un conduttore stabile e professionale che utilizza l’appartamento come strumento di lavoro e lo mantiene con
                attenzione, ma soprattutto non vive più con il timore di trovarsi di nuovo un inquilino moroso.
              </p>
            </Rivela>
          </div>
        </div>
      </section>

      {/* L'idea */}
      <section className="bg-notte text-avorio">
        <div className="contenitore grid gap-14 py-24 md:py-36 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Etichetta numero="02" className="mb-8 text-nebbia">L’idea</Etichetta>
            <TestoDiviso as="h2" testo="Così nasce la *ristrutturazione gratuita.*" className="titolo-xl" accento="text-terracotta-chiara" />
            <div className="mt-10 space-y-5 text-lg text-avorio/80">
              <Rivela>
                <p>Aiutiamo proprietari come Leonardo S. a ridare valore alle loro proprietà investendo direttamente sull’immobile.</p>
              </Rivela>
              <Rivela>
                <p>Lo prendiamo in locazione a lungo termine e lo destiniamo a ospitare la nostra clientela internazionale. La casa viene mantenuta con cura e viene trattata come uno strumento di lavoro.</p>
              </Rivela>
              <Rivela>
                <p>L’obiettivo è costruire una relazione solida: quando l’immobile è valorizzato, il canone è regolare e la gestione è seria, non c’è motivo di cambiare.</p>
              </Rivela>
            </div>
          </div>
          <ImmagineParallasse src="/img/ristrutturazione/cucina-tre-fasi.jpg" alt="Una cucina in tre fasi: prima, durante e dopo i lavori" className="aspect-[16/10] rounded-sm" />
        </div>
      </section>

      {/* La referenza */}
      <section className="bg-carta">
        <div className="contenitore grid gap-12 py-24 md:py-32 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Etichetta numero="03" className="mb-8 text-pietra">La referenza</Etichetta>
            <TestoDiviso as="h2" testo="Dopo più di un anno, *nero su bianco.*" className="titolo-lg" />
            <Rivela className="mt-8 max-w-lg text-lg text-pietra">
              <p>Dopo più di un anno di collaborazione ho chiesto a Leonardo una referenza scritta. Qualche mese dopo… abbiamo fatto lo stesso con la casa di Riccardo!</p>
            </Rivela>
          </div>
          <Rivela className="rotate-[-1.5deg] rounded-sm bg-white p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] transition-transform duration-700 ease-lusso hover:rotate-0">
            <Image src="/img/ristrutturazione/referenza-leonardo.png" alt="Lettera di referenza firmata dal proprietario dell’immobile di Via Leonina" width={716} height={624} className="h-auto w-full" />
          </Rivela>
        </div>
      </section>

      {/* Cosa ci guadagni */}
      <section aria-labelledby="titolo-guadagni" className="bg-avorio">
        <div className="contenitore py-24 md:py-36">
          <Etichetta numero="04" className="mb-8 text-pietra">Cosa ci guadagni</Etichetta>
          <TestoDiviso as="h2" testo="Perché siamo diversi dal *classico inquilino.*" className="titolo-xl max-w-5xl" />
          <span id="titolo-guadagni" className="sr-only">Cosa ci guadagni</span>
          <ul className="mt-16 grid gap-px overflow-hidden rounded-sm border border-linea bg-linea sm:grid-cols-2 lg:grid-cols-4">
            {VANTAGGI_LOCAZIONE.map((v, i) => (
              <Rivela as="li" key={v.titolo} ritardo={(i % 4) * 0.07} className="flex flex-col bg-avorio p-7 md:p-8">
                <span className="font-display text-sm text-terracotta italic">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-6 font-display text-2xl leading-tight first-letter:uppercase md:text-[1.7rem]">{v.titolo}</h3>
                <p className="mt-4 text-sm leading-relaxed text-pietra">{v.testo}</p>
              </Rivela>
            ))}
          </ul>
          <Rivela className="mt-16 grid gap-8 rounded-sm bg-carta p-8 md:grid-cols-[1fr_1.4fr] md:p-14">
            <p className="font-display text-4xl leading-tight md:text-5xl">
              È esattamente come sembra, <span className="italic text-terracotta">nessuna sorpresa.</span>
            </p>
            <div className="space-y-4 text-pietra">
              <p>Affittare un immobile a professionisti del settore extralberghiero è più conveniente per i proprietari, rispetto al classico inquilino, sotto ogni aspetto.</p>
              <p>
                Per i proprietari che vogliono sicurezza e tranquillità, Soluzione Affitto offre un affitto garantito e il rispetto delle regole di condominio, assicurando
                zero preoccupazioni legate alla locazione. Con noi non dovrai più preoccuparti di problemi di affitto né di lasciare l’immobile sfitto e improduttivo.
              </p>
            </div>
          </Rivela>
        </div>
      </section>

      {/* Risultati e testimonianze */}
      <section aria-labelledby="titolo-risultati" className="bg-notte text-avorio">
        <div className="contenitore py-24 md:py-36">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <Etichetta numero="05" className="mb-8 text-nebbia">I nostri risultati</Etichetta>
              <TestoDiviso as="h2" testo="I risultati *parlano da soli.*" className="titolo-xl" accento="text-terracotta-chiara" />
              <span id="titolo-risultati" className="sr-only">Testimonianze dei proprietari</span>
            </div>
            <div className="lg:justify-self-end lg:text-right">
              <p className="font-display text-[clamp(5rem,14vw,11rem)] leading-[0.8] text-terracotta-chiara">
                <Contatore a={23} prefisso="+" />
              </p>
              <p className="etichetta mt-4 text-nebbia">Proprietari soddisfatti · Testimonianze reali</p>
            </div>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-sm bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIANZE_PROPRIETARI.map((t, i) => (
              <Rivela key={t.nome} ritardo={(i % 3) * 0.08} className="flex flex-col justify-between bg-notte p-8 md:p-10">
                <blockquote className="font-display text-xl leading-snug md:text-2xl">“{t.testo}”</blockquote>
                <p className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-sm">
                  <span className="font-semibold capitalize">{t.nome}</span>
                  <span className="etichetta text-nebbia">{t.citta}</span>
                </p>
              </Rivela>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ locazione */}
      <section aria-labelledby="titolo-faq-locazione" className="bg-avorio">
        <div className="contenitore grid gap-12 py-24 md:py-36 lg:grid-cols-[1fr_2.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Etichetta numero="06" className="mb-8 text-pietra">FAQ</Etichetta>
            <h2 id="titolo-faq-locazione" className="titolo-lg">
              Le tue <span className="italic text-terracotta">domande.</span>
            </h2>
          </div>
          <Domande domande={FAQ_LOCAZIONE} />
        </div>
      </section>

      <section className="bg-carta">
        <div className="contenitore flex flex-col items-start gap-10 py-24 md:flex-row md:items-end md:justify-between md:py-28">
          <TestoDiviso
            as="p"
            testo="Hai una casa nella Città Eterna, in zona centrale, che necessita di una *ristrutturazione?*"
            className="max-w-3xl font-display text-4xl leading-tight md:text-5xl"
          />
          <Pulsante href="/contatti">Organizza una visita</Pulsante>
        </div>
      </section>

      <InvitoFinale />
    </>
  )
}
