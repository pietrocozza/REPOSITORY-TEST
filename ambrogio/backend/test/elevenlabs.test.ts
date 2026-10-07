import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import { VoceElevenLabs } from '../src/voce/elevenlabs.ts'
import type { ErroreVoce } from '../src/voce/gemini.ts'

// Un finto ElevenLabs
const chiamate: { percorso: string; chiave: string; corpo: Record<string, unknown> | null }[] = []
let crediti = 1000
const finto = http.createServer(async (req, res) => {
  let corpo = ''
  for await (const p of req) corpo += p
  chiamate.push({ percorso: req.url ?? '', chiave: String(req.headers['xi-api-key']), corpo: corpo ? JSON.parse(corpo) : null })
  if (req.headers['xi-api-key'] !== 'giusta') return res.writeHead(401, { 'Content-Type': 'application/json' }).end('{"detail":{"status":"invalid_api_key"}}')
  if (req.url === '/v1/voices')
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(
      JSON.stringify({ voices: [{ voice_id: 'premade123456', name: 'Adam', category: 'premade' }, { voice_id: 'clone12345678', name: 'Ambrogio', category: 'cloned' }] }),
    )
  if (req.url === '/v1/user/subscription')
    return res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ character_count: 120, character_limit: 30000, next_character_count_reset_unix: 1790000000 }))
  if (req.url?.startsWith('/v1/text-to-speech/')) {
    const testo = String((JSON.parse(corpo) as { text: string }).text)
    if (crediti < testo.length) return res.writeHead(401, { 'Content-Type': 'application/json' }).end('{"detail":{"status":"quota_exceeded"}}')
    crediti -= testo.length
    return res.writeHead(200, { 'Content-Type': 'audio/mpeg' }).end(Buffer.from('ID3finto-mp3'))
  }
  res.writeHead(404).end()
})
let url = ''
before(async () => {
  await new Promise<void>((r) => finto.listen(0, '127.0.0.1', r))
  url = `http://127.0.0.1:${(finto.address() as AddressInfo).port}`
})
after(() => finto.close())
const cache = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-el-'))

test('stato: voci del tuo account (prima quelle clonate) e crediti', async () => {
  const v = new VoceElevenLabs({ chiave: 'giusta', cartellaCache: cache(), url })
  const s = await v.stato()
  assert.equal(s.disponibile, true)
  assert.deepEqual(s.voci.map((x) => x.descrizione), ['Ambrogio', 'Adam'])
  assert.deepEqual(s.crediti, { usati: 120, limite: 30000, rinnovo: new Date(1790000000 * 1000).toISOString() })
})

test('sintesi: sempre la stessa voce e lo stesso modello; frasi già dette non si pagano', async () => {
  const v = new VoceElevenLabs({ chiave: 'giusta', cartellaCache: cache(), url })
  const audio = await v.sintetizza('Ué, ghe pensi mi!', 'clone12345678')
  assert.equal(audio.toString(), 'ID3finto-mp3')
  const c = chiamate.at(-1)!
  assert.equal(c.percorso, '/v1/text-to-speech/clone12345678?output_format=mp3_44100_128')
  assert.equal(c.corpo?.model_id, 'eleven_flash_v2_5')
  assert.equal(c.corpo?.language_code, 'it')
  const prima = chiamate.length
  await v.sintetizza('Ué, ghe pensi mi!', 'clone12345678')
  assert.equal(chiamate.length, prima)
  await v.sintetizza('Qualità massima.', 'clone12345678', 'massima')
  assert.equal(chiamate.at(-1)!.corpo?.model_id, 'eleven_multilingual_v2')
  assert.equal(chiamate.at(-1)!.corpo?.language_code, undefined)
})

test('crediti finiti, chiave sbagliata, voce non valida', async () => {
  const v = new VoceElevenLabs({ chiave: 'giusta', cartellaCache: cache(), url })
  crediti = 0
  await assert.rejects(v.sintetizza('Una frase nuova.', 'clone12345678'), (e: ErroreVoce) => e.tipo === 'limite')
  assert.ok((await v.stato()).sospesaFinoA)
  crediti = 1000
  const sbagliata = new VoceElevenLabs({ chiave: 'sbagliata', cartellaCache: cache(), url })
  assert.equal((await sbagliata.stato()).disponibile, false)
  await assert.rejects(sbagliata.sintetizza('Ciao.', 'clone12345678'), (e: ErroreVoce) => e.tipo === 'senza-chiave')
  await assert.rejects(v.sintetizza('Ciao.', '../../etc'), (e: ErroreVoce) => e.tipo === 'errore')
})
