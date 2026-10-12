import Etichetta from '@/components/ui/Etichetta'
import Pulsante from '@/components/ui/Pulsante'
import Rivela from '@/components/ui/Rivela'

const PERCORSI = [
  {
    domanda: 'Vuoi guadagnare con gli affitti brevi, senza pensieri?',
    risposta: 'Gestione completa: ospiti, pulizie, prezzi e burocrazia li seguiamo noi. Tu ricevi il netto ogni mese con il report.',
    pulsante: { testo: 'Calcola quanto rende', href: '#simulatore' },
    colore: 'bg-pesca',
  },
  {
    domanda: 'Casa da sistemare o inquilini che pagano in ritardo?',
    risposta: 'Ristruttura gratis: la rinnoviamo a spese nostre, bagni, cucina e arredi compresi, e ti paghiamo un affitto fisso ogni mese.',
    pulsante: { testo: 'Scopri come', href: '/ristruttura-gratis' },
    colore: 'bg-salvia',
  },
]

/** Due strade, scelte dal problema del proprietario: lo porta subito alla pagina giusta */
export default function DaDovePartiamo() {
  return (
    <section aria-labelledby="titolo-percorsi" className="bg-crema">
      <div className="contenitore py-16 md:py-20">
        <Etichetta className="mb-4 text-corallo">Comincia da qui</Etichetta>
        <h2 id="titolo-percorsi" className="font-display text-3xl font-bold tracking-tight md:text-5xl">
          Da dove <span className="italic text-corallo">partiamo?</span>
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {PERCORSI.map((p, i) => (
            <Rivela as="li" key={p.domanda} ritardo={i * 0.1} className={`flex flex-col justify-between gap-6 rounded-[2rem] p-6 md:p-8 ${p.colore}`}>
              <div>
                <p className="font-display text-2xl font-bold tracking-tight">{p.domanda}</p>
                <p className="mt-3 text-inchiostro/75">{p.risposta}</p>
              </div>
              <div>
                <Pulsante href={p.pulsante.href}>{p.pulsante.testo}</Pulsante>
              </div>
            </Rivela>
          ))}
        </ul>
        <p className="mt-5 text-sm text-pietra">Non tutte le case sono adatte: lo valutiamo insieme con un sopralluogo gratuito.</p>
      </div>
    </section>
  )
}
