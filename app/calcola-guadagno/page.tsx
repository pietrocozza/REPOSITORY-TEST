import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Simulatore from '@/components/sezioni/Simulatore'
import Calcolatore from '@/components/sezioni/Calcolatore'

export const metadata: Metadata = {
  alternates: { canonical: '/calcola-guadagno' },
  title: 'Simulatore di guadagno online',
  description: 'Scopri quanto incassano con gli affitti brevi le case come la tua, zona per zona, a Roma e Milano.',
}

export default function CalcolaGuadagno() {
  return (
    <>
      <IntestazionePagina
        etichetta="Simulatore di guadagno online"
        titolo="Quanto può *rendere* la tua casa?"
        sottotitolo="Scegli zona e camere: ti mostriamo subito quanto incassano le case come la tua."
      />
      <section className="bg-crema">
        <div className="contenitore pb-24">
          <Simulatore />
        </div>
      </section>
      <section id="richiesta" className="scroll-mt-24 bg-sabbia">
        <div className="contenitore py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="titolo-xl mb-10">
              Vuoi la stima <span className="italic text-corallo">precisa?</span>
            </h2>
            <Calcolatore />
          </div>
        </div>
      </section>
    </>
  )
}
