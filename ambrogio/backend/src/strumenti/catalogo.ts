import { TIPI_MEMORIA, type Database, type Livello, type StatoPratica, type TipoMemoria } from '../database/db.ts'
import type { Gmail } from '../integrazioni/gmail.ts'
import { riassumiCalendario, schedaCasa, type Airbnb } from '../integrazioni/airbnb.ts'
import { incassiPerMese, quantiOspiti, type ArchivioAirbnb } from '../integrazioni/archivio-airbnb.ts'
import { rendimentoPerMese, type FoglioSpese, type Spesa, type SpesaFissa } from '../integrazioni/spese.ts'
import { dettoQuando, type CalendarioGoogle } from '../integrazioni/calendario.ts'

/** I servizi esterni collegati (impostati all'avvio): gli strumenti li usano se ci sono */
export const servizi: { gmail?: Gmail; airbnb?: Airbnb; calendario?: CalendarioGoogle; cartellaDati?: string; archivio?: ArchivioAirbnb; spese?: FoglioSpese } = {}

/** quello che si sa dalle email di Airbnb su una prenotazione (ospite, quanti, guadagno) */
export function dettagliDalleEmail(db: Database, codice: string) {
  const p = db.prenotazione(codice)
  if (!p) return null
  const parti = [p.ospite && `ospite ${p.ospite}`, quantiOspiti(p), p.guadagno != null && `guadagno ${Math.round(p.guadagno)} ${p.valuta && !/eur/i.test(p.valuta) ? p.valuta : 'euro'}`, p.stato !== 'confermata' && p.stato]
  const testo = parti.filter(Boolean).join(', ')
  return testo ? `, ${testo}` : null
}

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
    nome: 'agenda',
    descrizione:
      "Gli impegni di Pietro da Google Calendar (tutti i suoi calendari, anche quelli dell'iPhone se sincronizzati con Google) a partire da una data, per un certo numero di giorni.",
    livello: 1,
    schema: {
      type: 'object',
      properties: {
        da: { type: 'string', description: 'Data di inizio AAAA-MM-GG (vuoto = oggi)' },
        giorni: { type: 'integer', description: 'Quanti giorni guardare (di solito 1 o 7)' },
      },
      required: [],
      additionalProperties: false,
    },
    riassunto: (a) => `Guardare l'agenda${testo(a, 'da') ? ` dal ${testo(a, 'da')}` : ''}`,
    esegui: async (a) => {
      if (!servizi.calendario) return 'Google Calendar non è collegato.'
      const da = testo(a, 'da') ? new Date(`${testo(a, 'da')}T00:00:00`) : new Date()
      const a2 = new Date(da.getTime() + Math.min(60, Math.max(1, intero(a, 'giorni') || 7)) * 86_400_000)
      const lista = await servizi.calendario.impegni(da, a2)
      if (!lista.length) return 'Nessun impegno in quel periodo.'
      return lista.map((i) => `- ${dettoQuando(i)}: ${i.titolo}${i.luogo ? ` (${i.luogo})` : ''} [${i.calendario}]`).join('\n')
    },
  },
  {
    nome: 'aggiungi_impegno',
    descrizione: "Aggiunge un impegno al Google Calendar di Pietro (chiede sempre il suo permesso).",
    livello: 2,
    schema: {
      type: 'object',
      properties: {
        titolo: { type: 'string', description: "Cosa (es. 'Check-in ospiti Trastevere')" },
        inizio: { type: 'string', description: "Quando: AAAA-MM-GGTHH:MM (ora italiana) oppure AAAA-MM-GG per tutto il giorno" },
        fine: { type: 'string', description: 'Fine, stesso formato (vuoto = un\'ora dopo, o il giorno intero)' },
        luogo: { type: 'string', description: 'Dove (facoltativo)' },
        note: { type: 'string', description: 'Note (facoltative)' },
      },
      required: ['titolo', 'inizio'],
      additionalProperties: false,
    },
    riassunto: (a) => `Aggiungere al calendario «${testo(a, 'titolo')}» (${testo(a, 'inizio')})`,
    esegui: async (a) => {
      if (!servizi.calendario) return 'Google Calendar non è collegato.'
      await servizi.calendario.aggiungi({
        titolo: testo(a, 'titolo'),
        inizio: testo(a, 'inizio'),
        fine: testo(a, 'fine') || undefined,
        luogo: testo(a, 'luogo') || undefined,
        note: testo(a, 'note') || undefined,
      })
      return `Impegno aggiunto: ${testo(a, 'titolo')} (${testo(a, 'inizio')}).`
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
    esegui: async (a, db) => {
      if (!servizi.airbnb?.case.length) return 'Airbnb non è collegato: nel file .env manca il link del calendario (AMBROGIO_AIRBNB_CASA_1_ICAL).'
      const { casa, periodi } = await servizi.airbnb.calendario(intero(a, 'casa') || undefined)
      const oggi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date())
      return riassumiCalendario(casa.nome, periodi, oggi, Math.min(365, Math.max(1, intero(a, 'giorni') || 30)), (codice) => dettagliDalleEmail(db, codice))
    },
  },
  {
    nome: 'rendimento',
    descrizione:
      'Rendimento delle case Airbnb mese per mese: incassi (dalle email di conferma e dal file dei guadagni di Airbnb), notti, occupazione, prezzo medio a notte (ADR), RevPAR, spese fisse (affitto, condominio) e spese registrate (bollette, pulizie…) dal foglio delle spese, utile e margine. Per domande su revenue, incassi, guadagni, spese, utile e confronti tra mesi.',
    livello: 1,
    schema: {
      type: 'object',
      properties: { da: { type: 'string', description: 'Primo mese AAAA-MM (facoltativo)' }, a: { type: 'string', description: 'Ultimo mese AAAA-MM (facoltativo)' } },
      required: [],
      additionalProperties: false,
    },
    riassunto: () => 'Calcolare il rendimento delle case',
    esegui: async (a, db) => {
      let spese: Spesa[] = []
      let fisse: SpesaFissa[] = []
      let notaSpese = ''
      try {
        if (servizi.spese?.disponibile) ({ spese, fisse } = await servizi.spese.leggi())
        else notaSpese = 'Il foglio delle spese non è collegato: le spese non sono incluse (Pietro deve attivare Google Sheets API e ricollegare Google).'
      } catch (err) {
        notaSpese = `Non riesco a leggere il foglio delle spese: ${(err as Error).message}`
      }
      const da = testo(a, 'da')
      const fino = testo(a, 'a')
      const mesi = rendimentoPerMese(incassiPerMese(db.prenotazioniArchiviate()), spese, fisse, servizi.airbnb?.case.length || 1, db.guadagniMensili()).filter(
        (m) => (!da || m.mese >= da) && (!fino || m.mese <= fino),
      )
      if (!mesi.length)
        return `Non ci sono ancora dati: gli incassi arrivano dai report di Airbnb caricati in Impostazioni → Airbnb e, da soli, dalle email di Airbnb. ${notaSpese}`
      const tabella = mesi.map((m) => {
        const notti = m.notti ? `${m.notti} notti | occupazione ${m.occupazione}% | ADR ${m.prezzoMedio} € | RevPAR ${m.revpar} €` : 'notti non note'
        return `${m.mese} | ${m.incassi} €${m.fonte === 'report' ? ' (report Airbnb)' : ''} | ${notti} | spese fisse ${m.speseFisse} € | altre spese ${m.speseVariabili} € | utile ${m.utile} € | margine ${m.margine}%`
      })
      // totali per anno
      const anni = new Map<string, { incassi: number; spese: number; utile: number; mesi: number }>()
      for (const m of mesi) {
        const t = anni.get(m.mese.slice(0, 4)) ?? { incassi: 0, spese: 0, utile: 0, mesi: 0 }
        t.incassi += m.incassi
        t.spese += m.speseFisse + m.speseVariabili
        t.utile += m.utile
        t.mesi++
        anni.set(m.mese.slice(0, 4), t)
      }
      const perAnno = [...anni.entries()].map(([a, t]) => `${a} (${t.mesi} mesi): incassi ${t.incassi} €, spese ${t.spese} €, utile ${t.utile} €`)
      const prestazioni = db
        .reportAnnunci()
        .map(
          (r) =>
            `${r.periodo} ${r.annuncio}: ${r.prenotazioni ?? 0} prenotazioni, valore ${r.valore ?? 0} €, ${r.notti ?? 0} notti, prezzo medio ${r.prezzo_medio ?? '—'} €, soggiorno medio ${r.durata_media ?? '—'} notti, prenotano con ${r.anticipo_medio ?? '—'} giorni di anticipo, contatti/visualizzazioni ${r.tasso_contatto ?? '—'}%, prenotazioni/contatti ${r.tasso_prenotazione ?? '—'}%`,
        )
      return [
        'Incassi = netto per l’host (dopo commissioni Airbnb). Mese | incassi | notti | spese fisse | altre spese | utile | margine',
        ...tabella,
        'Totali per anno:',
        ...perAnno,
        ...(prestazioni.length ? ['Prestazioni degli annunci (report di Airbnb):', ...prestazioni] : []),
        ...(notaSpese ? [notaSpese] : []),
        ...(servizi.spese?.link ? [`Foglio delle spese: ${servizi.spese.link}`] : []),
      ].join('\n')
    },
  },
  {
    nome: 'spese',
    descrizione:
      "Le spese delle case dal foglio Google «Ambrogio – Spese case»: spese fisse mensili (affitto, condominio) e spese registrate (bollette, pulizie, riparazioni…), con il link al foglio.",
    livello: 1,
    schema: { type: 'object', properties: { mese: { type: 'string', description: 'Mese AAAA-MM (vuoto = tutte)' } }, required: [], additionalProperties: false },
    riassunto: () => 'Guardare il foglio delle spese',
    esegui: async (a) => {
      if (!servizi.spese) return 'Il foglio delle spese non è disponibile.'
      const { spese, fisse } = await servizi.spese.leggi()
      const mese = testo(a, 'mese')
      const elenco = spese.filter((s) => !mese || s.data.startsWith(mese))
      return [
        `Spese fisse al mese: ${fisse.map((f) => `${f.voce} ${f.importo} €${f.dal ? ` dal ${f.dal}` : ''}${f.al ? ` al ${f.al}` : ''}`).join(', ') || 'nessuna'}.`,
        `Spese registrate${mese ? ` di ${mese}` : ''}:`,
        ...(elenco.length ? elenco.map((s) => `- ${s.data} ${s.descrizione} (${s.categoria}) ${s.importo} €${s.casa ? `, ${s.casa}` : ''}`) : ['- nessuna']),
        `Foglio: ${servizi.spese.link ?? ''}`,
      ].join('\n')
    },
  },
  {
    nome: 'aggiungi_spesa',
    descrizione:
      "Registra una spesa di una casa nel foglio delle spese (bolletta luce/gas/acqua/internet, pulizie, lavanderia, riparazione, acquisti…). Usala quando Pietro dice di aver pagato qualcosa per la casa.",
    livello: 2,
    schema: {
      type: 'object',
      properties: {
        descrizione: { type: 'string', description: "Cosa (es. 'Bolletta luce settembre')" },
        importo: { type: 'string', description: 'Quanto, in euro (es. 85.50)' },
        categoria: { type: 'string', description: 'Bollette, Pulizie, Lavanderia, Manutenzione, Acquisti, Tasse, Altro' },
        data: { type: 'string', description: 'Quando, AAAA-MM-GG (vuoto = oggi)' },
        casa: { type: 'string', description: 'Quale casa (facoltativo)' },
      },
      required: ['descrizione', 'importo'],
      additionalProperties: false,
    },
    riassunto: (a) => `Registrare la spesa «${testo(a, 'descrizione')}» di ${testo(a, 'importo')} €`,
    esegui: async (a) => {
      if (!servizi.spese) return 'Il foglio delle spese non è disponibile.'
      const importo = Number(String(a.importo).replace(',', '.'))
      if (!Number.isFinite(importo) || importo <= 0) return 'Importo non valido.'
      const data = /^\d{4}-\d{2}-\d{2}$/.test(testo(a, 'data')) ? testo(a, 'data') : new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date())
      await servizi.spese.aggiungi({ data, descrizione: testo(a, 'descrizione'), categoria: testo(a, 'categoria') || 'Altro', importo, casa: testo(a, 'casa') })
      return `Spesa registrata: ${testo(a, 'descrizione')}, ${importo} € (${data}).`
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
