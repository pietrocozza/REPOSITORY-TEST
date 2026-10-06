import http from 'node:http'
import type { Config } from '../config.ts'
import type { Agente } from '../agent/agente.ts'
import type { EventoAgente } from '../agent/eventi.ts'
import { diagnostica } from '../diagnostica.ts'

// Server HTTP locale (solo 127.0.0.1). Accetta richieste unicamente dall'interfaccia di Jarvis:
// un sito web qualsiasi aperto nel browser non può comandare l'agente.

const MAX_CORPO = 64 * 1024

function inviaJson(res: http.ServerResponse, codice: number, dati: unknown) {
  res.writeHead(codice, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(dati))
}

async function leggiJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let corpo = ''
  for await (const pezzo of req) {
    corpo += pezzo
    if (corpo.length > MAX_CORPO) throw new Error('troppo grande')
  }
  const dati = corpo ? JSON.parse(corpo) : {}
  if (!dati || typeof dati !== 'object' || Array.isArray(dati)) throw new Error('formato non valido')
  return dati
}

export function creaServer(config: Config, agente: Agente) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://locale')

    // Protezione: le richieste dal browser portano l'intestazione Origin, che deve essere l'interfaccia di Jarvis
    const origine = req.headers.origin
    if (origine && !config.originiConsentite.includes(origine)) return inviaJson(res, 403, { errore: 'Origine non autorizzata.' })
    if (req.method === 'POST' && !String(req.headers['content-type'] ?? '').includes('application/json'))
      return inviaJson(res, 415, { errore: 'Serve un corpo JSON.' })

    try {
      if (req.method === 'GET' && url.pathname === '/api/stato') {
        return inviaJson(res, 200, { ...(await diagnostica(config)), sessione: agente.sessione.id })
      }

      if (req.method === 'POST' && url.pathname === '/api/chat') {
        const dati = await leggiJson(req)
        const messaggio = typeof dati.messaggio === 'string' ? dati.messaggio.trim().slice(0, 8000) : ''
        if (!messaggio) return inviaJson(res, 400, { errore: 'Messaggio vuoto.' })

        // Risposta in streaming: una riga JSON per evento
        res.writeHead(200, {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Accel-Buffering': 'no',
        })
        const chiusura = new AbortController()
        res.on('close', () => {
          if (!res.writableFinished) chiusura.abort()
        })
        const invia = (e: EventoAgente) => {
          if (!res.writableEnded) res.write(JSON.stringify(e) + '\n')
        }
        await agente.chat(messaggio, invia, chiusura.signal)
        return res.end()
      }

      if (req.method === 'POST' && url.pathname === '/api/chat/interrompi') {
        agente.interrompi()
        return inviaJson(res, 200, { ok: true })
      }

      if (req.method === 'POST' && url.pathname === '/api/conversazione/nuova') {
        const s = agente.nuovaConversazione()
        return inviaJson(res, 200, { ok: true, sessione: s.id })
      }

      inviaJson(res, 404, { errore: 'Indirizzo sconosciuto.' })
    } catch (err) {
      if (!res.headersSent) inviaJson(res, 400, { errore: `Richiesta non valida: ${(err as Error).message}` })
      else res.end()
    }
  })
}
