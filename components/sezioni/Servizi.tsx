import Nastro from '@/components/ui/Nastro'
import { SERVIZI_BREVI } from '@/lib/contenuti'

/** I servizi in una fascia che scorre, come quella sotto la hero: si leggono senza fermarsi */
export default function Servizi() {
  return (
    <section aria-label="I nostri servizi: tu ricevi solo i profitti">
      <Nastro voci={['Tu ricevi solo i profitti', ...SERVIZI_BREVI.map((s) => s.titolo)]} className="bg-sole text-inchiostro" />
    </section>
  )
}
