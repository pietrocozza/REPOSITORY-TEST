import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import { Trascrizione } from '../src/voce/trascrizione.ts'
import type { ErroreVoce } from '../src/voce/gemini.ts'

let ultima: { modello: string; corpo: { contents: { parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] }[] } } | null = null
let risposta = 'Ambrogio, che tempo fa domani a Milano?'
const finto = http.createServer(async (req, res) => {
  let corpo = ''
  for await (const p of req) corpo += p
  ultima = { modello: req.url?.match(/models\/(.+):generateContent/)?.[1] ?? '', corpo: JSON.parse(corpo) }
  if (req.headers['x-goog-api-key'] !== 'giusta') return res.writeHead(400).end('{"error":{"message":"API key not valid"}}')
  res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ candidates: [{ content: { parts: [{ text: risposta }] } }] }))
})
let url = ''
before(async () => {
  await new Promise<void>((r) => finto.listen(0, '127.0.0.1', r))
  url = `http://127.0.0.1:${(finto.address() as AddressInfo).port}`
})
after(() => finto.close())

test('trascrive: manda l’audio a Gemini e restituisce solo il testo', async () => {
  const t = new Trascrizione({ chiave: 'giusta', url })
  assert.equal(await t.trascrivi(Buffer.from('audio-finto'), 'audio/webm;codecs=opus'), 'Ambrogio, che tempo fa domani a Milano?')
  assert.equal(ultima?.modello, 'gemini-2.5-flash')
  const parti = ultima!.corpo.contents[0].parts
  assert.match(parti[0].text ?? '', /Trascrivi esattamente/)
  assert.equal(parti[1].inlineData?.mimeType, 'audio/webm')
  assert.equal(Buffer.from(parti[1].inlineData!.data, 'base64').toString(), 'audio-finto')
  risposta = '«Ué, ghe pensi mi»'
  assert.equal(await t.trascrivi(Buffer.from('x'), 'audio/webm'), 'Ué, ghe pensi mi')
})

test('chiave sbagliata o mancante: errore chiaro', async () => {
  await assert.rejects(new Trascrizione({ chiave: 'sbagliata', url }).trascrivi(Buffer.from('x'), 'audio/webm'), (e: ErroreVoce) => e.tipo === 'senza-chiave')
  await assert.rejects(new Trascrizione({ chiave: '', url }).trascrivi(Buffer.from('x'), 'audio/webm'), (e: ErroreVoce) => e.tipo === 'senza-chiave')
})
