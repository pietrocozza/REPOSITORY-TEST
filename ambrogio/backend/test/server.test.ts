import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type { AddressInfo } from 'node:net'
import { config } from '../src/config.ts'
import { Agente } from '../src/agent/agente.ts'
import { creaServer } from '../src/http/server.ts'

const FINTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'finto-claude.mjs')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-server-'))
const cfg = { ...config, cartellaDati: tmp, cartellaLavoro: path.join(tmp, 'agente') }
const agente = new Agente(cfg, { comando: process.execPath, prefisso: [FINTO], shell: false, descrizione: 'finto' })
const server = creaServer(cfg, agente)
let base = ''

before(async () => {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
after(() => {
  agente.spegni()
  server.close()
})

const chat = (messaggio: string, origin = 'http://localhost:3000') =>
  fetch(`${base}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ messaggio }) })

test('chat: eventi NDJSON in ordine, conversazione ricordata', async () => {
  process.env.FINTO_SCENARIO = 'ok'
  const res = await chat('prima domanda')
  assert.equal(res.status, 200)
  const eventi = (await res.text()).trim().split('\n').map((r) => JSON.parse(r))
  assert.equal(eventi[0].stato, 'THINKING')
  assert.ok(eventi.some((e) => e.stato === 'WORKING' && e.strumento === 'WebSearch'))
  assert.equal(eventi.at(-2).stato, 'SUCCESS')
  assert.equal(eventi.at(-1).tipo, 'fine')
  const sessione = JSON.parse(fs.readFileSync(path.join(tmp, 'sessione.json'), 'utf8'))
  assert.equal(sessione.avviata, true)
  assert.equal(eventi.at(-1).sessione, sessione.id)
})

test('sessione persa: Ambrogio ne apre una nuova e risponde lo stesso', async () => {
  // come dopo un riavvio di Ambrogio: Claude Code ripartirà provando a riprendere la conversazione salvata
  agente.spegni()
  process.env.FINTO_SCENARIO = 'sessione'
  const prima = JSON.parse(fs.readFileSync(path.join(tmp, 'sessione.json'), 'utf8')).id
  const eventi = (await (await chat('ancora')).text()).trim().split('\n').map((r) => JSON.parse(r))
  assert.equal(eventi.at(-1).tipo, 'fine')
  assert.notEqual(eventi.at(-1).sessione, prima)
})

test('un sito estraneo non può usare il backend', async () => {
  const res = await chat('fai qualcosa', 'https://sito-malevolo.example')
  assert.equal(res.status, 403)
})

test('stato e nuova conversazione', async () => {
  const stato = (await (await fetch(`${base}/api/stato`)).json()) as { controlli: unknown }
  assert.ok(Array.isArray(stato.controlli))
  const nuova = (await (await fetch(`${base}/api/conversazione/nuova`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()) as { ok: boolean }
  assert.equal(nuova.ok, true)
})

test('se la modalità veloce non funziona, Ambrogio risponde lo stesso con quella di riserva', async () => {
  const dati = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-riserva-'))
  const a = new Agente({ ...cfg, cartellaDati: dati, cartellaLavoro: path.join(dati, 'agente') }, { comando: process.execPath, prefisso: [FINTO], shell: false, descrizione: 'finto' })
  process.env.FINTO_SCENARIO = 'rotto'
  const eventi: { tipo: string }[] = []
  assert.equal(await a.chat('raccontami una cosa', (e) => eventi.push(e)), 'ok')
  assert.equal(a.modalita, 'un avvio per messaggio')
  assert.ok(!eventi.some((e) => e.tipo === 'errore'), "l'errore della modalità veloce non deve arrivare all'interfaccia")
  assert.equal(eventi.at(-1)?.tipo, 'fine')
  a.spegni()
})

test('personalità: elenco, cambio, salvataggio e nuove istruzioni a Claude Code', async () => {
  const leggi = async (corpo?: object) =>
    (await (
      await fetch(`${base}/api/impostazioni`, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : {})
    ).json()) as { personalita: string; personalitaDisponibili: { id: string }[] }

  const iniziale = await leggi()
  assert.equal(iniziale.personalita, 'maggiordomo')
  assert.equal(iniziale.personalitaDisponibili.length, 4)

  const sbagliata = await fetch(`${base}/api/impostazioni`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"personalita":"pirata"}' })
  assert.equal(sbagliata.status, 400)

  assert.equal((await leggi({ personalita: 'imprenditore' })).personalita, 'imprenditore')
  assert.equal(JSON.parse(fs.readFileSync(path.join(tmp, 'impostazioni.json'), 'utf8')).personalita, 'imprenditore')

  process.env.FINTO_SCENARIO = 'ok'
  await (await chat('raccontami una barzelletta')).text()
  const istruzioni = fs.readFileSync(path.join(tmp, 'agente', 'istruzioni-ambrogio.txt'), 'utf8')
  assert.ok(istruzioni.includes('mi consenta'), 'Claude Code deve ripartire con la nuova personalità')
})

test('codice: elenco degli aggiornamenti e protezione degli indirizzi', async () => {
  const h = { Origin: 'http://localhost:3000' }
  const elenco = (await (await fetch(`${base}/api/codice`, { headers: h })).json()) as { disponibile: boolean; installati: { sha: string }[] }
  assert.equal(elenco.disponibile, true)
  assert.ok(elenco.installati.length > 0)
  const d = await fetch(`${base}/api/codice/${elenco.installati[0].sha}`, { headers: h })
  assert.equal(d.status, 200)
  assert.ok(Array.isArray(((await d.json()) as { file: unknown }).file))
  assert.equal((await fetch(`${base}/api/codice/abc`, { headers: h })).status, 400)
  assert.equal((await fetch(`${base}/api/codice`, { headers: { Origin: 'https://sito-malevolo.example' } })).status, 403)
})

test('domanda elementare: risposta immediata senza Claude', async () => {
  const inizio = Date.now()
  const eventi = (await (await chat('Ambrogio, che ore sono?')).text()).trim().split('\n').map((r) => JSON.parse(r))
  assert.deepEqual(eventi.map((e) => e.tipo), ['testo', 'fine'])
  assert.match(eventi[0].testo, /^(Sono le|È )/)
  assert.ok(Date.now() - inizio < 1000)
})

test('voce: senza chiave il backend lo dice (e l’interfaccia userà Edge)', async () => {
  const h = { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }
  const stato = (await (await fetch(`${base}/api/voce`, { headers: h })).json()) as { disponibile: boolean; voci: unknown[] }
  assert.equal(typeof stato.disponibile, 'boolean')
  assert.ok(stato.voci.length > 3)
  if (!stato.disponibile) {
    const r = await fetch(`${base}/api/voce`, { method: 'POST', headers: h, body: JSON.stringify({ testo: 'Ciao' }) })
    assert.equal(r.status, 409)
  }
})

test('trascrizione: accetta solo audio, e senza chiave lo dice', async () => {
  const json = await fetch(`${base}/api/trascrivi`, { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' }, body: '{}' })
  assert.equal(json.status, 415)
  const audio = await fetch(`${base}/api/trascrivi`, { method: 'POST', headers: { Origin: 'http://localhost:3000', 'Content-Type': 'audio/webm' }, body: Buffer.from('x') })
  assert.ok([200, 409, 502].includes(audio.status))
  const estraneo = await fetch(`${base}/api/trascrivi`, { method: 'POST', headers: { Origin: 'https://sito-malevolo.example', 'Content-Type': 'audio/webm' }, body: Buffer.from('x') })
  assert.equal(estraneo.status, 403)
})
