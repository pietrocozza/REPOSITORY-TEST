import { randomUUID, timingSafeEqual } from 'node:crypto'
import type http from 'node:http'
import type { GestorePermessi } from '../permessi/gestore.ts'
import { STRUMENTI } from '../strumenti/catalogo.ts'

// Server MCP (Model Context Protocol) integrato nel backend: è il modo standard con cui Claude Code
// usa strumenti esterni. Claude Code lo chiama su http://127.0.0.1:8787/mcp con una chiave segreta
// generata a ogni avvio: nessun altro programma può usare gli strumenti di Ambrogio.
// Ogni chiamata passa dal gestore dei permessi.

export const NOME_SERVER_MCP = 'ambrogio'
export const nomeCompleto = (strumento: string) => `mcp__${NOME_SERVER_MCP}__${strumento}`

type RichiestaRpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }

const PROTOCOLLO_PREDEFINITO = '2025-06-18'

function chiaveValida(intestazione: string | undefined, chiave: string) {
  const attesa = Buffer.from(`Bearer ${chiave}`)
  const ricevuta = Buffer.from(intestazione ?? '')
  return ricevuta.length === attesa.length && timingSafeEqual(ricevuta, attesa)
}

export function creaServerMcp(gestore: GestorePermessi, chiave: string) {
  const rispondi = async (r: RichiestaRpc) => {
    const ok = (result: unknown) => ({ jsonrpc: '2.0', id: r.id ?? null, result })
    const ko = (code: number, message: string) => ({ jsonrpc: '2.0', id: r.id ?? null, error: { code, message } })

    switch (r.method) {
      case 'initialize':
        return ok({
          protocolVersion: typeof r.params?.protocolVersion === 'string' ? r.params.protocolVersion : PROTOCOLLO_PREDEFINITO,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: NOME_SERVER_MCP, version: '0.3.0' },
          instructions: 'Strumenti personali di Ambrogio: memoria permanente e pratiche. Alcune azioni richiedono il permesso dell’utente.',
        })
      case 'ping':
        return ok({})
      case 'tools/list':
        return ok({ tools: STRUMENTI.map((s) => ({ name: s.nome, description: s.descrizione, inputSchema: s.schema })) })
      case 'tools/call': {
        const nome = typeof r.params?.name === 'string' ? r.params.name : ''
        const esito = await gestore.esegui(nome, r.params?.arguments ?? {})
        return ok({ content: [{ type: 'text', text: esito.testo }], isError: esito.errore })
      }
      default:
        return ko(-32601, `Metodo non supportato: ${r.method}`)
    }
  }

  return async function gestisci(req: http.IncomingMessage, res: http.ServerResponse, corpo: string) {
    if (!chiaveValida(req.headers.authorization, chiave)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ errore: 'Chiave MCP non valida.' }))
    }
    // niente flusso di notifiche dal server: GET non serve
    if (req.method === 'GET') {
      res.writeHead(405, { Allow: 'POST, DELETE' })
      return res.end()
    }
    if (req.method === 'DELETE') {
      res.writeHead(200)
      return res.end()
    }

    let messaggio: RichiestaRpc | RichiestaRpc[]
    try {
      messaggio = JSON.parse(corpo)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON non valido' } }))
    }

    const lista = Array.isArray(messaggio) ? messaggio : [messaggio]
    // le notifiche (senza id) e le risposte non richiedono risposta
    const richieste = lista.filter((m) => m && typeof m === 'object' && m.method && m.id !== undefined && m.id !== null)
    if (!richieste.length) {
      res.writeHead(202)
      return res.end()
    }
    const risposte = await Promise.all(richieste.map(rispondi))
    const intestazioni: Record<string, string> = { 'Content-Type': 'application/json' }
    if (richieste.some((m) => m.method === 'initialize')) intestazioni['Mcp-Session-Id'] = randomUUID()
    res.writeHead(200, intestazioni)
    res.end(JSON.stringify(Array.isArray(messaggio) ? risposte : risposte[0]))
  }
}
