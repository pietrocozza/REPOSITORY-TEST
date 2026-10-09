import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { Airbnb, leggiIcal, riassumiCalendario, schedaCasa } from '../src/integrazioni/airbnb.ts'
import { STRUMENTI, servizi } from '../src/strumenti/catalogo.ts'
import { Database } from '../src/database/db.ts'

// com'è fatto il calendario esportato da Airbnb
const ICAL = [
  'BEGIN:VCALENDAR',
  'PRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261015',
  'DTSTART;VALUE=DATE:20261012',
  'UID:1418fb94e984-abc@airbnb.com',
  'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABC12345\\nPhone Number (Last 4 Digits): 4321',
  'SUMMARY:Reserved',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261022',
  'DTSTART;VALUE=DATE:20261020',
  'UID:7f3d-def@airbnb.com',
  'SUMMARY:Airbnb (Not available)',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20261009',
  'DTSTART;VALUE=DATE:20261006',
  'DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/de',
  ' tails/HMOLD99999',
  'SUMMARY:Reserved',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n')

test('calendario Airbnb: prenotazioni, blocchi, codici, righe spezzate', () => {
  const p = leggiIcal(ICAL)
  assert.equal(p.length, 3)
  assert.deepEqual(p[0], { inizio: '2026-10-06', fine: '2026-10-09', notti: 3, tipo: 'prenotazione', codice: 'HMOLD99999', telefono4: undefined })
  assert.equal(p[1].codice, 'HMABC12345')
  assert.equal(p[1].telefono4, '4321')
  assert.equal(p[2].tipo, 'blocco')
  const r = riassumiCalendario('Trastevere', p, '2026-10-08', 20)
  assert.match(r, /OSPITE IN CASA ORA/)
  assert.match(r, /arrivo 2026-10-12, partenza 2026-10-15 \(3 notti\), codice HMABC12345/)
  assert.match(r, /2026-10-09 → 2026-10-12 \(3 notti\)/)
  assert.match(r, /occupazione 30%/)
})

test('strumenti: prenotazioni dal link del calendario, scheda della casa da riempire', async () => {
  const dati = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-airbnb-'))
  servizi.cartellaDati = dati
  servizi.airbnb = new Airbnb([{ numero: 1, nome: 'Trastevere', ical: 'https://www.airbnb.it/calendar/ical/1.ics?s=x' }], async () => ICAL)
  const prenotazioni = STRUMENTI.find((s) => s.nome === 'prenotazioni')!
  const db = new Database(':memory:')
  assert.match(await prenotazioni.esegui({ giorni: 365 }, db), /Trastevere: prossimi 365 giorni/)
  // quello che Ambrogio ha ricavato dalle email si aggiunge alla prenotazione del calendario
  db.salvaPrenotazione({ codice: 'HMABC12345', ospite: 'Mario', adulti: 2, bambini: 1, guadagno: 320.5 })
  assert.match(await prenotazioni.esegui({ giorni: 365 }, db), /codice HMABC12345, telefono …4321, ospite Mario, 3 ospiti \(2 adulti, 1 bambino\), guadagno 321 euro/)
  const info = STRUMENTI.find((s) => s.nome === 'info_casa')!
  assert.match(String(info.esegui({}, {} as never)), /non è ancora compilata/)
  const file = path.join(dati, 'case', 'casa-1.txt')
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('NOME DELLA CASA:', 'NOME DELLA CASA: Trastevere Charme'))
  assert.equal(schedaCasa(dati, 1).compilata, true)
  assert.match(String(info.esegui({}, {} as never)), /Trastevere Charme/)
  servizi.airbnb = undefined
})

test('domande sul calendario: risposta immediata, senza Claude', async () => {
  const { rispostaCalendario } = await import('../src/integrazioni/airbnb.ts')
  const a = new Airbnb([{ numero: 1, nome: 'Trastevere', ical: 'x' }], async () => ICAL)
  const oggi = '2026-10-08'
  const sett = await rispostaCalendario('Chi arriva questa settimana?', a, oggi)
  assert.doesNotMatch(sett ?? '', /In questo momento|Occupazione/, 'solo quello che è chiesto')
  assert.match((await rispostaCalendario("c'è un ospite adesso?", a, oggi)) ?? '', /In questo momento a Trastevere c'è un ospite, che parte venerdì 9 ottobre/)
  assert.equal(await rispostaCalendario('quando arriva la prossima prenotazione?', a, oggi), 'La prossima prenotazione a Trastevere arriva lunedì 12 ottobre, per 3 notti.')
  assert.equal(await rispostaCalendario('quanti ospiti ci sono nella prossima prenotazione?', a, oggi), null, 'il numero di ospiti è nelle email: Claude')
  const db = new Database(':memory:')
  db.salvaPrenotazione({ codice: 'HMABC12345', ospite: 'Mario', adulti: 2, bambini: 1 })
  assert.equal(
    await rispostaCalendario('quanti ospiti ci sono nella prossima prenotazione?', a, oggi, (c) => db.prenotazione(c)),
    'A Trastevere arriva lunedì 12 ottobre Mario, 3 ospiti (2 adulti, 1 bambino), per 3 notti.',
    'già archiviato dalle email: risposta immediata',
  )
  assert.match(sett ?? '', /Arriva un ospite nei prossimi 7 giorni: lunedì 12 ottobre per 3 notti/)
  assert.match((await rispostaCalendario('quanto sono occupato a novembre?', a, oggi)) ?? '', /A novembre non arriva nessuno.*Occupazione 0 per cento/s)
  assert.match((await rispostaCalendario('chi parte domani', a, oggi)) ?? '', /Partenze domani: venerdì 9 ottobre/)
  assert.equal(await rispostaCalendario('che prezzo mi consigli per i giorni liberi?', a, oggi), null, 'i prezzi li ragiona Claude')
  assert.equal(await rispostaCalendario('che tempo fa domani?', a, oggi), null)
  assert.match((await rispostaCalendario('chi arriva?', undefined, oggi)) ?? '', /non è ancora collegato.*AMBROGIO_AIRBNB_CASA_1_ICAL/, 'Airbnb non collegato: lo dice subito')
})
