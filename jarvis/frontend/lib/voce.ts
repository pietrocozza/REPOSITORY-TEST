// Orecchie e voce di Jarvis, con le API vocali del browser:
//  - riconoscimento vocale (Web Speech API): funziona in Chrome ed Edge
//  - sintesi vocale (speechSynthesis): funziona in tutti i browser moderni

// ───────── Riconoscimento vocale ─────────

// Tipi minimi: non tutti i browser (né TypeScript) li conoscono
type RisultatoVocale = { isFinal: boolean; 0: { transcript: string } }
type EventoRisultato = { resultIndex: number; results: ArrayLike<RisultatoVocale> }
type EventoErrore = { error: string }
type Riconoscitore = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: EventoRisultato) => void) | null
  onerror: ((e: EventoErrore) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type CostruttoreRiconoscitore = new () => Riconoscitore

function costruttore(): CostruttoreRiconoscitore | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, CostruttoreRiconoscitore | undefined>
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const riconoscimentoDisponibile = () => costruttore() !== null

type Ascolto = {
  /** testo parziale mentre l'utente parla */
  onParziale: (testo: string) => void
  /** frase completa */
  onFrase: (testo: string) => void
  onFine: () => void
  onErrore: (codice: string) => void
}

/** Avvia l'ascolto. `continuo` = resta in ascolto finché non lo si ferma (parola d'attivazione). */
export function ascolta(continuo: boolean, cb: Ascolto) {
  const Ctor = costruttore()
  if (!Ctor) {
    cb.onErrore('non-supportato')
    cb.onFine()
    return () => {}
  }
  const r = new Ctor()
  r.lang = 'it-IT'
  r.continuous = continuo
  r.interimResults = true

  r.onresult = (e) => {
    let parziale = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const ris = e.results[i]
      const testo = ris[0].transcript
      if (ris.isFinal) cb.onFrase(testo.trim())
      else parziale += testo
    }
    cb.onParziale(parziale.trim())
  }
  r.onerror = (e) => cb.onErrore(e.error)
  r.onend = () => cb.onFine()

  try {
    r.start()
  } catch {
    cb.onFine()
  }
  return () => {
    r.onresult = null
    r.onerror = null
    r.onend = null
    r.abort()
  }
}

/** Con la parola d'attivazione: "Jarvis, che ore sono?" → "che ore sono?" */
export function dopoParolaAttivazione(frase: string): string | null {
  const m = frase.match(/\b(?:jarvis|giarvis|jervis|gervis|jarvi)\b[\s,.:!?]*(.*)$/i)
  return m ? m[1].trim() : null
}

// ───────── Sintesi vocale ─────────

let vocePreferita: SpeechSynthesisVoice | null = null

// Preferisce una voce italiana femminile e naturale. Le migliori gratuite sono quelle "Natural" di Microsoft Edge
// (es. "Microsoft Isabella Online (Natural)"); in Chrome c'è "Google italiano". Le voci di Windows classiche sono più robotiche.
function scegliVoce() {
  const voci = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('it'))
  if (!voci.length) return null
  const punteggio = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase()
    let p = 0
    if (/natural|neural|online/.test(n)) p += 5
    if (/isabella|elsa|alice|federica|paola|carla|calimero|female|donna/.test(n)) p += 2
    if (/google/.test(n)) p += 1.5
    if (/luca|diego|cosimo|giorgio|roberto|paolo|benigno|rinaldi|male/.test(n)) p -= 2
    return p
  }
  return [...voci].sort((a, b) => punteggio(b) - punteggio(a))[0]
}

export function preparaVoce() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  vocePreferita = scegliVoce()
  window.speechSynthesis.onvoiceschanged = () => {
    vocePreferita = scegliVoce()
  }
}

export const nomeVoce = () => vocePreferita?.name ?? 'predefinita di sistema'

// Le frasi vengono messe in coda: si parla mentre la risposta sta ancora arrivando
const inCoda = new Set<SpeechSynthesisUtterance>() // riferimenti tenuti vivi (bug di Chrome)

export function pronuncia(testo: string, eventi: { onInizio?: () => void; onParola?: () => void; onFine?: () => void } = {}) {
  const pulito = testo
    .replace(/[*_#`>|~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim()
  if (!pulito || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    eventi.onFine?.()
    return
  }
  const u = new SpeechSynthesisUtterance(pulito)
  u.lang = 'it-IT'
  if (vocePreferita) u.voice = vocePreferita
  u.rate = 1.02
  u.pitch = 1
  u.onstart = () => eventi.onInizio?.()
  u.onboundary = () => eventi.onParola?.()
  const fine = () => {
    inCoda.delete(u)
    eventi.onFine?.()
  }
  u.onend = fine
  u.onerror = fine
  inCoda.add(u)
  window.speechSynthesis.speak(u)
}

export function zittisci() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  inCoda.clear()
  window.speechSynthesis.cancel()
}

/** Separa le frasi complete dal testo ancora in arrivo. */
export function estraiFrasi(buffer: string): { frasi: string[]; resto: string } {
  const frasi: string[] = []
  let inizio = 0
  for (let i = 0; i < buffer.length - 1; i++) {
    const c = buffer[i]
    const dopo = buffer[i + 1]
    // Fine frase: punteggiatura seguita da uno spazio (così "3.5" resta intero), oppure a capo
    if (c === '\n' || ('.!?…'.includes(c) && /\s/.test(dopo))) {
      const frase = buffer.slice(inizio, i + 1).trim()
      if (frase) frasi.push(frase)
      inizio = i + 1
    }
  }
  return { frasi, resto: buffer.slice(inizio) }
}
