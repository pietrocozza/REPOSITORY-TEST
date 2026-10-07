import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizza, rispostaPronta } from '../src/agent/risposte-pronte.ts'

// 7 ottobre 2026, 15:05 ora italiana
const c = { appellativo: 'Pietro', adesso: new Date('2026-10-07T13:05:00Z'), caso: () => 0 }
const r = (frase: string) => rispostaPronta(frase, c)

test('ora e data, anche con il nome e le cortesie davanti', () => {
  assert.equal(r('Ambrogio, che ore sono?'), 'Sono le 15 e 5.')
  assert.equal(r('scusa, che ora è'), 'Sono le 15 e 5.')
  assert.equal(rispostaPronta('che ore sono', { ...c, adesso: new Date('2026-10-07T10:00:00Z') }), 'È mezzogiorno in punto.')
  assert.equal(rispostaPronta('che ore sono', { ...c, adesso: new Date('2026-10-07T23:20:00Z') }), "È l'una e 20.")
  assert.equal(r('che giorno è oggi?'), 'Oggi è mercoledì 7 ottobre 2026.')
})

test('saluti, ringraziamenti, presentazione', () => {
  assert.equal(r('Ciao!'), 'Buon pomeriggio, Pietro. Sono qui, cosa posso fare per te?')
  assert.equal(r('grazie mille'), 'Dovere, Pietro.')
  assert.match(r('come ti chiami?') ?? '', /^Sono Ambrogio, il tuo maggiordomo/)
})

test('piccoli calcoli', () => {
  assert.equal(r('quanto fa 12 per 7'), '12 per 7 fa 84.')
  assert.equal(r('quanto fa 10 diviso 4?'), '10 diviso 4 fa 2,5.')
  assert.equal(r('3,5 + 2'), '3,5 più 2 fa 5,5.')
  assert.match(r('quanto fa 5 diviso 0') ?? '', /zero/)
})

test('tutto il resto va a Claude', () => {
  for (const f of ['che tempo fa a Roma?', 'ciao, mi cerchi il meteo di domani', 'che ore sono a New York', 'grazie, ora mandami la mail', 'ricordati che prendo il caffè amaro', ''])
    assert.equal(r(f), null, f)
})

test('normalizza', () => {
  assert.equal(normalizza('Ambrogio, per favore: che ore sono?'), 'che ore sono')
})
