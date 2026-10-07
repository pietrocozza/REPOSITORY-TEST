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

if (persistente) {
  readline.createInterface({ input: process.stdin }).on('line', (riga) => {
    if (!riga.trim()) return
    const m = JSON.parse(riga)
    rispondi(m.message.content[0].text)
  })
} else {
  let messaggio = ''
  process.stdin.on('data', (d) => (messaggio += d))
  process.stdin.on('end', () => rispondi(messaggio))
}
