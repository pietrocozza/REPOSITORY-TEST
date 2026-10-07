import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import { Database } from '../src/database/db.ts'
import { GestorePermessi } from '../src/permessi/gestore.ts'
import { creaServerMcp } from '../src/mcp/server.ts'

const db = new Database(':memory:')
const gestore = new GestorePermessi(db)
const gestisci = creaServerMcp(gestore, 'chiave-segreta')
const server = http.createServer(async (req, res) => {
  let corpo = ''
  for await (const p of req) corpo += p
  await gestisci(req, res, corpo)
})
let url = ''
before(async () => {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`
})
after(() => server.close())

const rpc = (corpo: unknown, chiave = 'chiave-segreta') =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chiave}` }, body: JSON.stringify(corpo) })

test('senza la chiave giusta non si entra', async () => {
  assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, 'sbagliata')).status, 401)
})

test('protocollo MCP: initialize, notifica, elenco e chiamata', async () => {
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })
  assert.equal(init.status, 200)
  assert.ok(init.headers.get('mcp-session-id'))
  const i = (await init.json()) as { result: { protocolVersion: string; capabilities: object } }
  assert.equal(i.result.protocolVersion, '2025-06-18')

  assert.equal((await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' })).status, 202)

  const lista = (await (await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json()) as { result: { tools: { name: string; inputSchema: object }[] } }
  const nomi = lista.result.tools.map((t) => t.name)
  assert.ok(nomi.includes('ricorda') && nomi.includes('dimentica'))

  const chiamata = (await (
    await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ricorda', arguments: { tipo: 'contatto', titolo: 'Idraulico', contenuto: '333 1234567' } } })
  ).json()) as { result: { content: { text: string }[]; isError: boolean } }
  assert.equal(chiamata.result.isError, false)
  assert.match(chiamata.result.content[0].text, /Idraulico/)

  const ignoto = (await (await rpc({ jsonrpc: '2.0', id: 4, method: 'resources/list' })).json()) as { error: { code: number } }
  assert.equal(ignoto.error.code, -32601)
})
