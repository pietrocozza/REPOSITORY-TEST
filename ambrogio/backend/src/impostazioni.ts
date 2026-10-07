import fs from 'node:fs'
import path from 'node:path'
import { personalitaValida, type IdPersonalita } from './agent/istruzioni.ts'

// Preferenze di Ambrogio che servono al backend, salvate in data/impostazioni.json:
// la personalità e come deve parlare la voce (accento e tono, spiegati a parole a Gemini).

export const STILE_VOCE_PREDEFINITO = `Sei Ambrogio, un maggiordomo milanese sui cinquant'anni: allegro, cordiale e un po' furbo.
Parla in italiano con un accento milanese marcato e costante dalla prima all'ultima parola: vocali chiuse (la "e" e la "o" chiuse alla milanese), cadenza meneghina, tono sorridente.
Ritmo vivace ma chiaro. Le parole in dialetto milanese pronunciale da milanese doc.`

/** Il "cervello": rapido (Claude Haiku, il più svelto), sonnet (Claude Sonnet: veloce e più sveglio, di serie)
 *  o bilanciato (il modello predefinito dell'abbonamento, il più lento) */
export type Cervello = 'rapido' | 'sonnet' | 'bilanciato'
export const MODELLI_CERVELLO: Record<Cervello, string | undefined> = { rapido: 'haiku', sonnet: 'sonnet', bilanciato: undefined }
export const cervelloValido = (c: unknown): c is Cervello => typeof c === 'string' && Object.hasOwn(MODELLI_CERVELLO, c)

export type ImpostazioniAgente = { personalita: IdPersonalita; stileVoce: string; cervello: Cervello }

const PREDEFINITE: ImpostazioniAgente = { personalita: 'maggiordomo', stileVoce: STILE_VOCE_PREDEFINITO, cervello: 'sonnet' }

export class ArchivioImpostazioni {
  private file: string
  private valori: ImpostazioniAgente

  constructor(cartellaDati: string) {
    this.file = path.join(cartellaDati, 'impostazioni.json')
    this.valori = { ...PREDEFINITE }
    try {
      const dati = JSON.parse(fs.readFileSync(this.file, 'utf8'))
      if (personalitaValida(dati.personalita)) this.valori.personalita = dati.personalita
      if (typeof dati.stileVoce === 'string' && dati.stileVoce.trim()) this.valori.stileVoce = dati.stileVoce.slice(0, 1500)
      if (cervelloValido(dati.cervello)) this.valori.cervello = dati.cervello
    } catch {
      // nessuna impostazione salvata: valori predefiniti
    }
  }

  get attuali(): ImpostazioniAgente {
    return { ...this.valori }
  }

  aggiorna(nuove: Partial<ImpostazioniAgente>) {
    if (nuove.personalita && personalitaValida(nuove.personalita)) this.valori.personalita = nuove.personalita
    if (cervelloValido(nuove.cervello)) this.valori.cervello = nuove.cervello
    // stile vuoto = si torna a quello predefinito
    if (typeof nuove.stileVoce === 'string') this.valori.stileVoce = nuove.stileVoce.trim().slice(0, 1500) || STILE_VOCE_PREDEFINITO
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    fs.writeFileSync(this.file, JSON.stringify(this.valori, null, 2))
    return this.attuali
  }
}
