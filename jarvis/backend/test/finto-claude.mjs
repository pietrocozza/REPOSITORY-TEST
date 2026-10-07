#!/usr/bin/env node
// Finto Claude Code per i test: risponde nel formato stream-json senza contattare nessuno.
// Supporta sia "un avvio per messaggio" sia la modalità sempre accesa (--input-format stream-json).
import fs from 'node:fs'
import readline from 'node:readline'

const args = process.argv.slice(2)
const scenario = process.env.FINTO_SCENARIO ?? 'ok'
const persistente = args.includes('--input-format')
if (process.env.FINTO_FILE_ARGOMENTI) fs.writeFileSync(process.env.FINTO_FILE_ARGOMENTI, JSON.stringify(args))
if (process.env.FINTO_CONTATORE) fs.appendFileSync(process.env.FINTO_CONTATORE, 'x')

const scrivi = (o) => process.stdout.write(JSON.stringify(o) + '\n')
const sessione = args[args.indexOf(args.includes('--resume') ? '--resume' : '--session-id') + 1]

if (scenario === 'rotto' && persistente) {
  process.stderr.write("error: unknown option '--input-format'\n")
  process.exit(1)
}
if (scenario === 'sessione' && args.includes('--resume')) {
  process.stderr.write(`No conversation found with session ID: ${sessione}\n`)
  process.exit(1)
}

scrivi({ type: 'system', subtype: 'init', session_id: sessione, apiKeySource: scenario === 'apikey' ? 'ANTHROPIC_API_KEY' : 'none' })
if (scenario === 'apikey') setTimeout(() => {}, 5000)

// Chiama uno strumento di Jarvis attraverso il server MCP indicato in --mcp-config, come fa Claude Code
async function strumentoJarvis(nome, argomenti) {
  const cfg = JSON.parse(fs.readFileSync(args[args.indexOf('--mcp-config') + 1], 'utf8')).mcpServers.jarvis
  const chiama = (corpo) =>
    fetch(cfg.url, {
      method: 'POST',
      headers: { ...cfg.headers, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify(corpo),
    })
  await chiama({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'finto', version: '1' } } })
  await chiama({ jsonrpc: '2.0', method: 'notifications/initialized' })
  const r = await (await chiama({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: nome, arguments: argomenti } })).json()
  return r.result.content[0].text
}

async function rispondiConStrumenti(messaggio) {
  const [comando, ...resto] = messaggio.split(' ')
  const testo = resto.join(' ')
  let nome, argomenti
  if (comando === 'ricorda') {
    const [titolo, contenuto] = testo.split(':').map((x) => x.trim())
    ;[nome, argomenti] = ['ricorda', { tipo: 'persona', titolo, contenuto }]
  } else if (comando === 'dimentica') [nome, argomenti] = ['dimentica', { id: Number(testo) }]
  else if (comando === 'pratica') [nome, argomenti] = ['apri_pratica', { titolo: testo, descrizione: 'prova' }]
  else return false
  scrivi({ type: 'stream_event', event: { type: 'content_block_start', content_block: { type: 'tool_use', name: `mcp__jarvis__${nome}`, id: 'm1' } } })
  const esito = await strumentoJarvis(nome, argomenti)
  scrivi({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'm1' }] } })
  scrivi({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: `Fatto: ${esito}` } } })
  scrivi({ type: 'result', subtype: 'success', is_error: false, result: 'fine', session_id: sessione })
  return true
}

function rispondi(messaggio) {
  if (scenario === 'apikey') return
  if (scenario === 'login') return scrivi({ type: 'result', subtype: 'success', is_error: true, result: 'Not logged in · Please run /login' })
  if (scenario === 'lento') return setTimeout(() => {}, 30000)
  const delta = (text) => scrivi({ type: 'stream_event', event: { type: 'content_block_delta', delta: { type: 'text_delta', text } } })
  scrivi({ type: 'stream_event', event: { type: 'message_start' } })
  delta('Cerco ')
  delta('subito.')
  scrivi({ type: 'stream_event', event: { type: 'content_block_start', content_block: { type: 'tool_use', name: 'WebSearch', id: 't1' } } })
  scrivi({ type: 'assistant', message: { content: [{ type: 'text', text: 'Cerco subito.' }, { type: 'tool_use', name: 'WebSearch', id: 't1' }] } })
  scrivi({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1' }] } })
  scrivi({ type: 'stream_event', event: { type: 'message_start' } })
  delta(`Hai scritto: ${messaggio}.`)
  delta(` Chiave API visibile: ${process.env.ANTHROPIC_API_KEY ? 'sì' : 'no'}.`)
  scrivi({ type: 'result', subtype: 'success', is_error: false, result: 'fine', session_id: sessione })
}

const gestisci = async (messaggio) => {
  if (args.includes('--mcp-config') && (await rispondiConStrumenti(messaggio))) return
  rispondi(messaggio)
}

if (persistente) {
  let coda = Promise.resolve()
  readline.createInterface({ input: process.stdin }).on('line', (riga) => {
    if (!riga.trim()) return
    const m = JSON.parse(riga)
    coda = coda.then(() => gestisci(m.message.content[0].text))
  })
} else {
  let messaggio = ''
  process.stdin.on('data', (d) => (messaggio += d))
  process.stdin.on('end', () => gestisci(messaggio))
}
