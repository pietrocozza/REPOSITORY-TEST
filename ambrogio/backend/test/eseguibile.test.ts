import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { trovaClaude } from '../src/agent/eseguibile.ts'

test('percorso configurato inesistente: non trovato', () => {
  assert.equal(trovaClaude(path.join(os.tmpdir(), 'non-esiste', 'claude.exe')), null)
})

test('percorso configurato esistente: usato così com’è', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-exe-'))
  const file = path.join(dir, process.platform === 'win32' ? 'claude.exe' : 'claude')
  fs.writeFileSync(file, '')
  const e = trovaClaude(file)
  assert.ok(e)
  assert.equal(e.comando, file)
  assert.equal(e.shell, false)
})

test('Windows, installazione npm: usa bin/claude.exe e non il prompt dei comandi', { skip: process.platform !== 'win32' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-npm-'))
  const cmd = path.join(dir, 'claude.cmd')
  const exe = path.join(dir, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe')
  fs.mkdirSync(path.dirname(exe), { recursive: true })
  fs.writeFileSync(cmd, '')
  fs.writeFileSync(exe, '')
  const e = trovaClaude(cmd)
  assert.ok(e)
  assert.equal(e.comando, exe)
  assert.equal(e.shell, false)
})
