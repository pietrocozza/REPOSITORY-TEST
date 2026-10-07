import http from 'node:http'
import type { Config } from '../config.ts'
import type { Agente } from '../agent/agente.ts'
import type { EventoAgente } from '../agent/eventi.ts'
import { diagnostica } from '../diagnostica.ts'
import { personalitaValida } from '../agent/istruzioni.ts'
import { CARTELLA_JARVIS } from '../config.ts'
import { Aggiornamenti, shaValido } from '../codice/aggiornamenti.ts'

// Server HTTP locale (solo 127.0.0.1). Accetta richieste unicamente dall'interfaccia di Jarvis:
// un sito web qualsiasi aperto nel browser non può comandare l'agente.

const MAX_CORPO = 64 * 1024

function inviaJson(res: http.ServerResponse, codice: number, dati: unknown) {
  res.writeHead(codice, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(dati))
}

async function leggiTesto(req: http.IncomingMessage) {
  let corpo = ''
  for await (const pezzo of req) {
    corpo += pezzo
    if (corpo.length > MAX_CORPO) throw new Error('troppo grande')
  }
  return corpo
}

async function leggiJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const corpo = await leggiTesto(req)
  const dati = corpo ? JSON.parse(corpo) : {}
  if (!dati || typeof dati !== 'object' || Array.isArray(dati)) throw new Error('formato non valido')
  return dati
}

type GestoreMcp = (req: http.IncomingMessage, res: http.ServerResponse, corpo: string) => Promise<unknown>

export function creaServer(config: Config, agente: Agente, opzioni: { mcp?: GestoreMcp; codice?: Aggiornamenti } = {}) {
  const codice = opzioni.codice ?? new Aggiornamenti(CARTELLA_JARVIS)
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://locale')

    // Protezione: le richieste dal browser portano l'intestazione Origin, che deve essere l'interfaccia di Jarvis
    const origine = req.headers.origin
    if (origine && !config.originiConsentite.includes(origine)) return inviaJson(res, 403, { errore: 'Origine non autorizzata.' })
    if (req.method === 'POST' && !String(req.headers['content-type'] ?? '').includes('application/json'))
      return inviaJson(res, 415, { errore: 'Serve un corpo JSON.' })

    try {
      // il server MCP usato da Claude Code per gli strumenti di Jarvis (protetto da chiave)
      if (url.pathname === '/mcp' && opzioni.mcp) {
        return await opzioni.mcp(req, res, req.method === 'POST' ? await leggiTesto(req) : '')
      }

      if (req.method === 'GET' && url.pathname === '/api/conversazione') {
        return inviaJson(res, 200, { sessione: agente.sessione.id, messaggi: agente.messaggi() })
      }

      if (req.method === 'GET' && url.pathname === '/api/registro') {
        return inviaJson(res, 200, { voci: agente.db.registro(300) })
      }

      if (req.method === 'GET' && url.pathname === '/api/pratiche') {
        return inviaJson(res, 200, { pratiche: agente.db.pratiche() })
      }

      if (req.method === 'GET' && url.pathname === '/api/memorie') {
        return inviaJson(res, 200, { memorie: agente.db.cercaMemorie('', undefined, 500) })
      }
      const memoria = url.pathname.match(/^\/api\/memorie\/(\d+)$/)
      if (req.method === 'DELETE' && memoria) {
        // cancellazione fatta da Pietro in persona dall'interfaccia
        const m = agente.db.memoria(Number(memoria[1]))
        const ok = agente.db.dimentica(Number(memoria[1]))
        if (ok && m) agente.db.registra('memoria', `Memoria cancellata dall'utente: ${m.titolo}`)
        return inviaJson(res, ok ? 200 : 404, { ok })
      }

      if (req.method === 'GET' && url.pathname === '/api/autorizzazioni') {
        return inviaJson(res, 200, { inAttesa: agente.db.autorizzazioniInAttesa(), permanenti: agente.db.permessiPermanenti() })
      }
      const autorizzazione = url.pathname.match(/^\/api\/autorizzazioni\/(\d+)$/)
      if (req.method === 'POST' && autorizzazione) {
        const dati = await leggiJson(req)
        if (dati.decisione !== 'concedi' && dati.decisione !== 'nega') return inviaJson(res, 400, { errore: 'Decisione non valida.' })
        const ok = agente.gestore.decidi(Number(autorizzazione[1]), dati.decisione === 'concedi', dati.sempre === true)
        return inviaJson(res, ok ? 200 : 409, { ok })
      }
      const permesso = url.pathname.match(/^\/api\/permessi\/([a-z_]+)$/)
      if (req.method === 'DELETE' && permesso) {
        agente.db.revocaPermanente(permesso[1])
        agente.db.registra('autorizzazione', `Permesso permanente revocato per: ${permesso[1]}`)
        return inviaJson(res, 200, { ok: true })
      }

      // aggiornamenti del codice di Jarvis (sezione "Codice"): solo lettura
      if (req.method === 'GET' && url.pathname === '/api/codice') {
        return inviaJson(res, 200, await codice.elenco(url.searchParams.get('controlla') === '1'))
      }
      const aggiornamento = url.pathname.match(/^\/api\/codice\/([0-9a-f]+)$/)
      if (req.method === 'GET' && aggiornamento) {
        if (!shaValido(aggiornamento[1])) return inviaJson(res, 400, { errore: 'Aggiornamento non valido.' })
        try {
          return inviaJson(res, 200, await codice.dettaglio(aggiornamento[1]))
        } catch {
          return inviaJson(res, 404, { errore: 'Aggiornamento non trovato.' })
        }
      }

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

      if (url.pathname === '/api/impostazioni') {
        if (req.method === 'POST') {
          const dati = await leggiJson(req)
          if (dati.personalita !== undefined) {
            if (!personalitaValida(dati.personalita)) return inviaJson(res, 400, { errore: 'Personalità sconosciuta.' })
            agente.impostaPersonalita(dati.personalita)
          }
        }
        return inviaJson(res, 200, { personalita: agente.personalita, personalitaDisponibili: agente.elencoPersonalita() })
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
