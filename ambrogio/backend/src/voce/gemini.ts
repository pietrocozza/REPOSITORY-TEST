import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

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

// sempre lo stesso modello, così la voce non cambia (si può indicarne un altro nel file .env)
const MODELLO = 'gemini-2.5-flash-preview-tts'

const STILE = `Leggi ad alta voce, in italiano, con la voce di Ambrogio: un maggiordomo milanese elegante, caldo e un po' ironico, con un accento milanese leggero ma riconoscibile.
Le espressioni in dialetto milanese pronunciale come un vero milanese. Leggi solo il testo tra virgolette, senza aggiungere nulla.`

export class ErroreVoce extends Error {
  readonly tipo: 'senza-chiave' | 'limite' | 'errore'
  constructor(tipo: 'senza-chiave' | 'limite' | 'errore', messaggio: string) {
    super(messaggio)
    this.tipo = tipo
  }
}

type Opzioni = { chiave: string; modello?: string; cartellaCache: string; url?: string; pagamento?: boolean }

export class VoceGemini {
  private opz: Opzioni
  /** dopo il limite giornaliero, Gemini resta in pausa fino a quest'ora */
  sospesaFinoA = 0
  richiesteOggi = 0
  private giorno = new Date().toDateString()

  constructor(opz: Opzioni) {
    this.opz = opz
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
    }
  }

  private fileCache(testo: string, voce: string) {
    const h = createHash('sha256').update(`${voce}\n${STILE}\n${testo}`).digest('hex').slice(0, 32)
    return path.join(this.opz.cartellaCache, `${h}.wav`)
  }

  /** Il parlato in formato WAV (dalla copia salvata, se c'è) */
  async sintetizza(testo: string, voce: string): Promise<Buffer> {
    if (!this.disponibile) throw new ErroreVoce('senza-chiave', 'Manca la chiave di Gemini nel file .env.')
    const file = this.fileCache(testo, voce)
    if (fs.existsSync(file)) return fs.readFileSync(file)
    if (this.sospesaFinoA > Date.now()) throw new ErroreVoce('limite', 'Limite di Gemini raggiunto: riprovo più tardi.')

    if (this.giorno !== new Date().toDateString()) {
      this.giorno = new Date().toDateString()
      this.richiesteOggi = 0
    }
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
    this.richiesteOggi++
    const res = await fetch(`${base}/v1beta/models/${modello}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opz.chiave },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${STILE}\n\n«${testo}»` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
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
      throw new ErroreVoce('limite', giornaliero ? 'Richieste gratuite di Gemini finite per oggi.' : `Troppe richieste a Gemini in poco tempo: riprovo tra ${attesa} secondi.`)
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
