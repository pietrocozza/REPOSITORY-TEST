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
  assert.ok(testo.includes('anche Pietro e te stesso'))
  assert.ok(testo.includes('non sei una persona reale'))
  assert.ok(testo.includes('non parli di politica'))
  assert.ok(testo.includes('humour nero'))
  assert.ok(testo.includes('non prende mai di mira gruppi di persone'))
})

test('Ambrogio si presenta come maggiordomo e usa il milanese (tranne «Essenziale»)', async () => {
  const { istruzioni } = await import('../src/agent/istruzioni.ts')
  const testo = istruzioni('Pietro', 'maggiordomo')
  assert.match(testo, /Ti chiami Ambrogio e sei il maggiordomo personale di Pietro/)
  assert.match(testo, /dialetto milanese[\s\S]*Ghe pensi mi/)
  assert.match(testo, /parolacce, ma SOLO in milanese[\s\S]*Pirla/)
  assert.doesNotMatch(istruzioni('Pietro', 'essenziale'), /dialetto milanese/)
  assert.doesNotMatch(istruzioni('Pietro', 'essenziale'), /parolacce/)
})
