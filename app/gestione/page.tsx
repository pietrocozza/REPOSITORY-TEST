import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Piani from '@/components/sezioni/Piani'
import Servizi from '@/components/sezioni/Servizi'
import ComeLavoriamo from '@/components/sezioni/ComeLavoriamo'
import Partner from '@/components/sezioni/Partner'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import DaDovePartiamo from '@/components/sezioni/DaDovePartiamo'

export const metadata: Metadata = {
  alternates: { canonical: '/gestione' },
  title: 'Il nostro servizio di gestione',
  description: 'Gestione completa al 20% sull’affitto generato: annuncio, prezzi, ospiti, check-in, pulizie, manutenzione e burocrazia. Pensiamo a tutto noi.',
}

export default function Gestione() {
  return (
    <>
      <IntestazionePagina
        etichetta="Il nostro servizio di gestione"
        titolo="Dimenticati e *incassa.*"
        sottotitolo="Una sola formula, tutto incluso: una commissione in percentuale sull’affitto generato, e a tutto il resto pensiamo noi."
      />
      <section id="formula" aria-label="La formula di gestione" className="scroll-mt-24 bg-crema">
        <div className="contenitore pb-20 md:pb-28">
          <div className="mb-6">
            <DaDovePartiamo />
          </div>
          <Piani />
        </div>
      </section>
      <ComeLavoriamo />
      <Servizi />
      <Partner />
      <InvitoFinale />
    </>
  )
}
