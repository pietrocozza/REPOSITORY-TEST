import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import { AccessoGoogle } from '../src/integrazioni/google.ts'
import { Gmail, componiEmail, htmlInTesto, testoDelMessaggio } from '../src/integrazioni/gmail.ts'
import { STRUMENTI, servizi } from '../src/strumenti/catalogo.ts'

// Un finto Google: pagina dei token e API di Gmail
const b64 = (t: string) => Buffer.from(t).toString('base64url')
let ultimoToken: Record<string, string> = {}
let tokenValido = 'accesso-1'
let refreshRevocato = false
const inviati: { raw: string; threadId?: string }[] = []
const bozze: { message: { raw: string; threadId?: string } }[] = []
const finto = http.createServer(async (req, res) => {
  let corpo = ''
  for await (const p of req) corpo += p
  const json = (codice: number, dati: unknown) => res.writeHead(codice, { 'Content-Type': 'application/json' }).end(JSON.stringify(dati))
  if (req.url === '/token') {
    ultimoToken = Object.fromEntries(new URLSearchParams(corpo))
    if (ultimoToken.grant_type === 'refresh_token' && refreshRevocato) return json(400, { error: 'invalid_grant' })
    tokenValido = `accesso-${Date.now()}`
    return json(200, { access_token: tokenValido, refresh_token: ultimoToken.grant_type === 'authorization_code' ? 'duraturo' : undefined, expires_in: 3600, scope: 'gmail' })
  }
  if (req.headers.authorization !== `Bearer ${tokenValido}`) return json(401, { error: { message: 'non autorizzato' } })
  const u = new URL(req.url ?? '/', 'http://x')
  if (u.pathname === '/gmail/v1/users/me/profile') return json(200, { emailAddress: 'pietrocozza.business@gmail.com' })
  if (u.pathname === '/gmail/v1/users/me/messages') return json(200, { messages: [{ id: 'msg000001' }] })
  if (u.pathname === '/gmail/v1/users/me/messages/msg000001') {
    return json(200, {
      id: 'msg000001',
      threadId: 'filo1',
      snippet: 'Ciao, a che ora posso fare il check-in?',
      labelIds: ['INBOX', 'UNREAD'],
      internalDate: '1791380000000',
      payload: {
        headers: [
          { name: 'From', value: 'Airbnb <express@airbnb.com>' },
          { name: 'To', value: 'pietrocozza.business@gmail.com' },
          { name: 'Subject', value: 'Messaggio da Anna' },
          { name: 'Message-ID', value: '<abc@airbnb.com>' },
        ],
        mimeType: 'multipart/alternative',
        parts: [
          { mimeType: 'text/html', body: { data: b64('<p>Ciao,&nbsp;a che ora?</p>') } },
          { mimeType: 'text/plain', body: { data: b64('Ciao, a che ora posso fare il check-in?') } },
        ],
      },
    })
  }
  if (u.pathname === '/gmail/v1/users/me/messages/send') {
    inviati.push(JSON.parse(corpo))
    return json(200, { id: 'inviato1' })
  }
  if (u.pathname === '/gmail/v1/users/me/drafts') {
    bozze.push(JSON.parse(corpo))
    return json(200, { id: 'bozza1' })
  }
  json(404, { error: { message: 'boh' } })
})
let base = ''
before(async () => {
  await new Promise<void>((r) => finto.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${(finto.address() as AddressInfo).port}`
})
after(() => finto.close())

const nuovoAccesso = (cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-google-'))) =>
  new AccessoGoogle({
    clientId: 'app',
    clientSecret: 'segreto-app',
    ritorno: 'http://127.0.0.1:8787/api/google/ritorno',
    cartellaDati: cartella,
    suggerimento: 'pietrocozza.business@gmail.com',
    urlAuth: `${base}/auth`,
    urlToken: `${base}/token`,
    urlApi: base,
  })

test('collegamento: pagina di Google con protezioni, poi il permesso si salva solo sul PC', async () => {
  const cartella = fs.mkdtempSync(path.join(os.tmpdir(), 'ambrogio-google-'))
  const g = nuovoAccesso(cartella)
  assert.equal(g.stato().collegato, false)
  const indirizzo = new URL(g.indirizzoConsenso())
  const p = indirizzo.searchParams
  assert.equal(p.get('redirect_uri'), 'http://127.0.0.1:8787/api/google/ritorno')
  assert.equal(p.get('access_type'), 'offline')
  assert.equal(p.get('code_challenge_method'), 'S256')
  assert.equal(p.get('login_hint'), 'pietrocozza.business@gmail.com')
  assert.match(p.get('scope') ?? '', /gmail\.readonly/)

  await assert.rejects(g.completa('codice', 'stato-falso'), /non valido/)
  const email = await g.completa('codice-di-google', p.get('state') ?? '')
  assert.equal(email, 'pietrocozza.business@gmail.com')
  // il verificatore PKCE corrisponde alla sfida mandata a Google
  assert.equal(createHash('sha256').update(ultimoToken.code_verifier).digest('base64url'), p.get('code_challenge'))
  assert.equal(nuovoAccesso(cartella).stato().email, 'pietrocozza.business@gmail.com', 'dopo un riavvio resta collegato')
  await assert.rejects(g.completa('codice-di-google', p.get('state') ?? ''), /non valido/, 'lo stesso stato non vale due volte')
})

test('Gmail: elenco, testo, bozza e risposta nella stessa conversazione', async () => {
  const g = nuovoAccesso()
  await g.completa('c', new URL(g.indirizzoConsenso()).searchParams.get('state') ?? '')
  const gmail = new Gmail(g)
  const [e] = await gmail.elenco('from:airbnb')
  assert.deepEqual({ da: e.da, oggetto: e.oggetto, nonLetta: e.nonLetta }, { da: 'Airbnb <express@airbnb.com>', oggetto: 'Messaggio da Anna', nonLetta: true })
  assert.equal((await gmail.apri('msg000001')).testo, 'Ciao, a che ora posso fare il check-in?')

  await gmail.bozza({ a: 'anna@example.com', oggetto: '', testo: 'Ciao Anna', rispondiA: 'msg000001' })
  assert.equal(bozze.at(-1)?.message.threadId, 'filo1')
  await gmail.invia({ a: 'anna@example.com', oggetto: '', testo: 'Il check-in è dalle 15.', rispondiA: 'msg000001' })
  const raw = Buffer.from(inviati.at(-1)!.raw, 'base64url').toString()
  assert.match(raw, /Subject: Re: Messaggio da Anna/)
  assert.match(raw, /In-Reply-To: <abc@airbnb.com>/)
  assert.equal(inviati.at(-1)?.threadId, 'filo1')
})

test('permesso scaduto o revocato: Ambrogio lo dice e chiede di ricollegare', async () => {
  const g = nuovoAccesso()
  await g.completa('c', new URL(g.indirizzoConsenso()).searchParams.get('state') ?? '')
  tokenValido = 'cambiato' // il lasciapassare non vale più: Ambrogio prova a rinnovarlo
  refreshRevocato = true
  await assert.rejects(new Gmail(g).elenco(), /ricollega Gmail/)
  assert.equal(g.stato().collegato, false)
  refreshRevocato = false
})

test('formato delle email e strumenti', async () => {
  const raw = Buffer.from(componiEmail({ a: 'x@y.it', oggetto: 'Prenotazione è confermata', testo: 'Città: Roma' }), 'base64url').toString()
  assert.match(raw, /Subject: =\?UTF-8\?B\?/)
  assert.equal(Buffer.from(raw.split('\r\n\r\n')[1].replace(/\r\n/g, ''), 'base64').toString(), 'Città: Roma')
  assert.equal(htmlInTesto('<style>x</style><p>Uno&amp;due</p><br>tre'), 'Uno&due\n\ntre')
  assert.equal(testoDelMessaggio(undefined), '')

  // senza Gmail collegato gli strumenti lo spiegano
  servizi.gmail = undefined
  const leggi = STRUMENTI.find((s) => s.nome === 'leggi_email')!
  await assert.rejects(Promise.resolve().then(() => leggi.esegui({}, null as never)), /non è collegato/)
  assert.equal(STRUMENTI.find((s) => s.nome === 'invia_email')!.livello, 2, "l'invio chiede sempre il permesso")
})
