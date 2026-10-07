import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { MELODIE, dividiSuoni, elencoSuoni, suono } from '../src/voce/suoni.ts'
import { istruzioni } from '../src/agent/istruzioni.ts'

test('suoni: [SUONO: nome] separato dal testo, nell\'ordine', () => {
  assert.deepEqual(dividiSuoni('Ecco qua! [SUONO: Inno alla gioia] Bello, vero?'), [
    { testo: 'Ecco qua!' },
    { suono: 'Inno alla gioia' },
    { testo: 'Bello, vero?' },
  ])
  assert.deepEqual(dividiSuoni('Niente musica.'), [{ testo: 'Niente musica.' }])
})

test('suoni: melodie sintetizzate e file di Pietro in data/suoni', () => {
  const dati = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-suoni-'))
  const audio = suono('inno alla gioia', dati)!
  assert.equal(audio.subarray(0, 4).toString(), 'RIFF')
  assert.ok(audio.length > 24000 * 2 * 5, 'qualche secondo di musica')
  assert.equal(suono('canzone che non c\'è', dati), null)
  fs.mkdirSync(path.join(dati, 'suoni'))
  fs.writeFileSync(path.join(dati, 'suoni', 'O mia bela Madunina.wav'), Buffer.from('RIFFfinto'))
  assert.equal(suono('o mia bela madunina', dati)?.toString(), 'RIFFfinto')
  assert.deepEqual(elencoSuoni(dati), [...Object.keys(MELODIE), 'O mia bela Madunina'])
  assert.match(istruzioni('Pietro', 'maggiordomo', '', new Date(), elencoSuoni(dati)), /\[SUONO: nome\].*fanfara/s)
})
