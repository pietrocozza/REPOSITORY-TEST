import { TIPI_MEMORIA, type Database, type Livello, type StatoPratica, type TipoMemoria } from '../database/db.ts'

// Il catalogo degli strumenti: le UNICHE azioni che Claude può chiedere a Jarvis.
// Ogni strumento dichiara il suo livello di permesso:
//   1 = automatico (letture, ricerche, appunti interni)
//   2 = con conferma (invii, modifiche a dati importanti)
//   3 = sensibile (eliminazioni, pagamenti, contratti): conferma esplicita SEMPRE
// Il controllo lo fa il gestore dei permessi nel backend, non il modello.

export type Argomenti = Record<string, unknown>
type Schema = {
  type: 'object'
  properties: Record<string, { type: 'string' | 'integer'; description: string; enum?: string[] }>
  required: string[]
  additionalProperties: false
}

export type Strumento = {
  nome: string
  descrizione: string
  livello: Livello
  schema: Schema
  /** frase leggibile per la richiesta di conferma e per il registro */
  riassunto: (a: Argomenti, db: Database) => string
  esegui: (a: Argomenti, db: Database) => string | Promise<string>
}

const testo = (a: Argomenti, k: string) => String(a[k] ?? '').trim()
const intero = (a: Argomenti, k: string) => Number.parseInt(String(a[k]), 10)
const STATI_PRATICA: StatoPratica[] = ['aperta', 'in_attesa', 'chiusa']

export const STRUMENTI: Strumento[] = [
  {
    nome: 'ricorda',
    descrizione:
      "Salva nella memoria permanente qualcosa da ricordare anche nelle prossime conversazioni: una preferenza dell'utente, una persona, un contatto, una regola da seguire, una nota. Se esiste già una memoria con lo stesso tipo e titolo, la aggiorna.",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: TIPI_MEMORIA, description: 'Che cosa è' },
        titolo: { type: 'string', description: 'Breve, per ritrovarla (es. "Marco Rossi", "Caffè", "Email ai clienti")' },
        contenuto: { type: 'string', description: 'Cosa ricordare, in una o due frasi' },
      },
      required: ['tipo', 'titolo', 'contenuto'],
      additionalProperties: false,
    },
    riassunto: (a) => `Memorizzare (${testo(a, 'tipo')}) «${testo(a, 'titolo')}»`,
    esegui: (a, db) => {
      const m = db.ricorda(testo(a, 'tipo') as TipoMemoria, testo(a, 'titolo'), testo(a, 'contenuto'))
      return `Memorizzato (id ${m.id}): ${m.titolo} — ${m.contenuto}`
    },
  },
  {
    nome: 'cerca_memoria',
    descrizione: "Cerca nella memoria permanente: preferenze, persone, contatti, regole e note salvate. Lascia vuoto il testo per elencare le più recenti.",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        testo: { type: 'string', description: 'Parole da cercare (può essere vuoto)' },
        tipo: { type: 'string', enum: TIPI_MEMORIA, description: 'Facoltativo: cerca solo un tipo' },
      },
      required: [],
      additionalProperties: false,
    },
    riassunto: (a) => `Cercare nella memoria${testo(a, 'testo') ? ` «${testo(a, 'testo')}»` : ''}`,
    esegui: (a, db) => {
      const tipo = TIPI_MEMORIA.includes(testo(a, 'tipo') as TipoMemoria) ? (testo(a, 'tipo') as TipoMemoria) : undefined
      const trovate = db.cercaMemorie(testo(a, 'testo'), tipo)
      if (!trovate.length) return 'Nessuna memoria trovata.'
      return trovate.map((m) => `[id ${m.id}] (${m.tipo}) ${m.titolo}: ${m.contenuto}`).join('\n')
    },
  },
  {
    nome: 'dimentica',
    descrizione: "Cancella definitivamente una memoria (serve l'id, trovalo con cerca_memoria). È un'eliminazione: l'utente dovrà confermarla esplicitamente.",
    livello: 3,
    schema: {
      type: 'object',
      properties: { id: { type: 'integer', description: 'Id della memoria da cancellare' } },
      required: ['id'],
      additionalProperties: false,
    },
    riassunto: (a, db) => {
      const m = db.memoria(intero(a, 'id'))
      return m ? `Cancellare per sempre la memoria «${m.titolo}» (${m.contenuto})` : `Cancellare la memoria n. ${intero(a, 'id')}`
    },
    esegui: (a, db) => (db.dimentica(intero(a, 'id')) ? 'Memoria cancellata.' : 'Nessuna memoria con questo id.'),
  },
  {
    nome: 'apri_pratica',
    descrizione:
      "Apre una pratica: un'attività che dura nel tempo e va seguita fino alla fine (es. ottenere un rimborso, una richiesta all'assistenza, una scadenza da gestire). Restituisce l'id da usare per aggiornarla.",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        titolo: { type: 'string', description: 'Breve (es. "Rimborso abbonamento palestra")' },
        descrizione: { type: 'string', description: "Obiettivo e cosa sai finora" },
      },
      required: ['titolo', 'descrizione'],
      additionalProperties: false,
    },
    riassunto: (a) => `Aprire la pratica «${testo(a, 'titolo')}»`,
    esegui: (a, db) => {
      const p = db.apriPratica(testo(a, 'titolo'), testo(a, 'descrizione'))
      return `Pratica aperta (id ${p.id}): ${p.titolo}`
    },
  },
  {
    nome: 'aggiorna_pratica',
    descrizione: "Aggiunge una nota a una pratica e/o ne cambia lo stato (aperta, in_attesa di una risposta, chiusa quando è risolta).",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Id della pratica' },
        nota: { type: 'string', description: 'Cosa è successo (facoltativo)' },
        stato: { type: 'string', enum: STATI_PRATICA, description: 'Nuovo stato (facoltativo)' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    riassunto: (a, db) => `Aggiornare la pratica «${db.pratica(intero(a, 'id'))?.titolo ?? intero(a, 'id')}»`,
    esegui: (a, db) => {
      const stato = STATI_PRATICA.includes(testo(a, 'stato') as StatoPratica) ? (testo(a, 'stato') as StatoPratica) : undefined
      const p = db.aggiornaPratica(intero(a, 'id'), { stato, nota: testo(a, 'nota') || undefined })
      return p ? `Pratica ${p.id} aggiornata: stato ${p.stato}.` : 'Nessuna pratica con questo id.'
    },
  },
  {
    nome: 'elenca_pratiche',
    descrizione: 'Elenca le pratiche con stato e note. Senza stato le mostra tutte (prima quelle aperte).',
    livello: 1,
    schema: {
      type: 'object',
      properties: { stato: { type: 'string', enum: STATI_PRATICA, description: 'Facoltativo' } },
      required: [],
      additionalProperties: false,
    },
    riassunto: () => 'Consultare le pratiche',
    esegui: (a, db) => {
      const stato = STATI_PRATICA.includes(testo(a, 'stato') as StatoPratica) ? (testo(a, 'stato') as StatoPratica) : undefined
      const lista = db.pratiche(stato)
      if (!lista.length) return 'Nessuna pratica.'
      return lista.map((p) => `[id ${p.id}] ${p.titolo} — ${p.stato}\n  ${p.descrizione}${p.note ? `\n  Note:\n  ${p.note.replace(/\n/g, '\n  ')}` : ''}`).join('\n')
    },
  },
]

export const strumento = (nome: string) => STRUMENTI.find((s) => s.nome === nome)

/** Controllo degli argomenti secondo lo schema: mai fidarsi di quello che arriva dal modello. */
export function validaArgomenti(s: Strumento, a: unknown): string | null {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return 'Gli argomenti devono essere un oggetto.'
  const arg = a as Argomenti
  for (const k of Object.keys(arg)) if (!(k in s.schema.properties)) return `Argomento sconosciuto: ${k}`
  for (const k of s.schema.required) if (arg[k] === undefined || arg[k] === '') return `Manca l'argomento ${k}.`
  for (const [k, def] of Object.entries(s.schema.properties)) {
    const v = arg[k]
    if (v === undefined) continue
    if (def.type === 'integer' && !Number.isInteger(typeof v === 'string' ? Number(v) : v)) return `${k} deve essere un numero intero.`
    if (def.type === 'string' && typeof v !== 'string') return `${k} deve essere un testo.`
    if (def.type === 'string' && (v as string).length > 4000) return `${k} è troppo lungo.`
    if (def.enum && !def.enum.includes(String(v))) return `${k} deve essere uno tra: ${def.enum.join(', ')}.`
  }
  return null
}
