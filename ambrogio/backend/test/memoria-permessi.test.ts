import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Database } from '../src/database/db.ts'
import type { EventoAgente } from '../src/agent/eventi.ts'
import { GestorePermessi } from '../src/permessi/gestore.ts'

const nuovo = (attesaMs?: number) => {
  const db = new Database(':memory:')
  const gestore = new GestorePermessi(db, { attesaMs })
  const eventi: EventoAgente[] = []
  gestore.notifica = (e) => eventi.push(e)
  return { db, gestore, eventi }
}

test('memoria: salva, aggiorna senza duplicare, cerca', () => {
  const { db } = nuovo()
  db.ricorda('persona', 'Marco', 'Mio cugino, abita a Milano')
  db.ricorda('persona', 'marco', 'Mio cugino, abita a Torino')
  db.ricorda('preferenza', 'Caffè', 'Amaro, senza zucchero')
  assert.equal(db.cercaMemorie('').length, 2)
  assert.equal(db.cercaMemorie('torino')[0].titolo, 'Marco')
  assert.equal(db.cercaMemorie('cugino', 'preferenza').length, 0)
  assert.equal(db.cercaMemorie('100%').length, 0, 'i caratteri speciali non rompono la ricerca')
})

test('pratiche: note con data e cambio di stato', () => {
  const { db } = nuovo()
  const p = db.apriPratica('Rimborso palestra', 'Disdetta inviata')
  db.aggiornaPratica(p.id, { nota: 'Scritto all’assistenza', stato: 'in_attesa' })
  const aggiornata = db.pratica(p.id)!
  assert.equal(aggiornata.stato, 'in_attesa')
  assert.match(aggiornata.note, /Scritto all’assistenza/)
})

test('livello 1: eseguito subito e registrato', async () => {
  const { db, gestore } = nuovo()
  const esito = await gestore.esegui('ricorda', { tipo: 'regola', titolo: 'Orari', contenuto: 'Mai chiamate prima delle 9' })
  assert.equal(esito.errore, false)
  assert.equal(db.cercaMemorie('chiamate').length, 1)
  assert.ok(db.registro().some((v) => v.tipo === 'azione' && v.descrizione.includes('Orari')))
})

test('livello 3: niente succede finché Pietro non conferma', async () => {
  const { db, gestore, eventi } = nuovo()
  const m = db.ricorda('nota', 'Segreto', 'Da cancellare')
  const promessa = gestore.esegui('dimentica', { id: m.id })
  await new Promise((r) => setImmediate(r))
  assert.ok(db.memoria(m.id), 'prima della conferma la memoria esiste ancora')
  const richiesta = eventi.find((e) => e.tipo === 'conferma')
  assert.ok(richiesta && richiesta.tipo === 'conferma' && richiesta.livello === 3)
  assert.ok(eventi.some((e) => e.tipo === 'stato' && e.stato === 'WAITING_FOR_CONFIRMATION'))
  assert.equal(gestore.decidi(richiesta.id, true, true), true)
  assert.equal((await promessa).testo, 'Memoria cancellata.')
  assert.equal(db.memoria(m.id), undefined)
  assert.equal(db.permessoPermanente('dimentica'), false, '"consenti sempre" non vale mai per il livello 3')
  const descrizioni = db.registro().map((v) => v.descrizione)
  assert.ok(descrizioni.some((d) => d.startsWith('Richiesta autorizzazione')))
  assert.ok(descrizioni.some((d) => d.startsWith('Autorizzazione ricevuta')))
})

test('livello 3 rifiutato: l’azione non viene eseguita', async () => {
  const { db, gestore, eventi } = nuovo()
  const m = db.ricorda('nota', 'Resta', 'Non va cancellata')
  const promessa = gestore.esegui('dimentica', { id: m.id })
  await new Promise((r) => setImmediate(r))
  const richiesta = eventi.find((e) => e.tipo === 'conferma')!
  gestore.decidi((richiesta as { id: number }).id, false)
  assert.match((await promessa).testo, /NON ha autorizzato/)
  assert.ok(db.memoria(m.id))
  assert.ok(db.registro().some((v) => v.descrizione.startsWith('Autorizzazione negata')))
})

test('nessuna risposta: la richiesta scade e non succede niente', async () => {
  const { db, gestore } = nuovo(50)
  const m = db.ricorda('nota', 'Resta', 'Non va cancellata')
  const esito = await gestore.esegui('dimentica', { id: m.id })
  assert.match(esito.testo, /non ha risposto/)
  assert.ok(db.memoria(m.id))
  assert.equal(db.autorizzazioniInAttesa().length, 0)
})

test('argomenti non validi o strumenti inesistenti vengono respinti', async () => {
  const { gestore } = nuovo()
  assert.equal((await gestore.esegui('ricorda', { tipo: 'pirata', titolo: 'x', contenuto: 'y' })).errore, true)
  assert.equal((await gestore.esegui('ricorda', { tipo: 'nota', titolo: 'x', contenuto: 'y', extra: 1 })).errore, true)
  assert.equal((await gestore.esegui('cancella_tutto', {})).errore, true)
})

test('cambio di nome: la memoria di jarvis.sqlite diventa quella di Ambrogio', async () => {
  const fs = await import('node:fs')
  const os = await import('node:os')
  const path = await import('node:path')
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-db-'))
  const vecchio = new Database(path.join(cartella, 'jarvis.sqlite'))
  vecchio.ricorda('preferenza', 'Caffè', 'amaro')
  const nuovo = new Database(path.join(cartella, 'ambrogio.sqlite'))
  assert.equal(nuovo.cercaMemorie('Caffè')[0]?.contenuto, 'amaro')
  assert.equal(fs.existsSync(path.join(cartella, 'jarvis.sqlite')), false)
})
