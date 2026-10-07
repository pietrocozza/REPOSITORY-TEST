import assert from 'node:assert/strict'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { config } from '../src/config.ts'
import { Agente } from '../src/agent/agente.ts'
import { Database } from '../src/database/db.ts'
import { GestorePermessi } from '../src/permessi/gestore.ts'
import { creaServerMcp } from '../src/mcp/server.ts'
import { creaServer } from '../src/http/server.ts'

// Tutta la catena come sul PC: interfaccia → backend → (finto) Claude Code → server MCP → gestore permessi → database

const FINTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'finto-claude.mjs')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-integrazione-'))
const portaLibera = () =>
  new Promise<number>((r) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const p = (s.address() as net.AddressInfo).port
      s.close(() => r(p))
    })
  })

let base = ''
let agente: Agente
let server: ReturnType<typeof creaServer>

before(async () => {
  const porta = await portaLibera()
  base = `http://127.0.0.1:${porta}`
  const cfg = { ...config, cartellaDati: tmp, cartellaLavoro: path.join(tmp, 'agente'), porta }
  const db = new Database(path.join(tmp, 'jarvis.sqlite'))
  const gestore = new GestorePermessi(db)
  agente = new Agente(cfg, { comando: process.execPath, prefisso: [FINTO], shell: false, descrizione: 'finto' }, { db, gestore, mcp: { url: `${base}/mcp`, chiave: 'k' } })
  server = creaServer(cfg, agente, { mcp: creaServerMcp(gestore, 'k') })
  await new Promise<void>((r) => server.listen(porta, '127.0.0.1', r))
  process.env.FINTO_SCENARIO = 'ok'
})
after(() => {
  agente.spegni()
  server.close()
})

const post = (percorso: string, corpo: object) =>
  fetch(`${base}${percorso}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:3000' }, body: JSON.stringify(corpo) })

async function* eventi(res: Response) {
  const lettore = res.body!.getReader()
  const dec = new TextDecoder()
  let resto = ''
  for (;;) {
    const { done, value } = await lettore.read()
    if (done) break
    const righe = (resto + dec.decode(value, { stream: true })).split('\n')
    resto = righe.pop()!
    for (const r of righe) if (r.trim()) yield JSON.parse(r)
  }
}

test('Jarvis ricorda una persona tramite il suo strumento e la conversazione resta salvata', async () => {
  const res = await post('/api/chat', { messaggio: 'ricorda Marco: è mio cugino' })
  const tutti = []
  for await (const e of eventi(res)) tutti.push(e)
  assert.equal(tutti.at(-1).tipo, 'fine')
  assert.ok(tutti.some((e) => e.tipo === 'stato' && e.stato === 'WORKING' && e.strumento === 'ricorda'))
  const memorie = (await (await fetch(`${base}/api/memorie`)).json()) as { memorie: { titolo: string }[] }
  assert.deepEqual(memorie.memorie.map((m) => m.titolo), ['Marco'])
  const conv = (await (await fetch(`${base}/api/conversazione`)).json()) as { messaggi: { ruolo: string; testo: string }[] }
  assert.deepEqual(conv.messaggi.map((m) => m.ruolo), ['user', 'assistant'])
})

test('cancellare una memoria richiede il permesso: Jarvis aspetta, Pietro conferma, poi agisce', async () => {
  const { memorie } = (await (await fetch(`${base}/api/memorie`)).json()) as { memorie: { id: number }[] }
  const res = await post('/api/chat', { messaggio: `dimentica ${memorie[0].id}` })
  let visto = false
  for await (const e of eventi(res)) {
    if (e.tipo === 'conferma') {
      visto = true
      assert.equal(e.livello, 3)
      // in attesa: la memoria c'è ancora e la richiesta è visibile anche dall'elenco
      const inAttesa = (await (await fetch(`${base}/api/autorizzazioni`)).json()) as { inAttesa: unknown[] }
      assert.equal(inAttesa.inAttesa.length, 1)
      assert.equal((await post(`/api/autorizzazioni/${e.id}`, { decisione: 'concedi' })).status, 200)
    }
  }
  assert.ok(visto, 'la richiesta di conferma deve arrivare all’interfaccia')
  const dopo = (await (await fetch(`${base}/api/memorie`)).json()) as { memorie: unknown[] }
  assert.equal(dopo.memorie.length, 0)
  const registro = (await (await fetch(`${base}/api/registro`)).json()) as { voci: { descrizione: string }[] }
  const d = registro.voci.map((v) => v.descrizione)
  for (const atteso of ['Richiesta autorizzazione', 'Autorizzazione ricevuta', 'Cancellare per sempre']) assert.ok(d.some((x) => x.includes(atteso)), atteso)
})
