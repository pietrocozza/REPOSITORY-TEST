import fs from 'node:fs'
import path from 'node:path'
import { personalitaValida, type IdPersonalita } from './agent/istruzioni.ts'

// Preferenze di Jarvis che servono al backend (per ora: la personalità), salvate in data/impostazioni.json.
// Nella fase "memoria" passeranno nel database SQLite.

export type ImpostazioniAgente = { personalita: IdPersonalita }

const PREDEFINITE: ImpostazioniAgente = { personalita: 'maggiordomo' }

export class ArchivioImpostazioni {
  private file: string
  private valori: ImpostazioniAgente

  constructor(cartellaDati: string) {
    this.file = path.join(cartellaDati, 'impostazioni.json')
    this.valori = { ...PREDEFINITE }
    try {
      const dati = JSON.parse(fs.readFileSync(this.file, 'utf8'))
      if (personalitaValida(dati.personalita)) this.valori.personalita = dati.personalita
    } catch {
      // nessuna impostazione salvata: valori predefiniti
    }
  }

  get attuali(): ImpostazioniAgente {
    return { ...this.valori }
  }

  aggiorna(nuove: Partial<ImpostazioniAgente>) {
    if (nuove.personalita && personalitaValida(nuove.personalita)) this.valori.personalita = nuove.personalita
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    fs.writeFileSync(this.file, JSON.stringify(this.valori, null, 2))
    return this.attuali
  }
}
