import { ErroreVoce } from './gemini.ts'

// Orecchie di Ambrogio con Gemini: trasforma in testo quello che dici dopo aver premuto il microfono.
// Più preciso del riconoscimento del browser e non si inceppa. Costa una frazione di centesimo a frase
// (serve la stessa chiave della voce). L'audio non viene salvato da nessuna parte.

// Il modello preferito; se Google lo ritira (errore 404) Ambrogio ne sceglie da solo un altro adatto
const MODELLO = 'gemini-2.5-flash'
const RISERVE = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-3-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash']
const ISTRUZIONI = `Trascrivi esattamente quello che dice la persona in questo audio (di solito in italiano, a volte con parole in dialetto milanese).
Chi parla è Pietro, che gestisce case vacanza a Roma e parla con il suo assistente Ambrogio. Parole che usa spesso: Ambrogio, «uè Ambrogio», Airbnb, Vikey, Booking, check-in, check-out, host, ospite, Trastevere, Roma, Gmail, Linphone, revenue, ADR, RevPAR, prezzo a notte, prenotazione, ghe pensi mi.
Correggi solo gli errori evidenti di riconoscimento, non cambiare il senso. Rispondi SOLO con la trascrizione, senza virgolette, commenti o traduzioni. Se non si sente nessuna parola chiara (solo rumore, fruscio, musica, suoni del telefono, voci lontane), rispondi con una riga vuota: non inventare parole.`

type Opzioni = { chiave: string; modello?: string; url?: string }

/** Tra i modelli disponibili sceglie un "flash" recente che sa leggere l'audio (niente voce, immagini o live) */
export function scegliModello(nomi: string[]) {
  const adatti = nomi
    .map((n) => n.replace(/^models\//, ''))
    .filter((n) => /^gemini-/.test(n) && /flash/.test(n) && !/tts|image|live|audio|embedding|thinking|exp/.test(n))
  const versione = (n: string) => Number(n.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0)
  // prima i modelli stabili (senza "preview" e senza "lite"), poi la versione più nuova
  return (
    adatti.sort(
      (a, b) =>
        Number(/preview/.test(a)) - Number(/preview/.test(b)) ||
        Number(/lite/.test(a)) - Number(/lite/.test(b)) ||
        versione(b) - versione(a) ||
        a.length - b.length,
    )[0] ?? null
  )
}

export class Trascrizione {
  private opz: Opzioni
  private modelloScelto: string | null = null

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
    const chiedi = (modello: string, conPensiero: boolean) =>
      fetch(`${base}/v1beta/models/${modello}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.opz.chiave },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: ISTRUZIONI }, { inlineData: { mimeType: mime, data: audio.toString('base64') } }] }],
          // niente "ragionamento": la trascrizione deve essere rapida (non tutti i modelli lo accettano)
          generationConfig: { temperature: 0, ...(conPensiero ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        }),
      })
    let modello = this.opz.modello || this.modelloScelto || MODELLO
    let res = await chiedi(modello, true)
    if (res.status === 404 && !this.opz.modello) {
      // il modello non esiste più: si chiede a Google quali ci sono e se ne sceglie uno adatto
      const elenco = await fetch(`${base}/v1beta/models?pageSize=200`, { headers: { 'x-goog-api-key': this.opz.chiave }, signal: AbortSignal.timeout(15_000) })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
      const nomi = ((elenco as { models?: { name: string; supportedGenerationMethods?: string[] }[] } | null)?.models ?? [])
        .filter((m) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
        .map((m) => m.name)
      // se l'elenco non arriva, si provano i nomi più comuni
      const candidati = [scegliModello(nomi), ...RISERVE].filter((m): m is string => Boolean(m) && m !== modello)
      for (const altro of [...new Set(candidati)]) {
        res = await chiedi(altro, true)
        modello = altro
        if (res.status !== 404) break
      }
    }
    if (res.status === 400) {
      const dettaglio = await res.clone().text().catch(() => '')
      if (/thinking/i.test(dettaglio)) res = await chiedi(modello, false)
    }
    if (res.ok) this.modelloScelto = modello
    if (res.status === 404) throw new ErroreVoce('errore', 'Nessun modello di Gemini per capire l’audio risulta disponibile con questa chiave (controlla in AI Studio che la chiave sia attiva).')
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
