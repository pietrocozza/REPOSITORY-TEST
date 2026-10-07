import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { STILE_VOCE_PREDEFINITO } from '../impostazioni.ts'

// La voce di Ambrogio con Google Gemini (sintesi vocale, "TTS"): italiano con accento milanese.
// La chiave sta solo nel file .env (AMBROGIO_GEMINI_CHIAVE) e non arriva mai all'interfaccia.
// Versione gratuita: poche richieste al giorno. Per risparmiarle:
//  - le frasi già dette (saluti, «Cerco subito», …) si salvano in data/voce e non si richiedono più;
//  - quando il limite è raggiunto, Gemini si mette in pausa e l'interfaccia usa la voce di Edge.

export const VOCI_GEMINI = [
  { id: 'Charon', descrizione: 'profonda e pacata' },
  { id: 'Algenib', descrizione: 'roca, vissuta' },
  { id: 'Sadaltager', descrizione: 'colta, autorevole' },
  { id: 'Iapetus', descrizione: 'chiara' },
  { id: 'Orus', descrizione: 'decisa' },
  { id: 'Algieba', descrizione: 'morbida' },
  { id: 'Puck', descrizione: 'allegra' },
  { id: 'Kore', descrizione: 'femminile, decisa' },
  { id: 'Sulafat', descrizione: 'femminile, calda' },
] as const

// La registrazione anticipata delle frasi fisse non deve mangiarsi le voci del giorno: anche a pagamento il modello
// vocale "di prova" di Google concede poche richieste (circa 10 al minuto e 100 al giorno). Quindi al massimo
// questa quota al giorno, una ogni 7 secondi; il resto delle frasi si registra nei giorni dopo.
export const MAX_PREPARA_AL_GIORNO = 40
const PAUSA_PREPARA_MS = 7000

// sempre lo stesso modello, così la voce non cambia (si può indicarne un altro nel file .env)
const MODELLO = 'gemini-2.5-flash-preview-tts'

// Lo stile predefinito (si cambia a parole nelle Impostazioni): uno solo, sempre uguale per tutte le frasi
const STILE = STILE_VOCE_PREDEFINITO

export class ErroreVoce extends Error {
  readonly tipo: 'senza-chiave' | 'limite' | 'errore'
  constructor(tipo: 'senza-chiave' | 'limite' | 'errore', messaggio: string) {
    super(messaggio)
    this.tipo = tipo
  }
}

type Opzioni = { chiave: string; modello?: string; cartellaCache: string; url?: string; pagamento?: boolean; stile?: () => string }

export class VoceGemini {
  private opz: Opzioni
  /** dopo il limite giornaliero, Gemini resta in pausa fino a quest'ora */
  sospesaFinoA = 0
  richiesteOggi = 0
  private giorno = new Date().toDateString()

  constructor(opz: Opzioni) {
    this.opz = opz
    // quante voci si sono chieste oggi (resta anche se Ambrogio si riavvia)
    try {
      const c = JSON.parse(fs.readFileSync(this.fileConteggio, 'utf8')) as { giorno?: string; richieste?: number }
      if (c.giorno === this.giorno && typeof c.richieste === 'number') this.richiesteOggi = c.richieste
    } catch {
      // primo avvio
    }
  }

  private get fileConteggio() {
    return path.join(this.opz.cartellaCache, 'conteggio.json')
  }

  private contaRichiesta() {
    if (this.giorno !== new Date().toDateString()) {
      this.giorno = new Date().toDateString()
      this.richiesteOggi = 0
    }
    this.richiesteOggi++
    try {
      fs.mkdirSync(this.opz.cartellaCache, { recursive: true })
      fs.writeFileSync(this.fileConteggio, JSON.stringify({ giorno: this.giorno, richieste: this.richiesteOggi }))
    } catch {
      // non importante
    }
  }

  get disponibile() {
    return Boolean(this.opz.chiave)
  }

  stato() {
    return {
      disponibile: this.disponibile,
      pagamento: Boolean(this.opz.pagamento),
      voci: VOCI_GEMINI,
      sospesaFinoA: this.sospesaFinoA > Date.now() ? new Date(this.sospesaFinoA).toISOString() : null,
      richiesteOggi: this.richiesteOggi,
      preparazione: this.preparazione,
    }
  }

  /** frasi già registrate per questa voce (nessuna spesa) */
  giaPronta(testo: string, voce: string) {
    return fs.existsSync(this.fileCache(testo, voce))
  }

  /** archivio delle frasi pronte: quante sono, e la preparazione in corso */
  preparazione: { voce: string; totali: number; fatte: number; pronte: number; inCorso: boolean } | null = null

  /**
   * Registra in anticipo le frasi fisse (saluti, risposte pronte, esclamazioni milanesi), una ogni
   * secondo e mezzo per non superare i limiti al minuto. Solo con il pagamento a consumo:
   * con la versione gratuita consumerebbe le poche richieste del giorno.
   */
  prepara(frasi: string[], voce: string, pausaMs = PAUSA_PREPARA_MS, massimo = MAX_PREPARA_AL_GIORNO) {
    if (!this.disponibile || !this.opz.pagamento) return false
    if (this.preparazione?.inCorso) return true
    const mancanti = frasi.filter((f) => !this.giaPronta(f, voce))
    this.preparazione = { voce, totali: frasi.length, fatte: 0, pronte: frasi.length - mancanti.length, inCorso: mancanti.length > 0 }
    const stato = this.preparazione
    void (async () => {
      for (const frase of mancanti) {
        if (this.sospesaFinoA > Date.now()) break
        // le voci rimaste oggi servono per parlare davvero (e per il telefono)
        if (this.richiesteOggi >= massimo) break
        try {
          await this.sintetizza(frase, voce)
          stato.pronte++
        } catch {
          if (this.sospesaFinoA > Date.now()) break
        }
        stato.fatte++
        await new Promise((r) => setTimeout(r, pausaMs))
      }
      stato.inCorso = false
    })()
    return true
  }

  /** le istruzioni di lettura: lo stile scelto da Pietro (o quello predefinito) e la regola finale */
  private istruzioni() {
    return `${this.opz.stile?.() ?? STILE}\nLeggi solo il testo tra virgolette, senza aggiungere nulla.`
  }

  private fileCache(testo: string, voce: string) {
    const h = createHash('sha256').update(`${voce}\n${this.istruzioni()}\n${normalizza(testo)}`).digest('hex').slice(0, 32)
    return path.join(this.opz.cartellaCache, `${h}.wav`)
  }

  /** Il parlato in formato WAV (dalla copia salvata, se c'è) */
  async sintetizza(testo: string, voce: string): Promise<Buffer> {
    if (!this.disponibile) throw new ErroreVoce('senza-chiave', 'Manca la chiave di Gemini nel file .env.')
    const file = this.fileCache(testo, voce)
    if (fs.existsSync(file)) return fs.readFileSync(file)
    if (this.sospesaFinoA > Date.now()) throw new ErroreVoce('limite', 'Limite di Gemini raggiunto: riprovo più tardi.')

    try {
      const wav = await this.chiedi(this.opz.modello || MODELLO, testo, voce)
      fs.mkdirSync(this.opz.cartellaCache, { recursive: true })
      fs.writeFileSync(file, wav)
      return wav
    } catch (err) {
      throw err instanceof ErroreVoce ? err : new ErroreVoce('errore', (err as Error).message)
    }
  }

  private async chiedi(modello: string, testo: string, voce: string) {
    const base = this.opz.url ?? 'https://generativelanguage.googleapis.com'
    this.contaRichiesta()
    const res = await fetch(`${base}/v1beta/models/${modello}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opz.chiave },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${this.istruzioni()}\n\n«${testo}»` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          // meno variazioni da una frase all'altra
          temperature: 0.4,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voce } } },
        },
      }),
    })
    if (res.status === 404) throw new ErroreVoce('errore', `Il modello vocale ${modello} non esiste più: indicane un altro nel file .env.`)
    if (res.status === 429) {
      // limite al minuto (si riprova dopo i secondi indicati da Google) o al giorno (si riprova tra un'ora)
      const corpo = await res.text().catch(() => '')
      const giornaliero = /PerDay|per day/i.test(corpo)
      const attesa = Number(corpo.match(/"retryDelay":\s*"(\d+)/)?.[1] ?? 60)
      this.sospesaFinoA = Date.now() + (giornaliero ? 60 * 60 : attesa) * 1000
      throw new ErroreVoce('limite', giornaliero ? 'Voci di Gemini finite per oggi (limite di Google).' : `Troppe richieste a Gemini in poco tempo: riprovo tra ${attesa} secondi.`)
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const dettaglio = await res.text().catch(() => '')
      if (/api key|API_KEY|permission/i.test(dettaglio)) throw new ErroreVoce('senza-chiave', 'La chiave di Gemini non è valida.')
      throw new ErroreVoce('errore', `Gemini ha rifiutato la richiesta (${res.status}).`)
    }
    if (!res.ok) throw new ErroreVoce('errore', `Gemini non risponde (${res.status}).`)
    const dati = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[]
    }
    const audio = dati.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData
    if (!audio?.data) throw new ErroreVoce('errore', 'Gemini non ha restituito audio.')
    const frequenza = Number(audio.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000)
    return wav(Buffer.from(audio.data, 'base64'), frequenza)
  }
}

/** Stesso testo = stessa registrazione, anche con spazi o apostrofi diversi */
export const normalizza = (testo: string) =>
  testo
    .replace(/[’‘`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

/** Aggiunge l'intestazione WAV all'audio grezzo di Gemini (PCM 16 bit, mono) */
export function wav(pcm: Buffer, frequenza = 24000) {
  const testa = Buffer.alloc(44)
  testa.write('RIFF', 0)
  testa.writeUInt32LE(36 + pcm.length, 4)
  testa.write('WAVE', 8)
  testa.write('fmt ', 12)
  testa.writeUInt32LE(16, 16)
  testa.writeUInt16LE(1, 20) // PCM
  testa.writeUInt16LE(1, 22) // mono
  testa.writeUInt32LE(frequenza, 24)
  testa.writeUInt32LE(frequenza * 2, 28)
  testa.writeUInt16LE(2, 32)
  testa.writeUInt16LE(16, 34)
  testa.write('data', 36)
  testa.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([testa, pcm])
}
