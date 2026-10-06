#!/usr/bin/env node
// Finto Claude Code per i test: risponde nel formato stream-json senza contattare nessuno.
import fs from 'node:fs'

const args = process.argv.slice(2)
const scenario = process.env.FINTO_SCENARIO ?? 'ok'
if (process.env.FINTO_FILE_ARGOMENTI) fs.writeFileSync(process.env.FINTO_FILE_ARGOMENTI, JSON.stringify(args))

let messaggio = ''
process.stdin.on('data', (d) => (messaggio += d))
process.stdin.on('end', () => {
  const scrivi = (o) => process.stdout.write(JSON.stringify(o) + '\n')
  const sessione = args[args.indexOf(args.includes('--resume') ? '--resume' : '--session-id') + 1]

  if (scenario === 'sessione' && args.includes('--resume')) {
    scrivi({ type: 'result', subtype: 'error_during_execution', is_error: true, result: `No conversation found with session ID: ${sessione}` })
    return
  }
  scrivi({ type: 'system', subtype: 'init', session_id: sessione, apiKeySource: scenario === 'apikey' ? 'ANTHROPIC_API_KEY' : 'none' })
  if (scenario === 'apikey') return setTimeout(() => {}, 5000)
  if (scenario === 'login') {
    scrivi({ type: 'result', subtype: 'success', is_error: true, result: 'Not logged in · Please run /login' })
    return
  }
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
})
