import { config } from './config.ts'
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
import { servizi } from './strumenti/catalogo.ts'

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
const server = creaServer(config, agente, { mcp: creaServerMcp(gestore, chiaveMcp), google, gmail: servizi.gmail })
db.registra('sistema', 'Ambrogio avviato')

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
