import { config, CARTELLA_AMBROGIO } from './config.ts'
import { execFileSync } from 'node:child_process'
import { Agente } from './agent/agente.ts'
import { trovaClaude } from './agent/eseguibile.ts'
import { diagnostica } from './diagnostica.ts'
import { creaServer } from './http/server.ts'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { Database } from './database/db.ts'
import { GestorePermessi } from './permessi/gestore.ts'
import { creaServerMcp } from './mcp/server.ts'
import { AccessoGoogle } from './integrazioni/google.ts'
import { Gmail } from './integrazioni/gmail.ts'
import { CalendarioGoogle } from './integrazioni/calendario.ts'
import { Airbnb, schedaCasa } from './integrazioni/airbnb.ts'
import { servizi } from './strumenti/catalogo.ts'
import { ArchivioAirbnb } from './integrazioni/archivio-airbnb.ts'
import { Trascrizione } from './voce/trascrizione.ts'
import { FoglioSpese } from './integrazioni/spese.ts'

// Avvio del backend locale di Ambrogio.

const claude = trovaClaude(config.claude.percorso || undefined)
if (!claude) {
  console.error('[ambrogio] Claude Code non trovato: il backend parte lo stesso, ma la chat non funzionerà.')
}

// memoria (SQLite), permessi e chiave segreta del server MCP (nuova a ogni avvio)
const db = new Database(path.join(config.cartellaDati, 'ambrogio.sqlite'))
const gestore = new GestorePermessi(db)
const chiaveMcp = randomBytes(24).toString('hex')
const agente = new Agente(config, claude ?? { comando: 'claude', prefisso: [], shell: false, descrizione: 'non trovato' }, {
  db,
  gestore,
  mcp: { url: `http://${config.host}:${config.porta}/mcp`, chiave: chiaveMcp },
})
// Gmail (se collegato): il permesso di Google resta in data/google-token.json
const google = new AccessoGoogle({
  clientId: config.google.clientId,
  clientSecret: config.google.clientSecret,
  ritorno: `http://${config.host}:${config.porta}/api/google/ritorno`,
  cartellaDati: config.cartellaDati,
  suggerimento: config.google.email || undefined,
  ...(config.google.urlFinto
    ? { urlAuth: `${config.google.urlFinto}/auth`, urlToken: `${config.google.urlFinto}/token`, urlApi: config.google.urlFinto }
    : {}),
})
servizi.gmail = new Gmail(google)
servizi.calendario = new CalendarioGoogle(google)
servizi.airbnb = new Airbnb(config.airbnb.case)
servizi.cartellaDati = config.cartellaDati
// il foglio Google delle spese (Ambrogio vede solo i file che crea lui)
servizi.spese = new FoglioSpese(google, config.cartellaDati)
// la scheda della casa 1 (si crea il modello da riempire, se manca)
schedaCasa(config.cartellaDati, 1)
// le case Airbnb si tengono aggiornate da sole: ogni minuto le email nuove di Airbnb, la mattina e la sera i promemoria
const gemini = new Trascrizione({ chiave: config.gemini.chiave, url: config.gemini.url })
const fusoRoma = (opz: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', ...opz })
const archivio = new ArchivioAirbnb({
  db,
  gmail: servizi.gmail,
  airbnb: servizi.airbnb,
  leggi: gemini.disponibile ? (istruzioni, testo) => gemini.estrai(istruzioni, testo) : undefined,
  oggi: () => fusoRoma({}).format(new Date()),
  ora: () => Number(fusoRoma({ hour: '2-digit', hourCycle: 'h23' }).format(new Date())),
  escludi: config.airbnb.escludi,
})
servizi.escludi = config.airbnb.escludi
servizi.archivio = archivio
archivio.avvia()
const server = creaServer(config, agente, { mcp: creaServerMcp(gestore, chiaveMcp), google, gmail: servizi.gmail, archivio })
// la versione accesa (utile per capire se un aggiornamento è davvero partito)
let versione = ''
try {
  versione = execFileSync('git', ['log', '-1', '--format=%h %cd', '--date=format:%d/%m %H:%M'], { cwd: CARTELLA_AMBROGIO, encoding: 'utf8', timeout: 5000 }).trim()
} catch {
  // git non disponibile
}
db.registra('sistema', `Ambrogio avviato${versione ? ` (versione ${versione})` : ''}`)
console.log(`[ambrogio] versione ${versione || 'sconosciuta'}`)

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') console.error(`[ambrogio] La porta ${config.porta} è già occupata: forse Ambrogio è già acceso.`)
  else console.error('[ambrogio] Errore del server:', err.message)
  process.exit(1)
})

server.listen(config.porta, config.host, async () => {
  console.log(`[ambrogio] backend in ascolto su http://${config.host}:${config.porta} (solo questo computer)`)
  // controlli di salute dopo l'avvio, così l'interfaccia non resta in attesa
  // Claude Code si accende subito, così il primo messaggio non aspetta
  agente.prepara()
  console.log(`[ambrogio] Claude Code: modalità ${agente.modalita}`)
  const esito = await diagnostica(config)
  for (const c of esito.controlli) {
    console.log(`[ambrogio] ${c.ok ? 'OK' : 'NO'} ${c.nome}: ${c.dettaglio}`)
    if (c.aiuto) console.log(`[ambrogio]    → ${c.aiuto}`)
  }
})

const spegni = () => {
  agente.spegni()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGINT', spegni)
process.on('SIGTERM', spegni)
