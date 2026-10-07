import http from 'node:http'
import type { Config } from '../config.ts'
import type { Agente } from '../agent/agente.ts'
import type { EventoAgente } from '../agent/eventi.ts'
import { diagnostica } from '../diagnostica.ts'
import { personalitaValida } from '../agent/istruzioni.ts'
import { CARTELLA_AMBROGIO } from '../config.ts'
import { Aggiornamenti, shaValido } from '../codice/aggiornamenti.ts'
import { ErroreVoce, VOCI_GEMINI, VoceGemini } from '../voce/gemini.ts'
import { VoceElevenLabs } from '../voce/elevenlabs.ts'
import { Trascrizione } from '../voce/trascrizione.ts'
import { AccessoGoogle, ErroreGoogle } from '../integrazioni/google.ts'
import type { Gmail } from '../integrazioni/gmail.ts'
import { frasiDaPreparare } from '../voce/frasi-pronte.ts'
import { STILE_VOCE_PREDEFINITO, cervelloValido } from '../impostazioni.ts'
import path from 'node:path'

// Server HTTP locale (solo 127.0.0.1). Accetta richieste unicamente dall'interfaccia di Ambrogio:
// un sito web qualsiasi aperto nel browser non può comandare l'agente.

const MAX_CORPO = 64 * 1024
const MAX_AUDIO = 4 * 1024 * 1024

async function leggiAudio(req: http.IncomingMessage) {
  const pezzi: Buffer[] = []
  let totale = 0
  for await (const pezzo of req) {
    totale += pezzo.length
    if (totale > MAX_AUDIO) throw new Error('audio troppo lungo')
    pezzi.push(pezzo)
  }
  return Buffer.concat(pezzi)
}

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

type OpzioniServer = {
  mcp?: GestoreMcp
  codice?: Aggiornamenti
  voce?: VoceGemini
  elevenlabs?: VoceElevenLabs
  trascrizione?: Trascrizione
  google?: AccessoGoogle
  gmail?: Gmail
}

/** Pagina mostrata dopo il «Consenti» di Google (si chiude da sola) */
function paginaGoogle(titolo: string, testo: string, ok: boolean) {
  const colore = ok ? '#77e6ed' : '#ff947f'
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Ambrogio</title></head>
<body style="margin:0;height:100vh;display:grid;place-items:center;background:#03090f;color:#d3e8ef;font-family:Segoe UI,system-ui,sans-serif">
<div style="max-width:420px;padding:28px;text-align:center"><div style="font:11px monospace;letter-spacing:3px;color:${colore}">AMBROGIO</div>
<h1 style="font-weight:400;font-size:22px">${titolo}</h1><p style="color:#8aa3ae;line-height:1.6">${testo}</p></div>
${ok ? '<script>setTimeout(() => window.close(), 2500)</script>' : ''}</body></html>`
}

export function creaServer(config: Config, agente: Agente, opzioni: OpzioniServer = {}) {
  // la voce di Ambrogio: ElevenLabs se c'è la sua chiave, altrimenti Gemini, altrimenti (nell'interfaccia) Edge
  const cartellaVoce = path.join(config.cartellaDati, 'voce')
  const gemini = opzioni.voce ?? new VoceGemini({ ...config.gemini, cartellaCache: cartellaVoce, stile: () => agente.stileVoce })
  const eleven = opzioni.elevenlabs ?? new VoceElevenLabs({ ...config.elevenlabs, cartellaCache: cartellaVoce })
  const orecchie = opzioni.trascrizione ?? new Trascrizione({ chiave: config.gemini.chiave, url: config.gemini.url })
  const codice = opzioni.codice ?? new Aggiornamenti(CARTELLA_AMBROGIO)
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://locale')

    // Protezione: le richieste dal browser portano l'intestazione Origin, che deve essere l'interfaccia di Ambrogio
    const origine = req.headers.origin
    if (origine && !config.originiConsentite.includes(origine)) return inviaJson(res, 403, { errore: 'Origine non autorizzata.' })
    const tipoCorpo = String(req.headers['content-type'] ?? '')
    const eAudio = url.pathname === '/api/trascrivi' && tipoCorpo.startsWith('audio/')
    if (req.method === 'POST' && !tipoCorpo.includes('application/json') && !eAudio) return inviaJson(res, 415, { errore: 'Serve un corpo JSON.' })

    try {
      // il server MCP usato da Claude Code per gli strumenti di Ambrogio (protetto da chiave)
      if (url.pathname === '/mcp' && opzioni.mcp) {
        return await opzioni.mcp(req, res, req.method === 'POST' ? await leggiTesto(req) : '')
      }

      if (req.method === 'GET' && url.pathname === '/api/conversazione') {
        return inviaJson(res, 200, { sessione: agente.sessione.id, messaggi: agente.messaggi() })
      }

      if (req.method === 'POST' && url.pathname === '/api/registro') {
        const dati = await leggiJson(req)
        const descrizione = typeof dati.descrizione === 'string' ? dati.descrizione.trim().slice(0, 500) : ''
        if (!descrizione) return inviaJson(res, 400, { errore: 'Descrizione vuota.' })
        agente.db.registra('problema', descrizione)
        return inviaJson(res, 200, { ok: true })
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

      // aggiornamenti del codice di Ambrogio (sezione "Codice"): solo lettura
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

      // voce di Ambrogio: le chiavi restano qui nel backend
      if (req.method === 'GET' && url.pathname === '/api/voce') {
        const trascrizione = orecchie.disponibile
        if (eleven.disponibile) return inviaJson(res, 200, { ...(await eleven.stato()), trascrizione })
        return inviaJson(res, 200, { fornitore: gemini.disponibile ? 'gemini' : null, ...gemini.stato(), trascrizione })
      }
      // archivio delle frasi pronte: le registra una volta con la voce scelta (solo Gemini a pagamento)
      if (req.method === 'POST' && url.pathname === '/api/voce/prepara') {
        const dati = await leggiJson(req)
        const voceScelta = VOCI_GEMINI.find((v) => v.id === dati.voce)?.id ?? VOCI_GEMINI[0].id
        const dallInterfaccia = Array.isArray(dati.frasi) ? dati.frasi.filter((f): f is string => typeof f === 'string').slice(0, 200) : []
        const avviata = !eleven.disponibile && gemini.prepara(frasiDaPreparare(config.appellativo, dallInterfaccia), voceScelta)
        return inviaJson(res, 200, { avviata, preparazione: gemini.preparazione })
      }

      // quello che dici dopo aver premuto il microfono, trasformato in testo da Gemini
      if (req.method === 'POST' && url.pathname === '/api/trascrivi') {
        if (!eAudio) return inviaJson(res, 415, { errore: 'Serve un file audio.' })
        try {
          const testo = await orecchie.trascrivi(await leggiAudio(req), tipoCorpo)
          return inviaJson(res, 200, { testo })
        } catch (err) {
          const e = err instanceof ErroreVoce ? err : new ErroreVoce('errore', (err as Error).message)
          agente.db.registra('errore', `Ascolto: ${e.message}`)
          return inviaJson(res, e.tipo === 'senza-chiave' ? 409 : e.tipo === 'limite' ? 429 : 502, { errore: e.message })
        }
      }

      if (req.method === 'POST' && url.pathname === '/api/voce') {
        const dati = await leggiJson(req)
        const testo = typeof dati.testo === 'string' ? dati.testo.trim().slice(0, 3000) : ''
        if (!testo) return inviaJson(res, 400, { errore: 'Testo vuoto.' })
        const motore = eleven.disponibile ? eleven : gemini
        try {
          let audio: Buffer
          let tipo: string
          if (motore === eleven) {
            audio = await eleven.sintetizza(testo, String(dati.voce ?? ''), dati.qualita === 'massima' ? 'massima' : 'veloce')
            tipo = 'audio/mpeg'
          } else {
            audio = await gemini.sintetizza(testo, VOCI_GEMINI.find((v) => v.id === dati.voce)?.id ?? VOCI_GEMINI[0].id)
            tipo = 'audio/wav'
          }
          res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': audio.length, 'Cache-Control': 'no-store' })
          return res.end(audio)
        } catch (err) {
          const e = err instanceof ErroreVoce ? err : new ErroreVoce('errore', (err as Error).message)
          if (e.tipo === 'limite') agente.db.registra('voce', e.message)
          const riprovaTra = Math.max(0, Math.round((motore.sospesaFinoA - Date.now()) / 1000))
          return inviaJson(res, e.tipo === 'senza-chiave' ? 409 : e.tipo === 'limite' ? 429 : 502, { errore: e.message, tipo: e.tipo, riprovaTra })
        }
      }

      // ───────── Gmail (accesso ufficiale di Google) ─────────
      const google = opzioni.google
      if (url.pathname === '/api/google' && google) {
        if (req.method === 'DELETE') {
          await google.scollega()
          agente.db.registra('sistema', 'Gmail scollegato')
        }
        return inviaJson(res, 200, google.stato())
      }
      if (req.method === 'GET' && url.pathname === '/api/google/collega' && google) {
        try {
          res.writeHead(302, { Location: google.indirizzoConsenso(), 'Cache-Control': 'no-store' })
          return res.end()
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          return res.end(paginaGoogle('Gmail non è ancora configurato', (err as Error).message + ' Segui la guida nel README.', false))
        }
      }
      if (req.method === 'GET' && url.pathname === '/api/google/ritorno' && google) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
        if (url.searchParams.get('error')) {
          return res.end(paginaGoogle('Collegamento annullato', 'Non hai dato il permesso a Google: Gmail resta scollegato. Puoi riprovare quando vuoi dal menu Email.', false))
        }
        try {
          const email = await google.completa(url.searchParams.get('code') ?? '', url.searchParams.get('state') ?? '')
          agente.db.registra('sistema', `Gmail collegato${email ? `: ${email}` : ''}`)
          return res.end(paginaGoogle('Gmail collegato', `${email ? `Ambrogio ora può leggere la posta di ${email}.` : 'Fatto.'} Questa finestra si chiude da sola.`, true))
        } catch (err) {
          return res.end(paginaGoogle('Qualcosa non è andato', (err as Error).message, false))
        }
      }
      if (req.method === 'GET' && url.pathname === '/api/email' && opzioni.gmail) {
        if (!opzioni.gmail.collegato) return inviaJson(res, 409, { errore: 'Gmail non è collegato.' })
        try {
          const quante = Math.min(25, Number(url.searchParams.get('quante')) || 15)
          return inviaJson(res, 200, { email: await opzioni.gmail.elenco(url.searchParams.get('cerca') || 'in:inbox', quante) })
        } catch (err) {
          const scaduto = err instanceof ErroreGoogle && err.tipo === 'scaduto'
          return inviaJson(res, scaduto ? 409 : 502, { errore: (err as Error).message })
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
          if (dati.cervello !== undefined) {
            if (!cervelloValido(dati.cervello)) return inviaJson(res, 400, { errore: 'Scelta non valida.' })
            agente.impostaCervello(dati.cervello)
          }
          if (dati.stileVoce !== undefined) {
            if (typeof dati.stileVoce !== 'string') return inviaJson(res, 400, { errore: 'Stile non valido.' })
            agente.impostaStileVoce(dati.stileVoce)
          }
        }
        return inviaJson(res, 200, {
          personalita: agente.personalita,
          personalitaDisponibili: agente.elencoPersonalita(),
          stileVoce: agente.stileVoce,
          cervello: agente.cervello,
          stileVocePredefinito: STILE_VOCE_PREDEFINITO,
        })
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
