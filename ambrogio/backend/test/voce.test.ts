import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import { ErroreVoce, VoceGemini, wav } from '../src/voce/gemini.ts'

// Un finto Gemini: il primo modello "non esiste più", il secondo risponde con un po' di audio
const richieste: { modello: string; chiave: string; corpo: { contents: { parts: { text: string }[] }[]; generationConfig: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } } } }[] = []
let rispondiLimite = false
const finto = http.createServer(async (req, res) => {
  let corpo = ''
  for await (const p of req) corpo += p
  const modello = req.url?.match(/models\/(.+):generateContent/)?.[1] ?? ''
  richieste.push({ modello, chiave: String(req.headers['x-goog-api-key']), corpo: JSON.parse(corpo) })
  if (modello === 'gemini-2.5-flash-preview-tts') return res.writeHead(404).end()
  if (rispondiLimite) return res.writeHead(429).end('{"error":{"status":"RESOURCE_EXHAUSTED"}}')
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: Buffer.alloc(480).toString('base64') } }] } }] }))
})
let url = ''
before(async () => {
  await new Promise<void>((r) => finto.listen(0, '127.0.0.1', r))
  url = `http://127.0.0.1:${(finto.address() as AddressInfo).port}`
})
after(() => finto.close())

const cache = () => fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-voce-'))

test('wav: intestazione corretta', () => {
  const w = wav(Buffer.alloc(100), 24000)
  assert.equal(w.toString('ascii', 0, 4), 'RIFF')
  assert.equal(w.readUInt32LE(24), 24000)
  assert.equal(w.length, 144)
})

test('sintesi: stile milanese, chiave nell’intestazione, poi dalla copia salvata', async () => {
  const v = new VoceGemini({ chiave: 'segreta', modello: 'gemini-3.1-flash-tts-preview', cartellaCache: cache(), url })
  const a = await v.sintetizza('Ué, ghe pensi mi!', 'Charon')
  assert.equal(a.toString('ascii', 0, 4), 'RIFF')
  const r = richieste.at(-1)!
  assert.equal(r.modello, 'gemini-3.1-flash-tts-preview')
  assert.equal(r.chiave, 'segreta')
  assert.equal(r.corpo.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon')
  assert.match(r.corpo.contents[0].parts[0].text, /accento milanese[\s\S]*«Ué, ghe pensi mi!»/)

  const prima = richieste.length
  await v.sintetizza('Ué, ghe pensi mi!', 'Charon')
  assert.equal(richieste.length, prima, 'la stessa frase non si richiede due volte')
})

test('sempre lo stesso modello: se non esiste lo dice, non ne prova altri', async () => {
  const v = new VoceGemini({ chiave: 'segreta', cartellaCache: cache(), url })
  const prima = richieste.length
  await assert.rejects(v.sintetizza('Ciao.', 'Charon'), (e: ErroreVoce) => e.tipo === 'errore' && /non esiste/.test(e.message))
  assert.equal(richieste.length, prima + 1)
})

test('limite raggiunto: pausa senza altre richieste; senza chiave: errore chiaro', async () => {
  const v = new VoceGemini({ chiave: 'segreta', modello: 'gemini-3.1-flash-tts-preview', cartellaCache: cache(), url })
  rispondiLimite = true
  await assert.rejects(v.sintetizza('Uno.', 'Charon'), (e: ErroreVoce) => e.tipo === 'limite')
  const prima = richieste.length
  await assert.rejects(v.sintetizza('Due.', 'Charon'), (e: ErroreVoce) => e.tipo === 'limite')
  assert.equal(richieste.length, prima)
  assert.ok(v.stato().sospesaFinoA)
  rispondiLimite = false

  const senza = new VoceGemini({ chiave: '', cartellaCache: cache(), url })
  assert.equal(senza.stato().disponibile, false)
  await assert.rejects(senza.sintetizza('Ciao.', 'Charon'), (e: ErroreVoce) => e.tipo === 'senza-chiave')
})
