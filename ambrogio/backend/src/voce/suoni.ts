import fs from 'node:fs'
import path from 'node:path'
import { wav } from './gemini.ts'

// Suoni e musica che Ambrogio può far sentire, nell'app e al telefono.
// Nelle risposte li chiede con [SUONO: nome]. Ci sono melodie suonate da lui (brani liberi da diritti, sintetizzati
// qui, gratis) e i file WAV che Pietro mette nella cartella data/suoni (il nome del file è il nome del suono).

const FREQ = 24000

// note: nome → semitoni da La4 (440 Hz); durate in battiti
const SEMITONI: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }
function frequenza(nota: string) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(nota)
  if (!m) return 0 // pausa
  const s = SEMITONI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12
  return 440 * 2 ** (s / 12)
}

type Melodia = { descrizione: string; bpm: number; note: [string, number][]; timbro?: 'campana' | 'ottoni' | 'piano' }

const n = (testo: string): [string, number][] =>
  testo
    .trim()
    .split(/\s+/)
    .map((t) => {
      const [nota, durata] = t.split(':')
      return [nota, Number(durata ?? 1)]
    })

export const MELODIE: Record<string, Melodia> = {
  'inno alla gioia': {
    descrizione: 'Beethoven, il tema della Nona',
    bpm: 132,
    note: n('E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4:1.5 D4:0.5 D4:2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4:1.5 C4:0.5 C4:2'),
  },
  'fra martino': {
    descrizione: 'filastrocca',
    bpm: 140,
    note: n('C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2'),
  },
  'tanti auguri': {
    descrizione: 'buon compleanno',
    bpm: 120,
    note: n('G4:0.75 G4:0.25 A4 G4 C5 B4:2 G4:0.75 G4:0.25 A4 G4 D5 C5:2 G4:0.75 G4:0.25 G5 E5 C5 B4 A4:2 F5:0.75 F5:0.25 E5 C5 D5 C5:2'),
  },
  fanfara: { descrizione: 'ta-dà trionfale', bpm: 150, timbro: 'ottoni', note: n('C5:0.5 C5:0.5 C5:0.5 C5:1.5 G#4:1.5 A#4:1.5 C5:0.75 A#4:0.25 C5:3') },
  campanello: { descrizione: 'din don', bpm: 90, timbro: 'campana', note: n('E5:1.5 C5:2.5') },
  'buonanotte': { descrizione: 'ninna nanna di Brahms', bpm: 100, timbro: 'piano', note: n('E4:0.5 E4:0.5 G4:2 E4:0.5 E4:0.5 G4:2 E4:0.5 G4:0.5 C5 B4:1.5 A4:0.5 A4 G4 D4:0.5 E4:0.5 F4 D4 D4:0.5 E4:0.5 F4:2 D4:0.5 F4:0.5 B4:0.5 A4:0.5 G4 B4 C5:2') },
}

/** sintetizza una melodia: onda con armoniche, attacco morbido e coda, un filo di vibrato */
export function suonaMelodia(m: Melodia): Buffer {
  const battito = 60 / m.bpm
  const totale = m.note.reduce((a, [, d]) => a + d, 0) * battito + 0.6
  const campioni = new Float32Array(Math.ceil(totale * FREQ))
  let t0 = 0
  for (const [nota, durata] of m.note) {
    const f = frequenza(nota)
    const lung = durata * battito
    if (f > 0) {
      const coda = m.timbro === 'campana' ? 1.6 : 0.25
      const fine = Math.min(campioni.length, Math.floor((t0 + lung + coda) * FREQ))
      for (let i = Math.floor(t0 * FREQ); i < fine; i++) {
        const t = i / FREQ - t0
        const attacco = Math.min(1, t / 0.012)
        const rilascio = t < lung ? 1 : Math.max(0, 1 - (t - lung) / coda)
        const decadimento = m.timbro === 'campana' ? Math.exp(-t * 2.2) : m.timbro === 'piano' ? Math.exp(-t * 1.6) : 0.85
        const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t)
        const fase = 2 * Math.PI * f * vib * t
        const voce =
          m.timbro === 'ottoni'
            ? Math.sin(fase) + 0.6 * Math.sin(2 * fase) + 0.45 * Math.sin(3 * fase) + 0.25 * Math.sin(4 * fase)
            : m.timbro === 'campana'
              ? Math.sin(fase) + 0.5 * Math.sin(2.76 * fase) + 0.25 * Math.sin(5.4 * fase)
              : Math.sin(fase) + 0.35 * Math.sin(2 * fase) + 0.12 * Math.sin(3 * fase)
        campioni[i] += 0.22 * voce * attacco * rilascio * decadimento
      }
    }
    t0 += lung
  }
  const pcm = Buffer.alloc(campioni.length * 2)
  campioni.forEach((c, i) => pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, c)) * 32000), i * 2))
  return wav(pcm, FREQ)
}

const normalizzaNome = (nome: string) =>
  nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** tutti i suoni disponibili (melodie + file di Pietro) */
export function elencoSuoni(cartellaDati: string): string[] {
  let file: string[] = []
  try {
    file = fs
      .readdirSync(path.join(cartellaDati, 'suoni'))
      .filter((f) => f.toLowerCase().endsWith('.wav'))
      .map((f) => f.slice(0, -4))
  } catch {
    // cartella non ancora creata
  }
  return [...Object.keys(MELODIE), ...file]
}

/** il WAV di un suono, o null se non esiste */
export function suono(nome: string, cartellaDati: string): Buffer | null {
  const cercato = normalizzaNome(nome)
  if (!cercato) return null
  try {
    const cartella = path.join(cartellaDati, 'suoni')
    const file = fs.readdirSync(cartella).find((f) => f.toLowerCase().endsWith('.wav') && normalizzaNome(f.slice(0, -4)) === cercato)
    if (file) return fs.readFileSync(path.join(cartella, file))
  } catch {
    // nessun file di Pietro
  }
  const melodia = Object.entries(MELODIE).find(([k]) => normalizzaNome(k) === cercato)?.[1]
  return melodia ? suonaMelodia(melodia) : null
}

export type Pezzo = { testo: string } | { suono: string }
const ETICHETTA = /\[\s*SUONO\s*:\s*([^\]]+?)\s*\]/gi

/** separa il testo dalle richieste di suono, nell'ordine in cui compaiono */
export function dividiSuoni(testo: string): Pezzo[] {
  const pezzi: Pezzo[] = []
  let ultimo = 0
  for (const m of testo.matchAll(ETICHETTA)) {
    const prima = testo.slice(ultimo, m.index).trim()
    if (prima) pezzi.push({ testo: prima })
    pezzi.push({ suono: m[1] })
    ultimo = (m.index ?? 0) + m[0].length
  }
  const resto = testo.slice(ultimo).trim()
  if (resto) pezzi.push({ testo: resto })
  return pezzi
}
