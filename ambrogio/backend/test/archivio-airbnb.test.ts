import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Database } from '../src/database/db.ts'
import { Airbnb } from '../src/integrazioni/airbnb.ts'
import { ArchivioAirbnb, incassiPerMese, pulisciDati, quantiOspiti, testoAvviso, tipoDaOggetto } from '../src/integrazioni/archivio-airbnb.ts'
import type { Gmail } from '../src/integrazioni/gmail.ts'

const recente = new Date().toISOString()
const vecchia = new Date(Date.now() - 60 * 86_400_000).toISOString()

// un Gmail finto con alcune email di Airbnb
function gmailFinto(email: { id: string; oggetto: string; data: string; testo: string }[]) {
  const aperte: string[] = []
  const g = {
    collegato: true,
    aperte,
    async elencoCompleto(_q: string, _max: number, salta: (id: string) => boolean) {
      return email.filter((e) => !salta(e.id)).map((e) => ({ id: e.id, thread: e.id, da: 'automated@airbnb.com', oggetto: e.oggetto, data: e.data, anteprima: '', nonLetta: true })).reverse()
    },
    async apri(id: string) {
      aperte.push(id)
      const e = email.find((x) => x.id === id)!
      return { id, thread: id, da: 'automated@airbnb.com', oggetto: e.oggetto, data: e.data, anteprima: '', nonLetta: true, a: '', messageId: '', testo: e.testo }
    },
  }
  return g as unknown as Gmail & { aperte: string[] }
}

test('email di Airbnb: tipo dall’oggetto, dati ripuliti, frasi per Pietro', () => {
  assert.equal(tipoDaOggetto('Prenotazione confermata - Mario Rossi arriva il 12 ott'), 'conferma')
  assert.equal(tipoDaOggetto('Prenotazione cancellata: HMABC12345'), 'cancellazione')
  assert.equal(tipoDaOggetto('RE: Prenotazione per Leonina, 12–15 ott'), 'messaggio')
  assert.equal(tipoDaOggetto('Mario ha lasciato una recensione'), 'recensione')
  assert.equal(tipoDaOggetto('Ti abbiamo inviato un pagamento di 320 €'), 'pagamento')
  assert.equal(tipoDaOggetto('Aggiorna le tue impostazioni'), 'altro')
  const d = pulisciDati({ codice: 'hm-abc12345', adulti: '2', bambini: 1, checkin: '2026-10-12', checkout: 'boh', guadagno: '320,50' })
  assert.equal(d.codice, 'HMABC12345')
  assert.equal(d.adulti, 2)
  assert.equal(d.checkout, null)
  assert.equal(d.guadagno, 320.5)
  assert.equal(quantiOspiti({ adulti: 2, bambini: 1, neonati: null, animali: 1 }), '3 ospiti (2 adulti, 1 bambino), con un animale')
  assert.equal(quantiOspiti({ adulti: 2, bambini: null, neonati: null, animali: null }), '2 ospiti')
  assert.equal(
    testoAvviso('conferma', { ospite: 'Mario', adulti: 2, annuncio: 'Leonina', checkin: '2026-10-12', checkout: '2026-10-15', guadagno: 320.5, valuta: 'EUR' }, ''),
    'Nuova prenotazione a Leonina: Mario, 2 ospiti dal lunedì 12 ottobre al giovedì 15 ottobre. Guadagno 321 euro.',
  )
})

test('archivio: legge da solo le email nuove, salva le prenotazioni e avvisa Pietro', async () => {
  const db = new Database(':memory:')
  const gmail = gmailFinto([
    { id: 'aaaaaa1', oggetto: 'Prenotazione confermata - Mario arriva il 12 ott', data: recente, testo: 'HMABC12345 Mario 2 adulti 1 bambino' },
    { id: 'aaaaaa2', oggetto: 'RE: Prenotazione per Leonina', data: recente, testo: 'A che ora possiamo entrare?' },
    { id: 'aaaaaa3', oggetto: 'Aggiorna le tue impostazioni', data: recente, testo: '' },
    { id: 'aaaaaa4', oggetto: 'Prenotazione confermata - Anna arriva il 1 set', data: vecchia, testo: 'HMOLD99999' },
    { id: 'aaaaaa5', oggetto: 'RE: vecchio messaggio', data: vecchia, testo: 'ciao' },
  ])
  const richieste: string[] = []
  const leggi = async (_istruzioni: string, testo: string) => {
    richieste.push(testo)
    if (testo.includes('HMABC12345')) return { codice: 'HMABC12345', annuncio: 'Leonina', ospite: 'Mario', adulti: 2, bambini: 1, checkin: '2026-10-12', checkout: '2026-10-15', guadagno: 320 }
    if (testo.includes('HMOLD99999')) return { codice: 'HMOLD99999', ospite: 'Anna', adulti: 1, checkin: '2026-09-01', checkout: '2026-09-03', guadagno: 150 }
    return { ospite: 'Mario', riassunto: 'Chiede a che ora può fare il check-in.' }
  }
  const archivio = new ArchivioAirbnb({ db, gmail, leggi, oggi: () => '2026-10-09', ora: () => 7 })
  await archivio.controlla()

  assert.equal(archivio.stato.errore, null)
  assert.equal(db.prenotazione('HMABC12345')?.adulti, 2)
  assert.equal(db.prenotazione('HMOLD99999')?.guadagno, 150, 'le prenotazioni vecchie entrano nell’archivio')
  assert.deepEqual(gmail.aperte.sort(), ['aaaaaa1', 'aaaaaa2', 'aaaaaa4'], 'le email inutili e i messaggi vecchi non si aprono neanche')
  const avvisi = db.avvisi().map((a) => a.testo)
  assert.deepEqual(avvisi, [
    'Nuova prenotazione a Leonina: Mario, 3 ospiti (2 adulti, 1 bambino) dal lunedì 12 ottobre al giovedì 15 ottobre. Guadagno 320 euro.',
    'Messaggio da Mario: Chiede a che ora può fare il check-in.',
  ])

  // al giro dopo non si rilegge niente
  await archivio.controlla()
  assert.equal(richieste.length, 3)
  assert.equal(db.avvisi().length, 2)

  // una cancellazione aggiorna la prenotazione
  const mesi = incassiPerMese(db.prenotazioniArchiviate())
  assert.deepEqual(mesi.map((m) => [m.mese, m.guadagno, m.notti, m.prezzoMedio]), [
    ['2026-09', 150, 2, 75],
    ['2026-10', 320, 3, 107],
  ])
  db.salvaPrenotazione({ codice: 'HMABC12345', stato: 'cancellata' })
  assert.equal(db.prenotazione('HMABC12345')?.ospite, 'Mario', 'i dati vecchi restano')
  assert.equal(incassiPerMese(db.prenotazioniArchiviate()).length, 1)
})

test('promemoria: la mattina chi arriva oggi, la sera chi arriva domani (una volta sola)', async () => {
  const db = new Database(':memory:')
  const ical = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'DTSTART;VALUE=DATE:20261012',
    'DTEND;VALUE=DATE:20261015',
    'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC12345',
    'SUMMARY:Reserved',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const airbnb = new Airbnb([{ numero: 1, nome: 'Leonina', ical: 'x' }], async () => ical)
  db.salvaPrenotazione({ codice: 'HMABC12345', ospite: 'Mario', adulti: 2 })
  let ora = 19
  const archivio = new ArchivioAirbnb({ db, gmail: gmailFinto([]), airbnb, oggi: () => '2026-10-11', ora: () => ora })
  await archivio.controlla()
  await archivio.controlla()
  assert.deepEqual(db.avvisi().map((a) => a.testo), ['Domani arriva Mario, 2 ospiti a Leonina per 3 notti.'])
  ora = 7
  const presto = new ArchivioAirbnb({ db, gmail: gmailFinto([]), airbnb, oggi: () => '2026-10-12', ora: () => ora })
  await presto.controlla()
  assert.equal(db.avvisi().length, 1, 'prima delle 8 niente')
  ora = 9
  await presto.controlla()
  assert.equal(db.avvisi().at(-1)?.testo, 'Oggi arriva Mario, 2 ospiti a Leonina per 3 notti.')
})

test('annunci esclusi: mai nell’archivio né negli avvisi', async () => {
  const db = new Database(':memory:')
  const gmail = gmailFinto([{ id: 'bbbbbb1', oggetto: 'Prenotazione confermata - Luca arriva il 12 ott', data: recente, testo: 'HMGIU12345' }])
  const leggi = async () => ({ codice: 'HMGIU12345', annuncio: 'Suite Don Bosco [METRO Giulio Agricola]', ospite: 'Luca', adulti: 2, guadagno: 300 })
  const archivio = new ArchivioAirbnb({ db, gmail, leggi, oggi: () => '2026-10-09', ora: () => 7, escludi: ['GIULIO AGRICOLA', 'Don Bosco'] })
  await archivio.controlla()
  assert.equal(db.prenotazione('HMGIU12345'), undefined)
  assert.equal(db.avvisi().length, 0)
  assert.equal(db.emailLetta('bbbbbb1'), true, 'non si rilegge')
})
