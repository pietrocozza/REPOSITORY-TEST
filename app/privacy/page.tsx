import type { Metadata } from 'next'
import PaginaTesto from '@/components/sezioni/PaginaTesto'
import { SITO } from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Informativa sulla privacy',
  description: 'Come Soluzione Affitto tratta i dati personali di chi visita il sito e ci contatta.',
}

export default function Privacy() {
  return (
    <PaginaTesto
      etichetta="Privacy"
      titolo="Informativa sulla *privacy*"
      aggiornamento="10 ottobre 2026"
      sezioni={[
        {
          titolo: 'Chi è il titolare del trattamento',
          testo: [
            `Soluzione Affitto, P.IVA ${SITO.piva}, con sede in ${SITO.sedi[0].indirizzo}. Per qualsiasi richiesta sui tuoi dati puoi scrivere a ${SITO.email}.`,
          ],
        },
        {
          titolo: 'Quali dati trattiamo',
          punti: [
            'Dati di navigazione: quando visiti il sito, il servizio di hosting (Vercel) registra dati tecnici come indirizzo IP, tipo di browser e pagine richieste, per far funzionare il sito e proteggerlo da abusi.',
            'Statistiche di visita: usiamo Vercel Web Analytics, che conta le visite in forma aggregata e anonima, senza cookie e senza identificarti.',
            'Dati che ci invii tu: nome, cognome, telefono, email, indirizzo e caratteristiche dell’immobile che inserisci nel simulatore o ci scrivi su WhatsApp, per email o al telefono.',
          ],
        },
        {
          titolo: 'Perché li trattiamo',
          punti: [
            'Per rispondere alle tue richieste e prepararti una valutazione o una proposta di gestione (misure precontrattuali richieste da te, art. 6.1.b GDPR).',
            'Per gestire il rapporto, se diventi nostro cliente (esecuzione del contratto, art. 6.1.b GDPR) e per gli obblighi di legge (art. 6.1.c GDPR).',
            'Per far funzionare il sito in sicurezza e capire, in forma anonima, quali pagine sono più utili (legittimo interesse, art. 6.1.f GDPR).',
          ],
          testo: ['Non usiamo i tuoi dati per profilazione e non li vendiamo a nessuno.'],
        },
        {
          titolo: 'Come ci arrivano i tuoi messaggi',
          testo: [
            'Il simulatore non salva i tuoi dati sul sito: prepara un messaggio che invii tu con WhatsApp (servizio di WhatsApp Ireland Ltd.) o con il tuo programma di posta. Li riceviamo sul nostro numero WhatsApp e sulla nostra casella email (Google Gmail).',
          ],
        },
        {
          titolo: 'Contenuti di altri siti',
          testo: [
            'Nella sezione recensioni le foto profilo degli autori vengono caricate dai server di Google e di Airbnb, che possono quindi ricevere il tuo indirizzo IP. I link a WhatsApp, Google Maps e ai portali portano a siti esterni con le loro informative.',
          ],
        },
        {
          titolo: 'Per quanto tempo li conserviamo',
          testo: [
            'Le richieste di contatto per il tempo necessario a risponderti e, se non diventi cliente, al massimo 24 mesi. I dati dei clienti per la durata del rapporto e poi per i tempi previsti dalle norme fiscali e civilistiche.',
          ],
        },
        {
          titolo: 'Chi può vederli',
          testo: [
            'Solo noi e i fornitori che ci aiutano a erogare il servizio (hosting, posta, messaggistica), che agiscono come responsabili del trattamento. Alcuni di questi fornitori possono trattare dati fuori dall’Unione europea, con le garanzie previste dal GDPR (decisioni di adeguatezza o clausole contrattuali standard).',
          ],
        },
        {
          titolo: 'I tuoi diritti',
          testo: [
            `Puoi chiederci in ogni momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne l’uso, opporti al trattamento o riceverli in un formato portabile (artt. 15–22 GDPR), scrivendo a ${SITO.email}. Se ritieni che il trattamento non sia corretto puoi presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).`,
          ],
        },
      ]}
    />
  )
}
