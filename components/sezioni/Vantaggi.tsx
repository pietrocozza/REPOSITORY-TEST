import Etichetta from '@/components/ui/Etichetta'
import TestoDiviso from '@/components/ui/TestoDiviso'
import ListaConImmagine from '@/components/ui/ListaConImmagine'
import { VANTAGGI_BREVI } from '@/lib/contenuti'

export default function Vantaggi() {
  return (
    <section aria-labelledby="titolo-vantaggi" className="bg-crema">
      <div className="contenitore py-20 md:py-28">
        <Etichetta className="mb-6 text-corallo">Perché gli affitti brevi</Etichetta>
        <TestoDiviso as="h2" testo="Più guadagno, *zero pensieri.*" className="titolo-xl max-w-3xl" />
        <span id="titolo-vantaggi" className="sr-only">I vantaggi degli affitti brevi</span>
        <div className="mt-14 lg:mt-6">
          <ListaConImmagine voci={VANTAGGI_BREVI} />
        </div>
      </div>
    </section>
  )
}
