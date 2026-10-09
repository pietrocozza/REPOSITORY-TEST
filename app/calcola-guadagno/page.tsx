import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Calcolatore from '@/components/sezioni/Calcolatore'

export const metadata: Metadata = {
  title: 'Simulatore di guadagno online',
  description: 'Scopri quanto potresti guadagnare trasformando il tuo appartamento a Roma o Milano in una struttura ricettiva.',
}

export default function CalcolaGuadagno() {
  return (
    <>
      <IntestazionePagina
        etichetta="Simulatore di guadagno online"
        titolo="Quanto può *rendere* la tua casa?"
        sottotitolo="Rispondi a poche domande sul tuo appartamento: ti ricontattiamo con la stima del guadagno con gli affitti brevi."
      />
      <section className="bg-avorio">
        <div className="contenitore pb-28">
          <div className="mx-auto max-w-5xl">
            <Calcolatore />
          </div>
        </div>
      </section>
    </>
  )
}
