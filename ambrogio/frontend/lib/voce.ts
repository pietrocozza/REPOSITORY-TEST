// Orecchie e voce di Ambrogio, con le API vocali del browser:
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

// Come il riconoscimento vocale italiano scrive di solito "Ambrogio"
const NOME = '(?:ambrogio|ambrosio|ambroggio|ambrogi|ambrogia|embrogio|ambrocio|ambrogino)'
// «Uè» come lo scrive il riconoscimento vocale: uè, ue, ué, uei, we, wè, vè, ehi, hey…
const UE = '(?:u[eèé]i?|w[eèé]|v[eèé]|ue+|eh?i|hey|ehy)'
// per svegliarlo serve «Uè Ambrogio» (il solo nome non basta: così non si sveglia quando si parla di lui)
const PAROLA_ATTIVAZIONE = new RegExp(`(?:^|[^a-zà-ú])${UE}[\\s,.!'’-]*${NOME}(?![a-zà-ú])[\\s,.:!?]*(.*)$`, 'i')
const SOLO_NOME = new RegExp(`^\\s*(?:${UE}[\\s,.!'’-]*)?${NOME}(?![a-zà-ú])[\\s,.:!?]*`, 'i')

/** Con la parola d'attivazione: "Uè Ambrogio, che ore sono?" → "che ore sono?" ("" se ha detto solo "Uè Ambrogio") */
export function dopoParolaAttivazione(frase: string): string | null {
  const m = frase.match(PAROLA_ATTIVAZIONE)
  return m ? m[1].trim() : null
}

/** Dopo il microfono: se la frase comincia con «(Uè) Ambrogio», il nome si toglie */
export const togliNome = (frase: string) => frase.replace(SOLO_NOME, '').trim()

// Quanto silenzio aspettare prima di considerare finita la frase (così si può pensare alla parola dopo)
export const PAUSA_FINE_FRASE_MS = 2500
// Parola per chiudere subito la frase senza aspettare: «… passo» (come alla radio) o «… ho finito»
const PAROLA_FINE = /[\s,.;:!?]*\b(?:passo(?: e chiudo)?|ho finito)[\s.!?]*$/i

/** «quanti ospiti arrivano sabato, passo» → { testo: 'quanti ospiti arrivano sabato', chiusa: true } */
export function fineFrase(frase: string) {
  const chiusa = PAROLA_FINE.test(frase)
  return { testo: chiusa ? frase.replace(PAROLA_FINE, '').trim() : frase.trim(), chiusa }
}

/** Unisce i pezzi di frase che il riconoscimento consegna separati */
export const unisciPezzi = (pezzi: string[]) => pezzi.map((p) => p.trim()).filter(Boolean).join(' ')

/** "Uè Ambrogio, basta" / "Uè Ambrogio, stop": fermarsi senza fare altro */
export const eStop = (comando: string) =>
  /^(?:stop|basta|zitt[oa]|ferm[ao]|fermati|silenzio|annulla|lascia (?:stare|perdere)|niente|nulla)\b[\s.!]*$/i.test(comando)

// ───────── Suono di attivazione (come gli assistenti vocali di casa) ─────────

let audio: AudioContext | null = null

/** Due note brevi e morbide: "ti ho sentito". Se il browser blocca l'audio non succede nulla. */
export function suonoAttivazione(chiusura = false) {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') audio.resume().catch(() => {})
    const t = audio.currentTime + 0.02
    const note = chiusura ? [784, 523] : [659, 988]
    note.forEach((f, i) => {
      const osc = audio!.createOscillator()
      const vol = audio!.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      const inizio = t + i * 0.11
      vol.gain.setValueAtTime(0, inizio)
      vol.gain.linearRampToValueAtTime(0.12, inizio + 0.015)
      vol.gain.exponentialRampToValueAtTime(0.0001, inizio + 0.32)
      osc.connect(vol).connect(audio!.destination)
      osc.start(inizio)
      osc.stop(inizio + 0.34)
    })
  } catch {
    // niente audio: resta il segnale visivo della rete
  }
}

// ───────── Sintesi vocale ─────────

let vocePreferita: SpeechSynthesisVoice | null = null
let voceScelta: string | null = null // nome scelto nelle impostazioni (null = automatica)
let velocita = 1.02

const punteggio = (v: SpeechSynthesisVoice) => {
  const n = v.name.toLowerCase()
  let p = 0
  if (/natural|neural|online/.test(n)) p += 5
  if (/isabella|elsa|alice|federica|paola|carla|calimero|female|donna/.test(n)) p += 2
  if (/google/.test(n)) p += 1.5
  if (/luca|diego|cosimo|giorgio|roberto|paolo|benigno|rinaldi|male/.test(n)) p -= 2
  return p
}

const vociItalianeDisponibili = () =>
  typeof window === 'undefined' || !('speechSynthesis' in window)
    ? []
    : window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('it'))

// Preferisce una voce italiana femminile e naturale. Le migliori gratuite sono quelle "Natural" di Microsoft Edge
// (es. "Microsoft Isabella Online (Natural)"); in Chrome c'è "Google italiano". Le voci di Windows classiche sono più robotiche.
function scegliVoce() {
  const voci = vociItalianeDisponibili()
  if (!voci.length) return null
  if (voceScelta) {
    const scelta = voci.find((v) => v.name === voceScelta)
    if (scelta) return scelta
  }
  return [...voci].sort((a, b) => punteggio(b) - punteggio(a))[0]
}

export type InfoVoce = { nome: string; naturale: boolean }

/** Voci italiane installate, le più naturali per prime. */
export function vociItaliane(): InfoVoce[] {
  return [...vociItalianeDisponibili()]
    .sort((a, b) => punteggio(b) - punteggio(a))
    .map((v) => ({ nome: v.name, naturale: /natural|neural|online|google/i.test(v.name) }))
}

/** Sceglie la voce per nome (null = scelta automatica) e la velocità di lettura. */
export function impostaVoce(nome: string | null, nuovaVelocita?: number) {
  voceScelta = nome
  if (nuovaVelocita) velocita = Math.min(1.5, Math.max(0.7, nuovaVelocita))
  vocePreferita = scegliVoce()
}

export function preparaVoce(onCambio?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  vocePreferita = scegliVoce()
  window.speechSynthesis.onvoiceschanged = () => {
    vocePreferita = scegliVoce()
    onCambio?.()
  }
}

export const nomeVoce = () => vocePreferita?.name ?? 'predefinita di sistema'

// Le frasi vengono messe in coda: si parla mentre la risposta sta ancora arrivando
const inCoda = new Set<SpeechSynthesisUtterance>() // riferimenti tenuti vivi (bug di Chrome)

type EventiVoce = { onInizio?: () => void; onParola?: () => void; onFine?: () => void }

const pulisci = (testo: string) =>
  testo
    .replace(/[*_#`>|~]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim()

function pronunciaEdge(pulito: string, eventi: EventiVoce) {
  if (!pulito || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    eventi.onFine?.()
    return
  }
  const u = new SpeechSynthesisUtterance(pulito)
  u.lang = 'it-IT'
  if (vocePreferita) u.voice = vocePreferita
  u.rate = velocita
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

// ───────── Voce di Ambrogio (ElevenLabs o Gemini, accento milanese) ─────────
// L'audio lo prepara il backend (che tiene la chiave). Se il servizio non c'è, non risponde o ha finito
// le richieste/crediti, si usa la voce di Edge senza interrompere il discorso.

export type MotoreVoce = 'edge' | 'gemini'
let motore: MotoreVoce = 'edge'
let voceGemini = 'Charon'
let geminiInPausaFino = 0
let avviso: ((messaggio: string) => void) | null = null
let opzioniVoce: { intera: boolean; qualita: 'veloce' | 'massima' } = { intera: true, qualita: 'veloce' }

/**
 * Sceglie chi parla: le voci di Edge o la voce di Ambrogio (servizio esterno).
 * intera = la risposta si dice tutta insieme (una sola richiesta: serve con Gemini gratuito).
 */
export function impostaMotore(
  nuovo: MotoreVoce,
  voce?: string,
  onAvviso?: (messaggio: string) => void,
  opzioni?: Partial<typeof opzioniVoce>,
) {
  motore = nuovo
  if (voce) voceGemini = voce
  if (onAvviso) avviso = onAvviso
  if (opzioni) opzioniVoce = { ...opzioniVoce, ...opzioni }
  geminiInPausaFino = 0
}

/** vero se la prossima frase la dirà la voce di Ambrogio */
export const parlaGemini = () => motore === 'gemini' && Date.now() > geminiInPausaFino
/** vero se la risposta va detta tutta insieme */
export const rispostaIntera = () => parlaGemini() && opzioniVoce.intera

// Volume della voce mentre parla: la rete si allarga e si stringe a ritmo (come una sfera musicale)
let ctxVoce: AudioContext | null = null
let analisiVoce: AnalyserNode | null = null
const campioniVoce = new Float32Array(1024)

function collegaAnalisi(el: HTMLAudioElement) {
  try {
    ctxVoce ??= new AudioContext()
    if (ctxVoce.state === 'suspended') ctxVoce.resume().catch(() => {})
    if (!analisiVoce) {
      analisiVoce = ctxVoce.createAnalyser()
      analisiVoce.fftSize = 1024
      analisiVoce.smoothingTimeConstant = 0.5
      analisiVoce.connect(ctxVoce.destination)
    }
    ctxVoce.createMediaElementSource(el).connect(analisiVoce)
  } catch {
    // senza analisi l'audio suona lo stesso (direttamente); la rete usa l'animazione automatica
  }
}

/** volume della voce di Ambrogio adesso (0–1), oppure -1 se non lo si può misurare (voce di Edge) */
export function livelloVoce() {
  if (!attuale?.el || attuale.el.paused || !analisiVoce) return -1
  analisiVoce.getFloatTimeDomainData(campioniVoce)
  let somma = 0
  for (const c of campioniVoce) somma += c * c
  return Math.min(1, Math.sqrt(somma / campioniVoce.length) * 5)
}

const frequenzeVoce = new Uint8Array(512)
/** 8 bande di frequenza della voce di Ambrogio (0–1), per la corona del vortice; tutte 0 se non misurabile */
export function bandeVoce(): number[] {
  if (!attuale?.el || attuale.el.paused || !analisiVoce) return [0, 0, 0, 0, 0, 0, 0, 0]
  analisiVoce.getByteFrequencyData(frequenzeVoce)
  // bande logaritmiche fino a ~8 kHz (dove sta la voce)
  const limiti = [2, 4, 8, 14, 24, 40, 64, 110, 180]
  return limiti.slice(0, 8).map((da, i) => {
    let somma = 0
    for (let k = da; k < limiti[i + 1]; k++) somma += frequenzeVoce[k]
    return Math.min(1, somma / (limiti[i + 1] - da) / 200)
  })
}

type Battuta = { testo: string; eventi: EventiVoce; audio: Promise<Blob | null>; annullata: boolean; el?: HTMLAudioElement; finita?: boolean }
const codaGemini: Battuta[] = []
let attuale: Battuta | null = null

async function scarica(testo: string): Promise<Blob | null> {
  try {
    const res = await fetch('/api/voce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testo, voce: voceGemini, qualita: opzioniVoce.qualita }),
    })
    if (res.ok) return await res.blob()
    const dati = (await res.json().catch(() => null)) as { errore?: string; riprovaTra?: number } | null
    // limite raggiunto o chiave mancante: per un po' parla Edge, senza riprovare a ogni frase
    geminiInPausaFino = Date.now() + (res.status === 429 ? Math.max(20, dati?.riprovaTra ?? 60) : 10 * 60) * 1000
    if (res.status === 429 || res.status === 409) avviso?.(dati?.errore ?? 'La voce di Gemini non è disponibile: uso quella di Edge.')
  } catch {
    geminiInPausaFino = Date.now() + 60 * 1000
  }
  return null
}

function chiudi(b: Battuta) {
  if (b.finita) return
  b.finita = true
  b.eventi.onFine?.()
}

async function prossima() {
  const b = codaGemini.shift()
  attuale = b ?? null
  if (!b) return
  const audio = await b.audio
  if (b.annullata) return
  const avanti = () => {
    chiudi(b)
    if (attuale === b) prossima()
  }
  if (!audio) {
    // questa frase la dice Edge
    pronunciaEdge(b.testo, { onInizio: b.eventi.onInizio, onParola: b.eventi.onParola, onFine: avanti })
    return
  }
  const indirizzo = URL.createObjectURL(audio)
  const el = new Audio(indirizzo)
  b.el = el
  collegaAnalisi(el)
  el.playbackRate = Math.min(1.25, Math.max(0.85, velocita))
  el.onplay = () => b.eventi.onInizio?.()
  el.ontimeupdate = () => b.eventi.onParola?.()
  const fine = () => {
    URL.revokeObjectURL(indirizzo)
    avanti()
  }
  el.onended = fine
  // audio rovinato o illeggibile: questa frase la dice Edge
  el.onerror = () => {
    URL.revokeObjectURL(indirizzo)
    if (!b.annullata) pronunciaEdge(b.testo, { onInizio: b.eventi.onInizio, onParola: b.eventi.onParola, onFine: avanti })
  }
  el.play().catch(() => {
    if (el.error) return // ci pensa onerror
    // il browser non lascia suonare: questa frase la dice Edge
    URL.revokeObjectURL(indirizzo)
    pronunciaEdge(b.testo, { onInizio: b.eventi.onInizio, onParola: b.eventi.onParola, onFine: avanti })
  })
}

// ───────── Suoni e musica: nelle risposte Ambrogio scrive [SUONO: nome] ─────────
export const ETICHETTA_SUONO = /\[\s*SUONO\s*:\s*([^\]]+?)\s*\]/gi
/** il testo da mostrare, senza le richieste di suono (anche a metà mentre arrivano) */
export const senzaSuoni = (testo: string) => testo.replace(ETICHETTA_SUONO, '♪').replace(/\[\s*SUONO[^\]]*$/i, '')
export const suoniNelTesto = (testo: string) => [...testo.matchAll(ETICHETTA_SUONO)].map((m) => m[1])

async function scaricaSuono(nome: string): Promise<Blob | null> {
  try {
    const res = await fetch(`/api/suoni/${encodeURIComponent(nome)}`)
    return res.ok ? await res.blob() : null
  } catch {
    return null
  }
}

/** fa sentire un suono in coda alla voce (anche quando le risposte non vengono lette ad alta voce) */
export function suona(nome: string, eventi: EventiVoce = {}) {
  if (typeof window === 'undefined') return eventi.onFine?.()
  codaGemini.push({ testo: '', eventi, audio: scaricaSuono(nome), annullata: false })
  if (!attuale) prossima()
}

export function pronuncia(testo: string, eventi: EventiVoce = {}) {
  // dentro il testo ci possono essere suoni: si dicono e si suonano nell'ordine
  const parti = testo.split(/(\[\s*SUONO\s*:[^\]]+\])/i).filter((p) => p.trim())
  if (parti.length > 1 || ETICHETTA_SUONO.test(testo)) {
    ETICHETTA_SUONO.lastIndex = 0
    parti.forEach((p, i) => {
      const ultimo = i === parti.length - 1
      const ev = ultimo ? eventi : { onInizio: i === 0 ? eventi.onInizio : undefined, onParola: eventi.onParola }
      const nome = /\[\s*SUONO\s*:\s*([^\]]+?)\s*\]/i.exec(p)?.[1]
      if (nome) suona(nome, ev)
      else pronunciaInCoda(p, ev)
    })
    return
  }
  pronunciaInCoda(testo, eventi)
}

function pronunciaInCoda(testo: string, eventi: EventiVoce) {
  const pulito = pulisci(testo)
  if (!pulito || typeof window === 'undefined') {
    eventi.onFine?.()
    return
  }
  // con Edge la frase passa comunque dalla coda se c'è un suono in corso o in attesa (così l'ordine resta giusto)
  if (!parlaGemini() && !attuale && !codaGemini.length) return pronunciaEdge(pulito, eventi)
  // l'audio si prepara subito, anche mentre la frase prima sta ancora suonando
  codaGemini.push({ testo: pulito, eventi, audio: parlaGemini() ? scarica(pulito) : Promise.resolve(null), annullata: false })
  if (!attuale) prossima()
}

export function zittisci() {
  if (typeof window === 'undefined') return
  for (const b of codaGemini.splice(0)) {
    b.annullata = true
    chiudi(b)
  }
  if (attuale) {
    attuale.annullata = true
    attuale.el?.pause()
    chiudi(attuale)
    attuale = null
  }
  if (!('speechSynthesis' in window)) return
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
