import { ErroreVoce } from './gemini.ts'

// Orecchie di Ambrogio con Gemini: trasforma in testo quello che dici dopo aver premuto il microfono.
// Più preciso del riconoscimento del browser e non si inceppa. Costa una frazione di centesimo a frase
// (serve la stessa chiave della voce). L'audio non viene salvato da nessuna parte.

const MODELLO = 'gemini-2.5-flash'
const ISTRUZIONI = `Trascrivi esattamente quello che dice la persona in questo audio (di solito in italiano, a volte con parole in dialetto milanese).
Rispondi SOLO con la trascrizione, senza virgolette, commenti o traduzioni. Se non si sente nessuna parola, rispondi con una riga vuota.`

type Opzioni = { chiave: string; modello?: string; url?: string }

export class Trascrizione {
  private opz: Opzioni

  constructor(opz: Opzioni) {
    this.opz = opz
  }

  get disponibile() {
    return Boolean(this.opz.chiave)
  }

  async trascrivi(audio: Buffer, tipo: string): Promise<string> {
    if (!this.disponibile) throw new ErroreVoce('senza-chiave', 'Manca la chiave di Gemini nel file .env.')
    const mime = tipo.split(';')[0].trim() || 'audio/webm'
    const base = this.opz.url ?? 'https://generativelanguage.googleapis.com'
    const res = await fetch(`${base}/v1beta/models/${this.opz.modello || MODELLO}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opz.chiave },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: ISTRUZIONI }, { inlineData: { mimeType: mime, data: audio.toString('base64') } }] }],
        generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
      }),
    })
    if (res.status === 429) throw new ErroreVoce('limite', 'Gemini è occupato: riprova tra qualche secondo.')
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const dettaglio = await res.text().catch(() => '')
      if (/api key|API_KEY|permission/i.test(dettaglio)) throw new ErroreVoce('senza-chiave', 'La chiave di Gemini non è valida.')
      throw new ErroreVoce('errore', `Gemini non riesce a leggere l'audio (${res.status}).`)
    }
    if (!res.ok) throw new ErroreVoce('errore', `Gemini non risponde (${res.status}).`)
    const dati = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    return (dati.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? '')
      .join('')
      .trim()
      .replace(/^["«“]|["»”]$/g, '')
      .trim()
  }
}
