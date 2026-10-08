import { TIPI_MEMORIA, type Database, type Livello, type StatoPratica, type TipoMemoria } from '../database/db.ts'
import type { Gmail } from '../integrazioni/gmail.ts'
import { riassumiCalendario, schedaCasa, type Airbnb } from '../integrazioni/airbnb.ts'

/** I servizi esterni collegati (impostati all'avvio): gli strumenti li usano se ci sono */
export const servizi: { gmail?: Gmail; airbnb?: Airbnb; cartellaDati?: string } = {}

const serveGmail = () => {
  if (!servizi.gmail?.collegato) throw new Error('Gmail non è collegato: Pietro può collegarlo dal menu Email di Ambrogio.')
  return servizi.gmail
}
const quando = (iso: string) =>
  iso ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(iso)) : ''
const indirizzoValido = (a: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(a.replace(/^.*<([^>]+)>.*$/, '$1'))

// Il catalogo degli strumenti: le UNICHE azioni che Claude può chiedere a Ambrogio.
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
  {
    nome: 'prenotazioni',
    descrizione:
      "Calendario Airbnb di una casa: prenotazioni dei prossimi giorni (arrivi, partenze, notti, codice prenotazione, ultime cifre del telefono dell'ospite), percentuale di occupazione e periodi liberi. Per suggerire prezzi o promozioni sui periodi liberi (Ambrogio non modifica mai i prezzi).",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        casa: { type: 'integer', description: 'Numero della casa (1 o 2; vuoto = la prima)' },
        giorni: { type: 'integer', description: 'Quanti giorni guardare in avanti (di solito 30)' },
      },
      required: [],
      additionalProperties: false,
    },
    riassunto: (a) => `Guardare il calendario Airbnb${intero(a, 'casa') ? ` della casa ${intero(a, 'casa')}` : ''}`,
    esegui: async (a) => {
      if (!servizi.airbnb?.case.length) return 'Airbnb non è collegato: nel file .env manca il link del calendario (AMBROGIO_AIRBNB_CASA_1_ICAL).'
      const { casa, periodi } = await servizi.airbnb.calendario(intero(a, 'casa') || undefined)
      const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date())
      return riassumiCalendario(casa.nome, periodi, oggi, Math.min(365, Math.max(1, intero(a, 'giorni') || 30)))
    },
  },
  {
    nome: 'info_casa',
    descrizione:
      "La scheda di una casa vacanza (indirizzo, check-in e check-out, wifi, regole, dotazioni, parcheggio, zona, risposte pronte, emergenze): usala per rispondere alle domande degli ospiti. Non inventare mai informazioni che non ci sono e non dare mai codici di porte o cassette.",
    livello: 1,
    schema: {
      type: 'object',
      properties: { casa: { type: 'integer', description: 'Numero della casa (1 o 2; vuoto = 1)' } },
      required: [],
      additionalProperties: false,
    },
    riassunto: (a) => `Leggere la scheda della casa ${intero(a, 'casa') || 1}`,
    esegui: (a) => {
      const scheda = schedaCasa(servizi.cartellaDati ?? 'data', intero(a, 'casa') || 1)
      return scheda.compilata
        ? scheda.testo
        : `La scheda della casa non è ancora compilata: Pietro deve riempire il file ${scheda.file}. Per ora non dare informazioni sulla casa agli ospiti.`
    },
  },
  {
    nome: 'leggi_email',
    descrizione:
      "Elenca le email più recenti di Gmail, oppure quelle che rispondono a una ricerca con la stessa sintassi della casella di Gmail (es. 'from:airbnb is:unread', 'subject:prenotazione newer_than:7d'). Restituisce id, mittente, oggetto, data e anteprima.",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        cerca: { type: 'string', description: 'Ricerca in stile Gmail (vuoto = posta in arrivo)' },
        quante: { type: 'integer', description: 'Quante email (1–25, di solito 10)' },
      },
      required: [],
      additionalProperties: false,
    },
    riassunto: (a) => (testo(a, 'cerca') ? `Cercare email: «${testo(a, 'cerca')}»` : 'Leggere le ultime email'),
    esegui: async (a) => {
      const lista = await serveGmail().elenco(testo(a, 'cerca') || 'in:inbox', intero(a, 'quante') || 10)
      if (!lista.length) return 'Nessuna email trovata.'
      return lista
        .map((e) => `[id ${e.id}] ${quando(e.data)} · Da: ${e.da} · Oggetto: ${e.oggetto}${e.nonLetta ? ' · NON LETTA' : ''}\n  ${e.anteprima}`)
        .join('\n')
    },
  },
  {
    nome: 'apri_email',
    descrizione: "Apre un'email di Gmail e ne restituisce il testo completo (serve l'id, trovalo con leggi_email).",
    livello: 1,
    schema: {
      type: 'object',
      properties: { id: { type: 'string', description: "Id dell'email" } },
      required: ['id'],
      additionalProperties: false,
    },
    riassunto: () => "Leggere un'email",
    esegui: async (a) => {
      const e = await serveGmail().apri(testo(a, 'id'))
      return `Da: ${e.da}\nA: ${e.a}\nData: ${quando(e.data)}\nOggetto: ${e.oggetto}\n\n${e.testo || '(email senza testo)'}`
    },
  },
  {
    nome: 'bozza_email',
    descrizione:
      "Prepara una bozza in Gmail (NON la invia: resta nelle bozze per Pietro). Per rispondere a un'email indica rispondi_a con il suo id: la bozza resta nella stessa conversazione.",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        a: { type: 'string', description: 'Destinatario (indirizzo email)' },
        oggetto: { type: 'string', description: 'Oggetto (per le risposte si può lasciare vuoto)' },
        testo: { type: 'string', description: "Testo dell'email" },
        rispondi_a: { type: 'string', description: "Facoltativo: id dell'email a cui si risponde" },
      },
      required: ['a', 'testo'],
      additionalProperties: false,
    },
    riassunto: (a) => `Preparare una bozza per ${testo(a, 'a')}`,
    esegui: async (a) => {
      if (!indirizzoValido(testo(a, 'a'))) return 'Indirizzo del destinatario non valido.'
      const id = await serveGmail().bozza({ a: testo(a, 'a'), oggetto: testo(a, 'oggetto'), testo: testo(a, 'testo'), rispondiA: testo(a, 'rispondi_a') || undefined })
      return `Bozza salvata in Gmail (id ${id}). Non è stata inviata.`
    },
  },
  {
    nome: 'invia_email',
    descrizione:
      "Invia un'email da Gmail. Prima dell'invio Pietro deve dare il permesso. Per rispondere a un'email indica rispondi_a con il suo id. Scrivi il testo definitivo: verrà mostrato a Pietro così com'è.",
    livello: 2,
    schema: {
      type: 'object',
      properties: {
        a: { type: 'string', description: 'Destinatario (indirizzo email)' },
        oggetto: { type: 'string', description: 'Oggetto (per le risposte si può lasciare vuoto)' },
        testo: { type: 'string', description: "Testo dell'email" },
        rispondi_a: { type: 'string', description: "Facoltativo: id dell'email a cui si risponde" },
      },
      required: ['a', 'testo'],
      additionalProperties: false,
    },
    riassunto: (a) => {
      const t = testo(a, 'testo')
      return `Inviare un'email a ${testo(a, 'a')}${testo(a, 'oggetto') ? ` («${testo(a, 'oggetto')}»)` : ''}: «${t.length > 280 ? t.slice(0, 280) + '…' : t}»`
    },
    esegui: async (a) => {
      if (!indirizzoValido(testo(a, 'a'))) return 'Indirizzo del destinatario non valido: email non inviata.'
      const id = await serveGmail().invia({ a: testo(a, 'a'), oggetto: testo(a, 'oggetto'), testo: testo(a, 'testo'), rispondiA: testo(a, 'rispondi_a') || undefined })
      return `Email inviata (id ${id}).`
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
