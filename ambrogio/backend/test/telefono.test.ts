import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { Telefonata, Telefono, percorsoWindows, percorsoWsl } from '../src/telefono/telefono.ts'

const FINTO = path.join(path.dirname(fileURLToPath(import.meta.url)), 'finto-telefono.mjs')
const nuovoTelefono = () => new Telefono({ cartellaAmbrogio: os.tmpdir(), distro: 'Ubuntu-24.04', comando: `${process.execPath} ${FINTO}` })

test('percorsi tra Windows e Ubuntu', () => {
  assert.equal(percorsoWsl('C:\\Users\\cozza\\jarvis-progetto\\ambrogio'), '/mnt/c/Users/cozza/jarvis-progetto/ambrogio')
  assert.equal(percorsoWindows('/mnt/c/Users/cozza/a.wav', 'win32'), 'C:\\Users\\cozza\\a.wav')
  assert.equal(percorsoWindows('/mnt/c/Users/cozza/a.wav', 'linux'), '/mnt/c/Users/cozza/a.wav')
})

function telefonata(telefono: Telefono, risposte: string[], detto: string[]) {
  const richieste: string[] = []
  const t = new Telefonata({
    telefono,
    cartella: fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-tel-')),
    sintetizza: async (testo) => Buffer.from(`WAV:${testo}`),
    trascrivi: async () => detto.shift() ?? '',
    rispondi: async (r) => {
      richieste.push(r)
      return risposte.shift() ?? 'Arrivederci! [RIATTACCA]'
    },
  })
  return { t, richieste }
}

test('telefonata a botta e risposta: apertura, risposta di Claude, saluto e riattacca', async () => {
  process.env.FINTO_TELEFONO = 'ok'
  const telefono = nuovoTelefono()
  const { t, richieste } = telefonata(telefono, ['Benissimo, la sento forte e chiaro.', 'A presto, Pietro! [RIATTACCA]'], ['Sì, ti sento', 'Perfetto, ciao'])
  const esito = await t.esegui({ motivo: 'prova', apertura: 'Ué Pietro, mi sente?', nome: 'Pietro' })
  telefono.spegni()
  assert.equal(esito.esito, 'conclusa')
  assert.deepEqual(
    esito.conversazione.map((b) => `${b.chi}: ${b.testo}`),
    ['ambrogio: Ué Pietro, mi sente?', 'pietro: Sì, ti sento', 'ambrogio: Benissimo, la sento forte e chiaro.', 'pietro: Perfetto, ciao', 'ambrogio: A presto, Pietro!'],
  )
  assert.match(richieste[0], /TELEFONATA.*Motivo della chiamata: prova/s)
  assert.match(richieste[0], /«Sì, ti sento»/)
  assert.doesNotMatch(richieste[1], /Motivo/)
})

test('nessuna risposta e telefono non configurato bene', async () => {
  process.env.FINTO_TELEFONO = 'occupato'
  let telefono = nuovoTelefono()
  let esito = await telefonata(telefono, [], []).t.esegui({ motivo: 'x', apertura: 'y', nome: 'Pietro' })
  telefono.spegni()
  assert.equal(esito.esito, 'nessuna-risposta')
  assert.equal(esito.motivo, 'Declined')

  process.env.FINTO_TELEFONO = 'rotto'
  telefono = nuovoTelefono()
  esito = await telefonata(telefono, [], []).t.esegui({ motivo: 'x', apertura: 'y', nome: 'Pietro' })
  assert.equal(esito.esito, 'errore')
  assert.match(esito.motivo ?? '', /password di Ambrogio/)
  assert.equal(telefono.stato, 'errore')
})

test('strada veloce: Gemini capisce e risponde; Claude solo quando serve (email, memoria…)', async () => {
  process.env.FINTO_TELEFONO = 'ok'
  const telefono = nuovoTelefono()
  const veloci = [
    { detto: 'Ciao Ambrogio', risposta: 'Ué Pietro, eccomi!', azione: 'rispondi' as const },
    { detto: 'Leggimi le email', risposta: 'Un attimo che controllo.', azione: 'claude' as const },
  ]
  const istruzioni: string[] = []
  const aClaude: string[] = []
  const t = new Telefonata({
    telefono,
    cartella: fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-tel-')),
    sintetizza: async (testo) => Buffer.from(`WAV:${testo}`),
    trascrivi: async () => {
      throw new Error('non deve servire')
    },
    capisci: async (_audio, i) => {
      istruzioni.push(i)
      return veloci.shift()!
    },
    contesto: () => '- (preferenza) caffè: macchiato',
    rispondi: async (r) => {
      aClaude.push(r)
      return 'Hai due email nuove, niente di urgente. A dopo! [RIATTACCA]'
    },
  })
  const esito = await t.esegui({ motivo: 'prova', apertura: 'Ué Pietro!', nome: 'Pietro' })
  telefono.spegni()
  assert.equal(esito.esito, 'conclusa')
  assert.deepEqual(
    esito.conversazione.map((b) => `${b.chi}: ${b.testo}`),
    [
      'ambrogio: Ué Pietro!',
      'pietro: Ciao Ambrogio',
      'ambrogio: Ué Pietro, eccomi!',
      'pietro: Leggimi le email',
      'ambrogio: Ghe pènsi mì, fìga! Un attimo che controllo.',
      'ambrogio: Hai due email nuove, niente di urgente. A dopo!',
    ],
  )
  assert.equal(aClaude.length, 1, 'Claude solo per le email')
  assert.match(aClaude[0], /Leggimi le email/)
  assert.match(istruzioni[0], /caffè: macchiato[\s\S]*JSON/)
  assert.match(istruzioni[1], /Pietro: Ciao Ambrogio/, 'la conversazione finora passa a Gemini')
})
