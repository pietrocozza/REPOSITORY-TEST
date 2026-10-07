import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { eseguiTurno, type OpzioniTurno } from '../src/agent/claude-code.ts'
import type { EventoAgente } from '../src/agent/eventi.ts'

const FINTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'finto-claude.mjs')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-test-'))

function opzioni(extra: Partial<OpzioniTurno> = {}) {
  const eventi: EventoAgente[] = []
  const o: OpzioniTurno = {
    messaggio: 'ciao "Ambrogio" & rm -rf /',
    sessione: { id: '11111111-2222-4333-8444-555555555555', avviata: false },
    eseguibile: { comando: process.execPath, prefisso: [FINTO], shell: false, descrizione: 'finto' },
    cartellaLavoro: path.join(tmp, 'agente'),
    istruzioni: 'istruzioni di prova',
    strumenti: ['WebSearch', 'WebFetch'],
    timeoutMs: 10000,
    consentiApiAConsumo: false,
    onEvento: (e) => eventi.push(e),
    ...extra,
  }
  return { o, eventi }
}

const testo = (eventi: EventoAgente[]) => eventi.map((e) => (e.tipo === 'testo' ? e.testo : '')).join('')

test('risposta in streaming, strumenti annunciati, messaggio passato intatto da stdin', async () => {
  process.env.FINTO_SCENARIO = 'ok'
  process.env.FINTO_FILE_ARGOMENTI = path.join(tmp, 'args.json')
  process.env.ANTHROPIC_API_KEY = 'sk-ant-da-non-usare'
  const { o, eventi } = opzioni()
  assert.equal(await eseguiTurno(o), 'ok')
  assert.equal(testo(eventi), 'Cerco subito.\n\nHai scritto: ciao "Ambrogio" & rm -rf /. Chiave API visibile: no.')
  const strumento = eventi.find((e) => e.tipo === 'stato' && e.stato === 'WORKING')
  assert.deepEqual(strumento, { tipo: 'stato', stato: 'WORKING', strumento: 'WebSearch', descrizione: 'Ricerca sul web' })

  const args: string[] = JSON.parse(fs.readFileSync(process.env.FINTO_FILE_ARGOMENTI, 'utf8'))
  assert.equal(args[args.indexOf('--tools') + 1], 'WebSearch,WebFetch')
  assert.equal(args[args.indexOf('--session-id') + 1], o.sessione.id)
  assert.ok(!args.includes('--resume'))
  assert.ok(!args.some((a) => a.includes('rm -rf')), 'il messaggio non deve finire tra gli argomenti')
  delete process.env.ANTHROPIC_API_KEY
})

test('una conversazione già avviata viene ripresa con --resume', async () => {
  process.env.FINTO_SCENARIO = 'ok'
  const { o } = opzioni({ sessione: { id: '11111111-2222-4333-8444-555555555555', avviata: true } })
  assert.equal(await eseguiTurno(o), 'ok')
  const args: string[] = JSON.parse(fs.readFileSync(process.env.FINTO_FILE_ARGOMENTI!, 'utf8'))
  assert.equal(args[args.indexOf('--resume') + 1], o.sessione.id)
})

test('login mancante: errore spiegato in italiano', async () => {
  process.env.FINTO_SCENARIO = 'login'
  const { o, eventi } = opzioni()
  assert.equal(await eseguiTurno(o), 'errore')
  const err = eventi.find((e) => e.tipo === 'errore')
  assert.ok(err && err.tipo === 'errore' && err.messaggio.includes('/login'))
})

test('chiave API a consumo: la richiesta viene fermata', async () => {
  process.env.FINTO_SCENARIO = 'apikey'
  const { o, eventi } = opzioni()
  assert.equal(await eseguiTurno(o), 'errore')
  const err = eventi.find((e) => e.tipo === 'errore')
  assert.ok(err && err.tipo === 'errore' && err.messaggio.includes('a consumo'))
})

test('interruzione: il processo viene chiuso', async () => {
  process.env.FINTO_SCENARIO = 'lento'
  const ctl = new AbortController()
  const { o } = opzioni({ signal: ctl.signal })
  setTimeout(() => ctl.abort(), 300)
  const inizio = Date.now()
  assert.equal(await eseguiTurno(o), 'interrotto')
  assert.ok(Date.now() - inizio < 5000)
})

test('sessione inesistente riconosciuta', async () => {
  process.env.FINTO_SCENARIO = 'sessione'
  const { o } = opzioni({ sessione: { id: '11111111-2222-4333-8444-555555555555', avviata: true } })
  assert.equal(await eseguiTurno(o), 'sessione-mancante')
})
