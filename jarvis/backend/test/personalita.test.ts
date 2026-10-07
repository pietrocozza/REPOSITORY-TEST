import assert from 'node:assert/strict'
import { test } from 'node:test'
import { istruzioni, PERSONALITA, type IdPersonalita } from '../src/agent/istruzioni.ts'

test('ogni personalità mantiene le regole di sicurezza e di voce', () => {
  for (const id of Object.keys(PERSONALITA) as IdPersonalita[]) {
    const testo = istruzioni('Pietro', id)
    assert.ok(testo.includes('chiedi sempre conferma'), id)
    assert.ok(testo.includes('niente markdown'), id)
    assert.ok(!testo.includes('{NOME}'), id)
  }
})

test("l'imprenditore brillante parla a modo suo ma non si spaccia per una persona reale", () => {
  const testo = istruzioni('Pietro', 'imprenditore')
  assert.ok(testo.includes('mi consenta'))
  assert.ok(testo.includes('Con Pietro sei caloroso'))
  assert.ok(testo.includes('non sei una persona reale'))
  assert.ok(testo.includes('non parli di politica'))
})
