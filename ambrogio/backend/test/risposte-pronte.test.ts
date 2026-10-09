import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizza, rispostaPronta } from '../src/agent/risposte-pronte.ts'

// 7 ottobre 2026, 15:05 ora italiana
const c = { appellativo: 'Pietro', adesso: new Date('2026-10-07T13:05:00Z'), caso: () => 0 }
const r = (frase: string) => rispostaPronta(frase, c)

test('ora e data, anche con il nome e le cortesie davanti', () => {
  assert.equal(r('Ambrogio, che ore sono?'), 'Sono le 15 e 5.')
  assert.equal(r('scusa, che ora è'), 'Sono le 15 e 5.')
  assert.equal(r('Uè Ambrogio, che ore sono?'), 'Sono le 15 e 5.')
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

test('musica: «fammi sentire l\'inno alla gioia» parte subito, senza Claude', async () => {
  const { rispostaPronta } = await import('../src/agent/risposte-pronte.ts')
  const suoni = ['inno alla gioia', 'fra martino', 'campanello', 'O mia bela Madunina']
  const c = { appellativo: 'Pietro', suoni, caso: () => 0 }
  assert.match(rispostaPronta("fammi sentire l'inno alla gioia", c) ?? '', /\[SUONO: inno alla gioia\]$/)
  assert.match(rispostaPronta('Ambrogio, suonami Fra Martino per favore', c) ?? '', /\[SUONO: fra martino\]$/)
  assert.match(rispostaPronta('metti la madunina', c) ?? '', /^$|\[SUONO/, 'nome parziale: o lo trova o va a Claude')
  assert.match(rispostaPronta('suonami qualcosa', c) ?? '', /\[SUONO: (?!campanello)/)
  assert.equal(rispostaPronta('fammi sentire bohemian rhapsody', c), null, 'brano che non c’è: risponde Claude')
  assert.equal(rispostaPronta('fammi sentire la musica', { appellativo: 'Pietro' }), null, 'senza elenco dei suoni: Claude')
})

test('calcoli senza internet: precedenza, parentesi, potenze, radici, percentuali', async () => {
  const { rispostaPronta } = await import('../src/agent/risposte-pronte.ts')
  const c = { appellativo: 'Pietro' }
  assert.equal(rispostaPronta('quanto fa 3 più 4 per 2?', c), 'Fa 11.')
  assert.equal(rispostaPronta('Ambrogio, calcola (12+8)/4', c), 'Fa 5.')
  assert.equal(rispostaPronta('radice quadrata di 144', c), 'Fa 12.')
  assert.equal(rispostaPronta('quanto fa 2 alla 10', c), 'Fa 1024.')
  assert.equal(rispostaPronta('quanto è il 20 per cento di 150', c), 'Fa 30.')
  assert.equal(rispostaPronta('7 al quadrato', c), 'Fa 49.')
  assert.equal(rispostaPronta('quanto fa 10 diviso (5 meno 5)', c), 'Diviso zero non si può, nemmeno per un maggiordomo.')
  assert.equal(rispostaPronta('quanto costa un biglietto per 2 persone', c), null, 'non è un calcolo')
})
