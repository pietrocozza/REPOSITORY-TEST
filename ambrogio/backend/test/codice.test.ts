import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { Aggiornamenti, leggiDiff, unisciRighe } from '../src/codice/aggiornamenti.ts'

// Un "GitHub" finto (repository locale) e due copie: quella di chi scrive il codice e quella del PC di Pietro.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-codice-'))
const git = (cartella: string, ...a: string[]) =>
  execFileSync('git', ['-c', 'user.name=Prova', '-c', 'user.email=prova@example.com', '-c', 'init.defaultBranch=main', ...a], {
    cwd: cartella,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

const remoto = path.join(tmp, 'github.git')
const autore = path.join(tmp, 'autore')
const pc = path.join(tmp, 'pc')
fs.mkdirSync(remoto)
git(remoto, 'init', '--bare', '-q')
git(tmp, 'clone', '-q', remoto, autore)
fs.mkdirSync(path.join(autore, 'ambrogio'))
fs.writeFileSync(path.join(autore, 'ambrogio', 'saluto.ts'), "export const saluto = 'ciao'\n")
fs.writeFileSync(path.join(autore, 'fuori.txt'), 'non è di Ambrogio\n')
git(autore, 'add', '.')
git(autore, 'commit', '-q', '-m', 'Primo aggiornamento', '-m', 'Ambrogio impara a salutare.\n\nCo-Authored-By: Qualcuno <x@example.com>')
git(autore, 'push', '-q', 'origin', 'HEAD:main')
git(tmp, 'clone', '-q', remoto, pc)

test('elenco: aggiornamenti installati, spiegazione senza firme, solo la cartella di Ambrogio', async () => {
  const a = new Aggiornamenti(path.join(pc, 'ambrogio'))
  const e = await a.elenco()
  assert.equal(e.disponibile, true)
  if (!e.disponibile) return
  assert.equal(e.installati.length, 1)
  assert.equal(e.installati[0].titolo, 'Primo aggiornamento')
  assert.equal(e.installati[0].spiegazione, 'Ambrogio impara a salutare.')
  assert.equal(e.inArrivo.length, 0)

  const d = await a.dettaglio(e.installati[0].sha)
  assert.deepEqual(d.file.map((f) => f.percorso), ['saluto.ts'])
  assert.equal(d.file[0].stato, 'nuovo')
  assert.deepEqual(d.file[0].righe, [{ tipo: 'aggiunta', testo: "export const saluto = 'ciao'", numero: 1 }])
})

test('aggiornamenti su GitHub non ancora scaricati: compaiono "in arrivo" dopo il controllo', async () => {
  fs.writeFileSync(path.join(autore, 'ambrogio', 'saluto.ts'), "export const saluto = 'buongiorno'\nexport const nome = 'Pietro'\n")
  git(autore, 'commit', '-q', '-am', 'Saluto più elegante')
  git(autore, 'push', '-q', 'origin', 'HEAD:main')

  const a = new Aggiornamenti(path.join(pc, 'ambrogio'))
  const prima = await a.elenco()
  assert.equal(prima.disponibile && prima.inArrivo.length, 0)
  const e = await a.elenco(true)
  assert.ok(e.disponibile)
  if (!e.disponibile) return
  assert.equal(e.github, true)
  assert.equal(e.inArrivo.length, 1)
  assert.equal(e.inArrivo[0].inArrivo, true)
  const d = await a.dettaglio(e.inArrivo[0].sha)
  assert.deepEqual(
    d.file[0]?.righe.map((r) => r.tipo),
    ['tolta', 'aggiunta', 'aggiunta'],
  )
})

test('codici non validi e cartelle senza git', async () => {
  await assert.rejects(new Aggiornamenti(pc).dettaglio('HEAD; rm -rf /'))
  const vuota = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-senza-git-'))
  const e = await new Aggiornamenti(vuota).elenco()
  assert.equal(e.disponibile, false)
})

test('diff: salti tra i blocchi, file binari e generati', () => {
  const file = leggiDiff(
    [
      'diff --git a/a.ts b/a.ts',
      'index 1..2 100644',
      '--- a/a.ts',
      '+++ b/a.ts',
      '@@ -1,2 +1,2 @@',
      ' uno',
      '-due',
      '+DUE',
      '@@ -40,1 +40,2 @@ function x()',
      ' quaranta',
      '+nuova',
      '\\ No newline at end of file',
      'diff --git a/i.png b/i.png',
      'Binary files a/i.png and b/i.png differ',
      'diff --git a/package-lock.json b/package-lock.json',
      '@@ -1 +1 @@',
      '-x',
      '+y',
    ].join('\n'),
  )
  assert.equal(file.length, 3)
  assert.deepEqual(file[0].righe.map((r) => [r.tipo, r.numero]), [
    ['uguale', 1],
    ['tolta', undefined],
    ['aggiunta', 2],
    ['salto', undefined],
    ['uguale', 40],
    ['aggiunta', 41],
  ])
  assert.equal(file[0].aggiunte, 2)
  assert.equal(file[0].tolte, 1)
  assert.ok(file[1].nota?.includes('binario'))
  assert.equal(file[2].righe.length, 0)
  assert.ok(file[2].nota?.includes('generato'))
})

test('spiegazioni: frasi riunite, paragrafi ed elenchi mantenuti', () => {
  assert.equal(
    unisciRighe('Prima frase che va\na capo.\n\n- punto uno\n  continua\n- punto due\n'),
    'Prima frase che va a capo.\n\n- punto uno continua\n- punto due',
  )
})

test('dopo il cambio di nome (jarvis → ambrogio) si vedono anche gli aggiornamenti di prima', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-nome-'))
  git(repo, 'init', '-q')
  fs.mkdirSync(path.join(repo, 'jarvis'))
  const corpo = Array.from({ length: 12 }, (_, i) => `export const riga${i} = ${i}\n`).join('')
  fs.writeFileSync(path.join(repo, 'jarvis', 'a.ts'), corpo + 'export const nome = "Jarvis"\n')
  git(repo, 'add', '.')
  git(repo, 'commit', '-q', '-m', 'Jarvis: primo')
  git(repo, 'mv', 'jarvis', 'ambrogio')
  fs.writeFileSync(path.join(repo, 'ambrogio', 'a.ts'), corpo + 'export const nome = "Ambrogio"\n')
  git(repo, 'commit', '-q', '-am', 'Ambrogio: nuovo nome')

  const a = new Aggiornamenti(path.join(repo, 'ambrogio'))
  const e = await a.elenco()
  assert.ok(e.disponibile)
  if (!e.disponibile) return
  assert.deepEqual(e.installati.map((c) => c.titolo), ['Ambrogio: nuovo nome', 'Jarvis: primo'])
  const vecchio = await a.dettaglio(e.installati[1].sha)
  assert.deepEqual(vecchio.file.map((f) => f.percorso), ['a.ts'])
  const nuovo = await a.dettaglio(e.installati[0].sha)
  assert.deepEqual(nuovo.file.map((f) => [f.percorso, f.stato]), [['a.ts', 'rinominato']])
})
