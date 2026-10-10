import type { Metadata } from 'next'
import IntestazionePagina from '@/components/sezioni/IntestazionePagina'
import Piani from '@/components/sezioni/Piani'
import Servizi from '@/components/sezioni/Servizi'
import Partner from '@/components/sezioni/Partner'
import InvitoFinale from '@/components/sezioni/InvitoFinale'
import Etichetta from '@/components/ui/Etichetta'

export const metadata: Metadata = {
  alternates: { canonical: '/gestione' },
  title: 'Il nostro servizio di gestione',
  description: 'Gestione online base al 12% o gestione completa al 20% sull’affitto generato: annuncio, prezzi, ospiti, check-in, pulizie, manutenzione e burocrazia.',
}

export default function Gestione() {
  return (
    <>
      <IntestazionePagina
        etichetta="Il nostro servizio di gestione"
        titolo="Dimenticati e *incassa.*"
        sottotitolo="Due formule per affidarci il tuo appartamento: una commissione in percentuale sull’affitto generato, e a tutto il resto pensiamo noi."
        foto="/img/hero/don-bosco.jpg"
        altFoto="Suite Don Bosco, Roma"
      />
      <section aria-label="Piani" className="bg-crema">
        <div className="contenitore py-24 md:py-32">
          <Etichetta numero="01" className="mb-12 text-pietra">Piani e commissioni</Etichetta>
          <Piani />
        </div>
      </section>
      <Servizi />
      <Partner />
      <InvitoFinale />
    </>
  )
}
