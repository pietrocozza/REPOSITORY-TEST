import type { Metadata } from 'next'
import PaginaTesto from '@/components/sezioni/PaginaTesto'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/cookie' },
  title: 'Cookie policy',
  description: 'Il sito di Soluzione Affitto non usa cookie di profilazione né di terze parti.',
}

export default function Cookie() {
  return (
    <PaginaTesto
      etichetta="Cookie"
      titolo="Cookie *policy*"
      aggiornamento="10 ottobre 2026"
      sezioni={[
        {
          titolo: 'In breve',
          testo: [
            'Questo sito non usa cookie di profilazione, pubblicitari o di terze parti. Per questo non ti chiediamo il consenso con un banner.',
          ],
        },
        {
          titolo: 'Statistiche senza cookie',
          testo: [
            'Per sapere quante persone visitano le pagine usiamo Vercel Web Analytics, che funziona senza cookie e senza salvare nulla sul tuo dispositivo: i dati sono aggregati e non permettono di identificarti.',
          ],
        },
        {
          titolo: 'Siti esterni',
          testo: [
            'Se dal sito apri WhatsApp, Google Maps, Airbnb, Booking o altri siti, saranno questi a gestire i loro cookie secondo le proprie regole.',
          ],
        },
        {
          titolo: 'Se cambia qualcosa',
          testo: [
            `Se in futuro aggiungeremo strumenti che usano cookie (per esempio per la pubblicità), aggiorneremo questa pagina e ti chiederemo prima il consenso. Per domande scrivi a ${SITO.email}. Maggiori dettagli nell’informativa sulla privacy.`,
          ],
        },
      ]}
    />
  )
}
