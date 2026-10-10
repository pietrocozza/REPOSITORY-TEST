import type { Metadata } from 'next'
import PaginaTesto from '@/components/sezioni/PaginaTesto'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/cookie' },
  title: 'Cookie policy',
  description: 'Quali cookie usa il sito di Soluzione Affitto e come gestire il consenso.',
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
            'Il sito funziona senza cookie. Usiamo i cookie pubblicitari di Google Ads solo se li accetti dal banner: se rifiuti o non scegli, non viene installato nulla.',
          ],
        },
        {
          titolo: 'Cookie pubblicitari (solo con il tuo consenso)',
          testo: [
            'Google Ads, servizio di Google Ireland Ltd., usa i cookie per capire se una visita arrivata da un nostro annuncio si trasforma in un contatto (per esempio un messaggio su WhatsApp) e per mostrarti annunci pertinenti. Durata: fino a 13 mesi. Informativa di Google: policies.google.com/privacy.',
          ],
        },
        {
          titolo: 'Statistiche senza cookie',
          testo: [
            'Per contare le visite usiamo Vercel Web Analytics, che funziona senza cookie e senza salvare nulla sul tuo dispositivo: i dati sono aggregati e non permettono di identificarti.',
          ],
        },
        {
          titolo: 'Come cambiare idea',
          testo: [
            'Puoi cambiare la tua scelta in qualsiasi momento con il link “Preferenze cookie” in fondo a ogni pagina, oppure cancellando i dati del sito dal tuo browser. La scelta viene ricordata nel tuo browser.',
          ],
        },
        {
          titolo: 'Siti esterni',
          testo: [
            'Se dal sito apri WhatsApp, Google Maps, Airbnb, Booking o altri siti, saranno questi a gestire i loro cookie secondo le proprie regole.',
          ],
        },
        {
          titolo: 'Contatti',
          testo: [`Per domande scrivi a ${SITO.email}. Maggiori dettagli nell’informativa sulla privacy.`],
        },
      ]}
    />
  )
}
