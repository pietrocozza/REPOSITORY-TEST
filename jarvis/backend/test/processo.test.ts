import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { ProcessoClaude, type Avvio } from '../src/agent/claude-code.ts'
import type { EventoAgente } from '../src/agent/eventi.ts'

const FINTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'finto-claude.mjs')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-processo-'))

const avvio = (): Avvio => ({
  sessione: { id: '22222222-2222-4333-8444-555555555555', avviata: false },
  eseguibile: { comando: process.execPath, prefisso: [FINTO], shell: false, descrizione: 'finto' },
  cartellaLavoro: path.join(tmp, 'agente'),
  istruzioni: 'prova',
  strumenti: ['WebSearch'],
  effort: 'low',
  consentiApiAConsumo: false,
})

const raccogli = () => {
  const eventi: EventoAgente[] = []
  return { eventi, onEvento: (e: EventoAgente) => eventi.push(e), testo: () => eventi.map((e) => (e.tipo === 'testo' ? e.testo : '')).join('') }
}

test('modalità veloce: un solo avvio di Claude Code per più messaggi', async () => {
  process.env.FINTO_SCENARIO = 'ok'
  process.env.FINTO_CONTATORE = path.join(tmp, 'contatore-1')
  process.env.FINTO_FILE_ARGOMENTI = path.join(tmp, 'args-veloce.json')
  const p = new ProcessoClaude(avvio())
  p.accendi()
  const a = raccogli()
  assert.equal(await p.invia('prima', { timeoutMs: 5000, onEvento: a.onEvento }), 'ok')
  assert.equal(a.testo(), 'Cerco subito.\n\nHai scritto: prima. Chiave API visibile: no.')
  const b = raccogli()
  assert.equal(await p.invia('seconda', { timeoutMs: 5000, onEvento: b.onEvento }), 'ok')
  assert.ok(b.testo().includes('Hai scritto: seconda.'))
  assert.equal(fs.readFileSync(process.env.FINTO_CONTATORE, 'utf8'), 'x', 'Claude Code deve partire una volta sola')
  const args: string[] = JSON.parse(fs.readFileSync(process.env.FINTO_FILE_ARGOMENTI, 'utf8'))
  assert.equal(args[args.indexOf('--input-format') + 1], 'stream-json')
  assert.equal(args[args.indexOf('--effort') + 1], 'low')
  p.spegni()
})

test('modalità veloce: interruzione e ripartenza al messaggio successivo', async () => {
  process.env.FINTO_SCENARIO = 'lento'
  process.env.FINTO_CONTATORE = path.join(tmp, 'contatore-2')
  const p = new ProcessoClaude(avvio())
  const ctl = new AbortController()
  setTimeout(() => ctl.abort(), 300)
  assert.equal(await p.invia('aspetta', { timeoutMs: 5000, signal: ctl.signal, onEvento: () => {} }), 'interrotto')
  process.env.FINTO_SCENARIO = 'ok'
  const a = raccogli()
  assert.equal(await p.invia('di nuovo', { timeoutMs: 5000, onEvento: a.onEvento }), 'ok')
  assert.equal(fs.readFileSync(process.env.FINTO_CONTATORE, 'utf8'), 'xx')
  p.spegni()
})

test('modalità veloce non supportata: segnalata come fallita', async () => {
  process.env.FINTO_SCENARIO = 'rotto'
  const p = new ProcessoClaude(avvio())
  assert.equal(await p.invia('ciao', { timeoutMs: 5000, onEvento: () => {} }), 'errore')
  assert.equal(p.fallito, true)
})

test('modalità veloce: chiave API a consumo bloccata', async () => {
  process.env.FINTO_SCENARIO = 'apikey'
  const p = new ProcessoClaude(avvio())
  const a = raccogli()
  assert.equal(await p.invia('ciao', { timeoutMs: 5000, onEvento: a.onEvento }), 'errore')
  const err = a.eventi.find((e) => e.tipo === 'errore')
  assert.ok(err && err.tipo === 'errore' && err.messaggio.includes('a consumo'))
  p.spegni()
})
