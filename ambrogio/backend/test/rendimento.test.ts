import assert from 'node:assert/strict'
import { test } from 'node:test'
import { importo, leggiCsv, leggiGuadagni } from '../src/integrazioni/guadagni-airbnb.ts'
import { dataSpesa, fisseDelMese, leggiRigheFisse, leggiRigheSpese, meseSpesa, rendimentoPerMese, SPESE_FISSE_INIZIALI } from '../src/integrazioni/spese.ts'
import { incassiPerMese } from '../src/integrazioni/archivio-airbnb.ts'
import { Database } from '../src/database/db.ts'

// com'è il file dei guadagni di Airbnb (account in inglese: date mese/giorno/anno)
const CSV_INGLESE = [
  'Date,Arriving by date,Type,Confirmation Code,Booking date,Start date,End date,Nights,Guest,Listing,Details,Reference code,Currency,Amount,Paid out,Service fee,Fast Pay Fee,Cleaning fee,Gross earnings,Occupancy taxes,Earnings year',
  '10/13/2026,10/14/2026,Payout,,,,,,,,"Transfer to IBAN 1234",,EUR,,"1,050.00",,,,,,',
  '10/13/2026,,Reservation,HMABC12345,09/01/2026,10/12/2026,10/15/2026,3,Mario Rossi,Leonina,,,EUR,"320.50",,10.50,,60.00,331.00,,2026',
  '10/20/2026,,Reservation,HMDEF67890,09/20/2026,10/19/2026,10/25/2026,6,Anna Bianchi,Leonina,,,EUR,729.50,,22.50,,60.00,752.00,,2026',
  '10/21/2026,,Adjustment,HMDEF67890,,,,,,Leonina,Rimborso,,EUR,-20.00,,,,,,,2026',
].join('\n')

// account in italiano: punto e virgola, virgola dei decimali, giorno/mese/anno
const CSV_ITALIANO = [
  'Data;Tipo;Codice di conferma;Data di inizio;Data di fine;Notti;Ospite;Annuncio;Valuta;Importo;Costi di pulizia;Guadagni lordi',
  '02/09/2026;Prenotazione;HMOLD99999;01/09/2026;03/09/2026;2;Luca;Leonina;EUR;150,00;40,00;160,00',
  '05/09/2026;Pagamento;;;;;;;EUR;;;',
].join('\r\n')

test('file dei guadagni di Airbnb: inglese e italiano, solo le prenotazioni', () => {
  assert.equal(importo('1.234,56'), 1234.56)
  assert.equal(importo('1,234.56'), 1234.56)
  assert.equal(importo('€ -20'), -20)
  assert.equal(leggiCsv('a,"b, c","d ""e"""\n1,2,3')[0][2], 'd "e"')

  const en = leggiGuadagni(CSV_INGLESE)
  assert.deepEqual(
    en.map((r) => [r.codice, r.checkin, r.checkout, r.notti, r.guadagno, r.ospite]),
    [
      ['HMABC12345', '2026-10-12', '2026-10-15', 3, 320.5, 'Mario Rossi'],
      ['HMDEF67890', '2026-10-19', '2026-10-25', 6, 729.5, 'Anna Bianchi'],
    ],
  )
  const it = leggiGuadagni(CSV_ITALIANO)
  assert.deepEqual(it.map((r) => [r.codice, r.checkin, r.checkout, r.guadagno, r.pulizie]), [['HMOLD99999', '2026-09-01', '2026-09-03', 150, 40]])
  assert.throws(() => leggiGuadagni('Nome,Cognome\nMario,Rossi'), /non sembra quello dei guadagni/)
})

test('foglio delle spese: date, mesi, spese fisse valide nel mese', () => {
  assert.equal(dataSpesa('12/10/2026'), '2026-10-12')
  assert.equal(dataSpesa(46307), '2026-10-12', 'numero di serie di Fogli')
  assert.equal(meseSpesa('ottobre 2026'), '2026-10')
  assert.equal(meseSpesa('3/2026'), '2026-03')
  assert.equal(meseSpesa(''), null)
  const spese = leggiRigheSpese([
    ['05/10/2026', 'Bolletta luce', 'Bollette', 85.5, 'Leonina'],
    ['07/10/2026', 'Pulizie Mario', 'Pulizie', '40,00', ''],
    ['', 'riga vuota', '', '', ''],
  ])
  assert.equal(spese.length, 2)
  assert.equal(spese[1].importo, 40)
  const fisse = leggiRigheFisse([
    ['Affitto', 1400, '', ''],
    ['Spese condominiali', 75, '', ''],
    ['Internet', 30, '2026-10', ''],
  ])
  assert.deepEqual(fisseDelMese(fisse, '2026-09').map((f) => f.voce), ['Affitto', 'Spese condominiali'])
  assert.equal(fisseDelMese(fisse, '2026-10').length, 3)
  assert.deepEqual(SPESE_FISSE_INIZIALI.map((f) => f.importo), [1400, 75])
})

test('rendimento: incassi meno affitto, condominio e spese, con occupazione, ADR e RevPAR', () => {
  const db = new Database(':memory:')
  for (const r of [...leggiGuadagni(CSV_INGLESE), ...leggiGuadagni(CSV_ITALIANO)])
    db.salvaPrenotazione({ codice: r.codice, checkin: r.checkin, checkout: r.checkout, guadagno: r.guadagno, ospite: r.ospite })
  const spese = leggiRigheSpese([
    ['05/10/2026', 'Bolletta luce', 'Bollette', 85.5, ''],
    ['07/10/2026', 'Pulizie', 'Pulizie', 40, ''],
  ])
  const [settembre, ottobre] = rendimentoPerMese(incassiPerMese(db.prenotazioniArchiviate()), spese, SPESE_FISSE_INIZIALI)
  assert.deepEqual(settembre, {
    mese: '2026-09',
    incassi: 150,
    notti: 2,
    prenotazioni: 1,
    occupazione: 7,
    prezzoMedio: 75,
    revpar: 5,
    speseFisse: 1475,
    speseVariabili: 0,
    utile: -1325,
    margine: -883,
  })
  assert.equal(ottobre.incassi, 1050)
  assert.equal(ottobre.notti, 9)
  assert.equal(ottobre.occupazione, 29)
  assert.equal(ottobre.speseVariabili, 126)
  assert.equal(ottobre.utile, -550, '1050 − 1400 − 75 − 85,50 − 40 = −550,50')
})
