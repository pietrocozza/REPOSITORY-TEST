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

test('modello ritirato (404): sceglie da solo un modello adatto tra quelli disponibili', async () => {
  const { scegliModello } = await import('../src/voce/trascrizione.ts')
  assert.equal(
    scegliModello(['models/gemini-2.5-flash-preview-tts', 'models/gemini-3-flash-preview', 'models/gemini-3-flash', 'models/gemini-3-flash-lite', 'models/gemini-3-pro', 'models/gemini-2.0-flash-live']),
    'gemini-3-flash',
  )
  assert.equal(scegliModello(['models/gemini-3.1-flash-preview', 'models/embedding-001']), 'gemini-3.1-flash-preview')
  assert.equal(scegliModello(['models/gemini-3-pro']), null)

  // finto Google: il modello vecchio non c'è più, l'elenco ne propone uno nuovo
  const usati: string[] = []
  const g = http.createServer(async (req, res) => {
    for await (const _ of req);
    if (req.url?.startsWith('/v1beta/models?')) {
      return res.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({ models: [{ name: 'models/gemini-3-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-3-flash-preview-tts', supportedGenerationMethods: ['generateContent'] }] }),
      )
    }
    const modello = req.url?.match(/models\/(.+):generateContent/)?.[1] ?? ''
    usati.push(modello)
    if (modello !== 'gemini-3-flash') return res.writeHead(404).end('{}')
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ciao' }] } }] }))
  })
  await new Promise<void>((r) => g.listen(0, '127.0.0.1', r))
  const t = new Trascrizione({ chiave: 'x', url: `http://127.0.0.1:${(g.address() as AddressInfo).port}` })
  assert.equal(await t.trascrivi(Buffer.from('a'), 'audio/webm'), 'ciao')
  assert.equal(await t.trascrivi(Buffer.from('a'), 'audio/webm'), 'ciao')
  assert.deepEqual(usati, ['gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash'], 'la seconda volta usa subito quello giusto')
  g.close()
})
