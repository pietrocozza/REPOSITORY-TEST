import fs from 'node:fs'
import path from 'node:path'

// La finestra di Ambrogio è un Edge con un profilo tutto suo (data/finestra-edge).
// Prima di aprirla si scrive nelle preferenze di quel profilo che la pagina di Ambrogio può usare il microfono:
// niente richiesta di permesso (che in quella finestra quasi non si vede) e niente blocco rimasto da una volta.
// Vale SOLO per l'indirizzo di Ambrogio su questo computer, non per altri siti.

// orario nel formato di Chromium: microsecondi dal 1601
const orarioChromium = () => String((Date.now() + 11_644_473_600_000) * 1000)

export function consentiMicrofono(cartellaProfilo: string, indirizzi: string[]) {
  const file = path.join(cartellaProfilo, 'Default', 'Preferences')
  let preferenze: Record<string, unknown> = {}
  try {
    preferenze = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    // profilo nuovo (o preferenze illeggibili): si parte da zero
  }
  const profilo = ((preferenze.profile ??= {}) as Record<string, unknown>)
  const contenuti = ((profilo.content_settings ??= {}) as Record<string, unknown>)
  const eccezioni = ((contenuti.exceptions ??= {}) as Record<string, unknown>)
  const microfono = ((eccezioni.media_stream_mic ??= {}) as Record<string, { setting?: number; last_modified?: string }>)
  let cambiato = false
  for (const indirizzo of indirizzi) {
    const chiave = `${indirizzo},*`
    if (microfono[chiave]?.setting === 1) continue
    microfono[chiave] = { last_modified: orarioChromium(), setting: 1 }
    cambiato = true
  }
  if (!cambiato) return false
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(preferenze))
  return true
}
