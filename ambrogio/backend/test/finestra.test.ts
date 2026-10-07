import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { consentiMicrofono } from '../src/finestra.ts'

test('microfono consentito solo ad Ambrogio, anche se era stato bloccato; il resto delle preferenze resta', () => {
  const profilo = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-edge-'))
  const file = path.join(profilo, 'Default', 'Preferences')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(
    file,
    JSON.stringify({
      browser: { altro: true },
      profile: { content_settings: { exceptions: { media_stream_mic: { 'http://127.0.0.1:3000,*': { setting: 2 }, 'https://altro.sito,*': { setting: 2 } } } } },
    }),
  )
  assert.equal(consentiMicrofono(profilo, ['http://127.0.0.1:3000']), true)
  const p = JSON.parse(fs.readFileSync(file, 'utf8'))
  assert.equal(p.browser.altro, true)
  assert.equal(p.profile.content_settings.exceptions.media_stream_mic['http://127.0.0.1:3000,*'].setting, 1)
  assert.equal(p.profile.content_settings.exceptions.media_stream_mic['https://altro.sito,*'].setting, 2)
  assert.equal(consentiMicrofono(profilo, ['http://127.0.0.1:3000']), false, 'già consentito: non si riscrive')
})

test('profilo nuovo: crea le preferenze', () => {
  const profilo = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-edge-'))
  assert.equal(consentiMicrofono(profilo, ['http://127.0.0.1:3000', 'http://localhost:3000']), true)
  const p = JSON.parse(fs.readFileSync(path.join(profilo, 'Default', 'Preferences'), 'utf8'))
  assert.deepEqual(Object.keys(p.profile.content_settings.exceptions.media_stream_mic), ['http://127.0.0.1:3000,*', 'http://localhost:3000,*'])
})
