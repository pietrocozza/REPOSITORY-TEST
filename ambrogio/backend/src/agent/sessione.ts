import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

// Ricorda quale conversazione di Claude Code è attiva, così Ambrogio non dimentica
// il discorso tra un messaggio e l'altro (e dopo un riavvio).
// Nella fase "memoria" questo passerà nel database SQLite.

export type Sessione = { id: string; avviata: boolean }

export class ArchivioSessione {
  private file: string
  private corrente: Sessione

  constructor(cartellaDati: string) {
    this.file = path.join(cartellaDati, 'sessione.json')
    this.corrente = this.leggi() ?? { id: randomUUID(), avviata: false }
  }

  private leggi(): Sessione | null {
    try {
      const dati = JSON.parse(fs.readFileSync(this.file, 'utf8'))
      if (typeof dati.id === 'string' && /^[0-9a-f-]{36}$/i.test(dati.id)) return { id: dati.id, avviata: !!dati.avviata }
    } catch {
      // nessuna sessione salvata
    }
    return null
  }

  private salva() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    fs.writeFileSync(this.file, JSON.stringify(this.corrente, null, 2))
  }

  get attuale() {
    return this.corrente
  }

  segnaAvviata() {
    if (!this.corrente.avviata) {
      this.corrente.avviata = true
      this.salva()
    }
  }

  nuova() {
    this.corrente = { id: randomUUID(), avviata: false }
    this.salva()
    return this.corrente
  }
}
