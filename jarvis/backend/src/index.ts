import { config } from './config.ts'
import { Agente } from './agent/agente.ts'
import { trovaClaude } from './agent/eseguibile.ts'
import { diagnostica } from './diagnostica.ts'
import { creaServer } from './http/server.ts'

// Avvio del backend locale di Jarvis.

const claude = trovaClaude(config.claude.percorso || undefined)
if (!claude) {
  console.error('[jarvis] Claude Code non trovato: il backend parte lo stesso, ma la chat non funzionerà.')
}

const agente = new Agente(config, claude ?? { comando: 'claude', prefisso: [], shell: false, descrizione: 'non trovato' })
const server = creaServer(config, agente)

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') console.error(`[jarvis] La porta ${config.porta} è già occupata: forse Jarvis è già acceso.`)
  else console.error('[jarvis] Errore del server:', err.message)
  process.exit(1)
})

server.listen(config.porta, config.host, async () => {
  console.log(`[jarvis] backend in ascolto su http://${config.host}:${config.porta} (solo questo computer)`)
  // controlli di salute dopo l'avvio, così l'interfaccia non resta in attesa
  // Claude Code si accende subito, così il primo messaggio non aspetta
  agente.prepara()
  console.log(`[jarvis] Claude Code: modalità ${agente.modalita}`)
  const esito = await diagnostica(config)
  for (const c of esito.controlli) {
    console.log(`[jarvis] ${c.ok ? 'OK' : 'NO'} ${c.nome}: ${c.dettaglio}`)
    if (c.aiuto) console.log(`[jarvis]    → ${c.aiuto}`)
  }
})

const spegni = () => {
  agente.spegni()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGINT', spegni)
process.on('SIGTERM', spegni)
