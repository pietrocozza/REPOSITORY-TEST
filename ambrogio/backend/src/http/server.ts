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
import { sintetizzaWindows } from '../voce/windows.ts'
import { elencoSuoni, suono } from '../voce/suoni.ts'
import { servizi } from '../strumenti/catalogo.ts'
import { AccessoGoogle, ErroreGoogle } from '../integrazioni/google.ts'
import type { Gmail } from '../integrazioni/gmail.ts'
import { frasiDaPreparare } from '../voce/frasi-pronte.ts'
import { STILE_VOCE_PREDEFINITO, cervelloValido } from '../impostazioni.ts'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { Telefono, Telefonata, type EsitoTelefonata } from '../telefono/telefono.ts'

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
  telefono?: Telefono
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

  // ───────── Telefono (Linphone in Ubuntu) ─────────
  const telefono =
    opzioni.telefono ??
    new Telefono({ cartellaAmbrogio: CARTELLA_AMBROGIO, distro: config.telefono.distro, comando: config.telefono.comando || undefined })
  const cartellaTelefono = path.join(config.cartellaDati, 'telefono')
  // al telefono Ambrogio usa la voce scelta nell'interfaccia (l'ultima usata), salvata qui
  const fileVoceTelefono = path.join(cartellaTelefono, 'voce.txt')
  let voceTelefono = ''
  try {
    voceTelefono = fs.readFileSync(fileVoceTelefono, 'utf8').trim()
  } catch {
    // mai scelta: la prima voce di Gemini
  }
  const ricordaVoce = (voce: string) => {
    if (!voce || voce === voceTelefono) return
    voceTelefono = voce
    try {
      fs.mkdirSync(cartellaTelefono, { recursive: true })
      fs.writeFileSync(fileVoceTelefono, voce)
    } catch {
      // non importante
    }
  }
  // uso del processore: differenza tra due letture
  let cpuPrima = os.cpus().map((c) => c.times)
  const usoCpu = () => {
    const ora = os.cpus().map((c) => c.times)
    let lavoro = 0
    let totale = 0
    ora.forEach((t, i) => {
      const p = cpuPrima[i] ?? t
      const somma = (x: typeof t) => x.user + x.nice + x.sys + x.idle + x.irq
      totale += somma(t) - somma(p)
      lavoro += somma(t) - somma(p) - (t.idle - p.idle)
    })
    cpuPrima = ora
    return totale > 0 ? Math.round((lavoro / totale) * 100) : 0
  }
  const accesoDa = Date.now()

  /**
   * La voce al telefono: Gemini con la voce scelta; se Gemini è al limite per pochi secondi (al massimo 8) si aspetta,
   * altrimenti si usa la voce di Windows (gratis) per non lasciare Pietro senza risposta.
   */
  async function vocePerTelefono(testo: string): Promise<Buffer> {
    const voce = VOCI_GEMINI.find((v) => v.id === voceTelefono)?.id ?? VOCI_GEMINI[0].id
    for (let tentativo = 0; tentativo < 2; tentativo++) {
      try {
        return await gemini.sintetizza(testo, voce)
      } catch (err) {
        const attesa = gemini.sospesaFinoA - Date.now()
        if (err instanceof ErroreVoce && err.tipo === 'limite' && tentativo === 0 && attesa > 0 && attesa <= 8_000) {
          await new Promise((r) => setTimeout(r, attesa + 500))
          continue
        }
        if (process.platform !== 'win32') throw err
        agente.db.registra('voce', `Telefono: Gemini non disponibile (${(err as Error).message}), uso la voce di Windows`)
        return sintetizzaWindows(testo)
      }
    }
    return sintetizzaWindows(testo)
  }

  let telefonataInCorso = false
  let ultimaTelefonata: (EsitoTelefonata & { quando: string }) | null = null

  /** Ambrogio chiama Pietro e ci parla a botta e risposta */
  async function telefona(motivo: string, apertura: string) {
    telefonataInCorso = true
    agente.db.registra('telefono', `Chiamo ${config.appellativo}: ${motivo}`)
    const telefonata = new Telefonata({
      telefono,
      cartella: cartellaTelefono,
      sintetizza: (testo) => vocePerTelefono(testo),
      trascrivi: (audio) => orecchie.trascrivi(audio, 'audio/wav'),
      capisci: (audio, istruzioni) => orecchie.rispondiAlTelefono(audio, istruzioni),
      contesto: () => agente.sintesiMemoria(),
      suono: (nome) => suono(nome, config.cartellaDati),
      elencoSuoni: () => elencoSuoni(config.cartellaDati),
      rispondi: async (richiesta) => {
        let testo = ''
        await agente.chat(richiesta, (e) => {
          if (e.tipo === 'testo') testo += e.testo
        })
        return testo
      },
      annota: (testo) => agente.db.registra('telefono', testo),
    })
    try {
      const esito = await telefonata.esegui({ motivo, apertura, nome: config.appellativo })
      ultimaTelefonata = { ...esito, quando: new Date().toISOString() }
      const riassunto =
        esito.esito === 'conclusa'
          ? `Telefonata finita (${esito.conversazione.length} battute)`
          : esito.esito === 'nessuna-risposta'
            ? `Telefonata: nessuna risposta (${esito.motivo ?? ''})`
            : `Telefonata non riuscita: ${esito.motivo ?? ''}`
      agente.db.registra(esito.esito === 'errore' ? 'errore' : 'telefono', riassunto, esito.conversazione)
      return esito
    } finally {
      telefonataInCorso = false
    }
  }
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
            const voce = VOCI_GEMINI.find((v) => v.id === dati.voce)?.id ?? VOCI_GEMINI[0].id
            audio = await gemini.sintetizza(testo, voce)
            tipo = 'audio/wav'
            if (VOCI_GEMINI.some((v) => v.id === dati.voce)) ricordaVoce(voce)
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

      // ───────── Suoni e musica che Ambrogio può far sentire ─────────
      if (req.method === 'GET' && url.pathname === '/api/suoni') {
        return inviaJson(res, 200, { suoni: elencoSuoni(config.cartellaDati) })
      }
      if (req.method === 'GET' && url.pathname.startsWith('/api/suoni/')) {
        const audio = suono(decodeURIComponent(url.pathname.slice('/api/suoni/'.length)), config.cartellaDati)
        if (!audio) return inviaJson(res, 404, { errore: 'Suono non trovato.' })
        res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': audio.length, 'Cache-Control': 'no-store' })
        return res.end(audio)
      }

      // ───────── Sala macchine: i numeri veri di Ambrogio ─────────
      if (req.method === 'GET' && url.pathname === '/api/statistiche') {
        let frasiArchivio = 0
        try {
          frasiArchivio = fs.readdirSync(cartellaVoce).filter((f) => f.endsWith('.wav')).length
        } catch {
          // archivio vuoto
        }
        return inviaJson(res, 200, {
          ...agente.db.statistiche(),
          cervello: agente.cervello,
          personalita: agente.personalita,
          voce: { disponibile: gemini.disponibile, pagamento: gemini.stato().pagamento, richiesteOggi: gemini.richiesteOggi, frasiArchivio },
          telefono: { configurato: config.telefono.configurato, stato: telefono.stato, inCorso: telefonataInCorso, ultima: ultimaTelefonata?.esito ?? null },
          email: opzioni.google ? opzioni.google.stato().collegato : false,
          sistema: {
            cpu: usoCpu(),
            ramUsata: os.totalmem() - os.freemem(),
            ramTotale: os.totalmem(),
            memoriaAmbrogio: process.memoryUsage().rss,
            accesoDaS: Math.round((Date.now() - accesoDa) / 1000),
            processori: os.cpus().length,
          },
          ora: new Date().toISOString(),
        })
      }

      // ───────── Airbnb: stato del collegamento (per capire subito se il calendario arriva) ─────────
      if (req.method === 'GET' && url.pathname === '/api/airbnb') {
        const a = servizi.airbnb
        if (!a?.case.length) return inviaJson(res, 200, { collegato: false, motivo: 'Nel file .env manca AMBROGIO_AIRBNB_CASA_1_ICAL.' })
        const case_ = await Promise.all(
          a.case.map(async (c) => {
            try {
              const { periodi } = await a.calendario(c.numero)
              return { numero: c.numero, nome: c.nome, ok: true, prenotazioni: periodi.filter((p) => p.tipo === 'prenotazione').length }
            } catch (err) {
              return { numero: c.numero, nome: c.nome, ok: false, errore: (err as Error).message }
            }
          }),
        )
        return inviaJson(res, 200, { collegato: true, case: case_ })
      }

      // ───────── Telefono ─────────
      if (req.method === 'GET' && url.pathname === '/api/telefono') {
        return inviaJson(res, 200, {
          configurato: config.telefono.configurato,
          stato: telefono.stato,
          errore: telefono.errore || null,
          inCorso: telefonataInCorso,
          ultima: ultimaTelefonata,
          voce: gemini.disponibile,
        })
      }
      if (req.method === 'POST' && url.pathname === '/api/telefono/prova') {
        if (!config.telefono.configurato) return inviaJson(res, 409, { errore: 'Telefono non configurato: mancano le righe di Linphone nel file .env.' })
        if (!gemini.disponibile && process.platform !== 'win32')
          return inviaJson(res, 409, { errore: 'Per parlare al telefono serve la chiave di Gemini nel file .env.' })
        if (telefonataInCorso) return inviaJson(res, 409, { errore: 'C’è già una telefonata in corso.' })
        void telefona(
          'telefonata di prova del nuovo telefono. Chiedigli se ti sente bene, fai due chiacchiere di cortesia e, quando saluta, salutalo.',
          `Ué ${config.appellativo}, sono Ambrogio! Questa è la prima telefonata vera: mi sente bene?`,
        )
        return inviaJson(res, 202, { ok: true })
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
