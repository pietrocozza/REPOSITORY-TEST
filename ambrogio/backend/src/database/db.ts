import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// La memoria di Ambrogio: un unico file SQLite in data/ambrogio.sqlite (solo sul tuo PC, mai su GitHub).
// SQLite è integrato in Node.js: nessun programma in più da installare.
// Per spostare tutto su un mini PC basta copiare questo file.

export type Memoria = { id: number; tipo: TipoMemoria; titolo: string; contenuto: string; creata: string; aggiornata: string }
export type TipoMemoria = 'preferenza' | 'persona' | 'contatto' | 'regola' | 'nota'
export const TIPI_MEMORIA: TipoMemoria[] = ['preferenza', 'persona', 'contatto', 'regola', 'nota']

export type StatoPratica = 'aperta' | 'in_attesa' | 'chiusa'
export type Pratica = { id: number; titolo: string; descrizione: string; stato: StatoPratica; note: string; creata: string; aggiornata: string }

export type Livello = 1 | 2 | 3
export type StatoAutorizzazione = 'in_attesa' | 'concessa' | 'negata' | 'scaduta'
export type Autorizzazione = {
  id: number
  strumento: string
  descrizione: string
  argomenti: string
  livello: Livello
  stato: StatoAutorizzazione
  creata: string
  decisa: string | null
}

export type VoceRegistro = { id: number; quando: string; tipo: string; descrizione: string; dettagli: string | null }
export type Messaggio = { id: number; sessione: string; ruolo: 'user' | 'assistant'; testo: string; creato: string }

const adesso = () => new Date().toISOString()

// Ogni versione aggiunge tabelle senza toccare i dati esistenti
const MIGRAZIONI = [
  `CREATE TABLE messaggi (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     sessione TEXT NOT NULL,
     ruolo TEXT NOT NULL CHECK (ruolo IN ('user', 'assistant')),
     testo TEXT NOT NULL,
     creato TEXT NOT NULL
   );
   CREATE INDEX messaggi_sessione ON messaggi (sessione, id);

   CREATE TABLE memorie (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     tipo TEXT NOT NULL,
     titolo TEXT NOT NULL,
     contenuto TEXT NOT NULL,
     creata TEXT NOT NULL,
     aggiornata TEXT NOT NULL
   );

   CREATE TABLE pratiche (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     titolo TEXT NOT NULL,
     descrizione TEXT NOT NULL DEFAULT '',
     stato TEXT NOT NULL DEFAULT 'aperta',
     note TEXT NOT NULL DEFAULT '',
     creata TEXT NOT NULL,
     aggiornata TEXT NOT NULL
   );

   CREATE TABLE autorizzazioni (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     strumento TEXT NOT NULL,
     descrizione TEXT NOT NULL,
     argomenti TEXT NOT NULL,
     livello INTEGER NOT NULL,
     stato TEXT NOT NULL DEFAULT 'in_attesa',
     creata TEXT NOT NULL,
     decisa TEXT
   );

   -- permessi permanenti dati dall'utente ("consenti sempre"), solo per il livello 2
   CREATE TABLE permessi_permanenti (
     strumento TEXT PRIMARY KEY,
     concesso TEXT NOT NULL
   );

   CREATE TABLE registro (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     quando TEXT NOT NULL,
     tipo TEXT NOT NULL,
     descrizione TEXT NOT NULL,
     dettagli TEXT
   );`,
]

/** La memoria di quando si chiamava Jarvis (jarvis.sqlite) diventa quella di Ambrogio, senza perdere nulla. */
function recuperaArchivioJarvis(file: string) {
  const vecchio = path.join(path.dirname(file), 'jarvis.sqlite')
  if (path.basename(file) !== 'ambrogio.sqlite' || fs.existsSync(file) || !fs.existsSync(vecchio)) return
  for (const coda of ['', '-wal', '-shm']) if (fs.existsSync(vecchio + coda)) fs.renameSync(vecchio + coda, file + coda)
}

export class Database {
  private db: DatabaseSync

  constructor(file: string) {
    if (file !== ':memory:') {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      recuperaArchivioJarvis(file)
    }
    this.db = new DatabaseSync(file)
    this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    this.migra()
  }

  private migra() {
    const versione = (this.db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version
    for (let v = versione; v < MIGRAZIONI.length; v++) {
      this.db.exec('BEGIN')
      try {
        this.db.exec(MIGRAZIONI[v])
        this.db.exec(`PRAGMA user_version = ${v + 1}`)
        this.db.exec('COMMIT')
      } catch (err) {
        this.db.exec('ROLLBACK')
        throw err
      }
    }
  }

  chiudi() {
    this.db.close()
  }

  // ───────── Conversazioni ─────────

  salvaMessaggio(sessione: string, ruolo: 'user' | 'assistant', testo: string) {
    this.db.prepare('INSERT INTO messaggi (sessione, ruolo, testo, creato) VALUES (?, ?, ?, ?)').run(sessione, ruolo, testo, adesso())
  }

  messaggi(sessione: string, limite = 200): Messaggio[] {
    return (
      this.db
        .prepare('SELECT * FROM (SELECT * FROM messaggi WHERE sessione = ? ORDER BY id DESC LIMIT ?) ORDER BY id')
        .all(sessione, limite) as Messaggio[]
    )
  }

  // ───────── Memoria ─────────

  ricorda(tipo: TipoMemoria, titolo: string, contenuto: string): Memoria {
    // se esiste già una memoria con lo stesso tipo e titolo, viene aggiornata invece di duplicarla
    const esistente = this.db.prepare('SELECT id FROM memorie WHERE tipo = ? AND lower(titolo) = lower(?)').get(tipo, titolo) as { id: number } | undefined
    if (esistente) {
      this.db.prepare('UPDATE memorie SET contenuto = ?, aggiornata = ? WHERE id = ?').run(contenuto, adesso(), esistente.id)
      return this.memoria(esistente.id)!
    }
    const r = this.db.prepare('INSERT INTO memorie (tipo, titolo, contenuto, creata, aggiornata) VALUES (?, ?, ?, ?, ?)').run(tipo, titolo, contenuto, adesso(), adesso())
    return this.memoria(Number(r.lastInsertRowid))!
  }

  memoria(id: number): Memoria | undefined {
    return this.db.prepare('SELECT * FROM memorie WHERE id = ?').get(id) as Memoria | undefined
  }

  cercaMemorie(testo = '', tipo?: TipoMemoria, limite = 30): Memoria[] {
    const parole = testo.toLowerCase().split(/\s+/).filter((p) => p.length > 1).slice(0, 6)
    const condizioni = parole.map(() => "(lower(titolo) LIKE ? ESCAPE '\\' OR lower(contenuto) LIKE ? ESCAPE '\\')")
    const valori: string[] = parole.flatMap((p) => {
      const like = `%${p.replace(/[\\%_]/g, (c) => '\\' + c)}%`
      return [like, like]
    })
    if (tipo) {
      condizioni.push('tipo = ?')
      valori.push(tipo)
    }
    const where = condizioni.length ? `WHERE ${condizioni.join(' AND ')}` : ''
    return this.db.prepare(`SELECT * FROM memorie ${where} ORDER BY aggiornata DESC LIMIT ?`).all(...valori, limite) as Memoria[]
  }

  dimentica(id: number) {
    return this.db.prepare('DELETE FROM memorie WHERE id = ?').run(id).changes > 0
  }

  // ───────── Pratiche (attività che durano nel tempo) ─────────

  apriPratica(titolo: string, descrizione: string): Pratica {
    const r = this.db.prepare('INSERT INTO pratiche (titolo, descrizione, creata, aggiornata) VALUES (?, ?, ?, ?)').run(titolo, descrizione, adesso(), adesso())
    return this.pratica(Number(r.lastInsertRowid))!
  }

  pratica(id: number): Pratica | undefined {
    return this.db.prepare('SELECT * FROM pratiche WHERE id = ?').get(id) as Pratica | undefined
  }

  aggiornaPratica(id: number, modifiche: { stato?: StatoPratica; nota?: string }): Pratica | undefined {
    const p = this.pratica(id)
    if (!p) return undefined
    const data = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' })
    const note = modifiche.nota ? `${p.note}${p.note ? '\n' : ''}${data} — ${modifiche.nota}` : p.note
    this.db.prepare('UPDATE pratiche SET stato = ?, note = ?, aggiornata = ? WHERE id = ?').run(modifiche.stato ?? p.stato, note, adesso(), id)
    return this.pratica(id)
  }

  pratiche(stato?: StatoPratica): Pratica[] {
    return (
      stato
        ? this.db.prepare('SELECT * FROM pratiche WHERE stato = ? ORDER BY aggiornata DESC').all(stato)
        : this.db.prepare("SELECT * FROM pratiche ORDER BY stato = 'chiusa', aggiornata DESC").all()
    ) as Pratica[]
  }

  // ───────── Autorizzazioni ─────────

  creaAutorizzazione(strumento: string, descrizione: string, argomenti: unknown, livello: Livello): Autorizzazione {
    const r = this.db
      .prepare('INSERT INTO autorizzazioni (strumento, descrizione, argomenti, livello, creata) VALUES (?, ?, ?, ?, ?)')
      .run(strumento, descrizione, JSON.stringify(argomenti ?? {}), livello, adesso())
    return this.autorizzazione(Number(r.lastInsertRowid))!
  }

  autorizzazione(id: number): Autorizzazione | undefined {
    return this.db.prepare('SELECT * FROM autorizzazioni WHERE id = ?').get(id) as Autorizzazione | undefined
  }

  decidiAutorizzazione(id: number, stato: Exclude<StatoAutorizzazione, 'in_attesa'>) {
    return this.db.prepare("UPDATE autorizzazioni SET stato = ?, decisa = ? WHERE id = ? AND stato = 'in_attesa'").run(stato, adesso(), id).changes > 0
  }

  autorizzazioniInAttesa(): Autorizzazione[] {
    return this.db.prepare("SELECT * FROM autorizzazioni WHERE stato = 'in_attesa' ORDER BY id").all() as Autorizzazione[]
  }

  /** all'avvio: le richieste rimaste aperte da una sessione precedente non sono più valide */
  scadiAutorizzazioniVecchie() {
    this.db.prepare("UPDATE autorizzazioni SET stato = 'scaduta', decisa = ? WHERE stato = 'in_attesa'").run(adesso())
  }

  permessoPermanente(strumento: string) {
    return !!this.db.prepare('SELECT 1 FROM permessi_permanenti WHERE strumento = ?').get(strumento)
  }

  concediPermanente(strumento: string) {
    this.db.prepare('INSERT OR REPLACE INTO permessi_permanenti (strumento, concesso) VALUES (?, ?)').run(strumento, adesso())
  }

  revocaPermanente(strumento: string) {
    this.db.prepare('DELETE FROM permessi_permanenti WHERE strumento = ?').run(strumento)
  }

  permessiPermanenti(): { strumento: string; concesso: string }[] {
    return this.db.prepare('SELECT * FROM permessi_permanenti ORDER BY strumento').all() as { strumento: string; concesso: string }[]
  }

  // ───────── Registro delle attività ─────────

  registra(tipo: string, descrizione: string, dettagli?: unknown) {
    this.db
      .prepare('INSERT INTO registro (quando, tipo, descrizione, dettagli) VALUES (?, ?, ?, ?)')
      .run(adesso(), tipo, descrizione, dettagli === undefined ? null : JSON.stringify(dettagli))
  }

  /** I numeri veri di Ambrogio per la Sala macchine (ultimi 30 giorni di registro) */
  statistiche(ora = new Date()) {
    const da = new Date(ora.getTime() - 30 * 86_400_000).toISOString()
    const righe = this.db.prepare('SELECT quando, tipo, descrizione, dettagli FROM registro WHERE quando >= ? ORDER BY id').all(da) as {
      quando: string
      tipo: string
      descrizione: string
      dettagli: string | null
    }[]
    const conta = (sql: string, ...p: string[]) => (this.db.prepare(sql).get(...p) as { n: number }).n
    const t = ora.getTime()
    // attività delle ultime 24 ore, a mezz'ore (48 colonne)
    const attivita = Array.from({ length: 48 }, () => 0)
    // a che ora del giorno lavora (ultimi 30 giorni)
    const perOra = Array.from({ length: 24 }, () => 0)
    // ultimi 7 giorni: richieste, azioni, errori
    const giorni = Array.from({ length: 7 }, (_, i) => {
      const g = new Date(t - (6 - i) * 86_400_000)
      return { giorno: g.toISOString().slice(0, 10), richieste: 0, azioni: 0, errori: 0 }
    })
    const tempi: number[] = []
    const strumenti: Record<string, number> = {}
    const tipi: Record<string, number> = {}
    let pronte = 0
    let conClaude = 0
    for (const r of righe) {
      const q = new Date(r.quando)
      const fa = t - q.getTime()
      tipi[r.tipo] = (tipi[r.tipo] ?? 0) + 1
      perOra[q.getHours()]++
      if (fa >= 0 && fa < 86_400_000) attivita[47 - Math.floor(fa / 1_800_000)]++
      const g = giorni.find((x) => x.giorno === r.quando.slice(0, 10))
      if (g) {
        if (r.tipo === 'messaggio' && r.descrizione.startsWith('Richiesta')) g.richieste++
        if (r.tipo === 'azione' || r.tipo === 'telefono') g.azioni++
        if (r.tipo === 'errore') g.errori++
      }
      if (r.tipo === 'messaggio' && r.dettagli && r.descrizione.startsWith('Risposta')) {
        try {
          const d = JSON.parse(r.dettagli) as { durataMs?: number; strumenti?: string[]; pronta?: boolean }
          if (typeof d.durataMs === 'number') tempi.push(d.durataMs)
          if (d.pronta) pronte++
          else conClaude++
          for (const s of d.strumenti ?? []) {
            const nome = s.replace(/^mcp__ambrogio__/, '')
            strumenti[nome] = (strumenti[nome] ?? 0) + 1
          }
        } catch {
          // dettagli illeggibili
        }
      }
    }
    return {
      // gli ultimi eventi, per l'anello (il più vecchio prima)
      eventi: righe.slice(-400).map((r) => ({ quando: r.quando, tipo: r.tipo })),
      attivita,
      perOra,
      giorni,
      tempi: tempi.slice(-60),
      strumenti,
      tipi,
      risposte: { pronte, conClaude },
      totali: {
        messaggi: conta('SELECT COUNT(*) AS n FROM messaggi'),
        memorie: conta('SELECT COUNT(*) AS n FROM memorie'),
        praticheAperte: conta("SELECT COUNT(*) AS n FROM pratiche WHERE stato != 'chiusa'"),
        concesse: conta("SELECT COUNT(*) AS n FROM autorizzazioni WHERE stato = 'concessa'"),
        negate: conta("SELECT COUNT(*) AS n FROM autorizzazioni WHERE stato IN ('negata', 'scaduta')"),
      },
    }
  }

  registro(limite = 200): VoceRegistro[] {
    return this.db.prepare('SELECT * FROM (SELECT * FROM registro ORDER BY id DESC LIMIT ?) ORDER BY id').all(limite) as VoceRegistro[]
  }
}
