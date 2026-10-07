import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dividiInFrasi, ESCLAMAZIONI_MILANESI, frasiDaPreparare } from '../src/voce/frasi-pronte.ts'

test('le frasi si dividono come le dice l’interfaccia', () => {
  assert.deepEqual(dividiInFrasi('Ué, Pietro! Sun chì, dimmi pure.'), ['Ué, Pietro!', 'Sun chì, dimmi pure.'])
  assert.deepEqual(dividiInFrasi('Fatto. Ghe pensi mi.'), ['Fatto.', 'Ghe pensi mi.'])
})

test('archivio: esclamazioni, risposte pronte e frasi dell’interfaccia, senza doppioni', () => {
  const frasi = frasiDaPreparare('Pietro', ['Certo, signore. Cerco subito.', 'Ué!'])
  for (const e of ESCLAMAZIONI_MILANESI) assert.ok(frasi.includes(e), e)
  assert.ok(frasi.includes('Ué, Pietro!'))
  assert.ok(frasi.includes('Dovere, Pietro.'))
  assert.ok(frasi.includes('Cerco subito.'))
  assert.equal(frasi.length, new Set(frasi).size)
  assert.ok(frasi.length > 60)
})
