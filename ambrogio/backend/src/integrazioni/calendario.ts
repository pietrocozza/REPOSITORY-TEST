import type { AccessoGoogle } from './google.ts'

// Google Calendar (e quindi anche il calendario dell'iPhone, se lì è aggiunto l'account Google):
// Ambrogio legge gli impegni di tutti i calendari dell'account e può aggiungerne, sempre con il permesso di Pietro.

const API = 'https://www.googleapis.com/calendar/v3'
const FUSO = 'Europe/Rome'

export type Impegno = { titolo: string; inizio: string; fine: string; tuttoIlGiorno: boolean; luogo?: string; calendario: string }

type EventoGoogle = {
  summary?: string
  location?: string
  status?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

export class CalendarioGoogle {
  private google: AccessoGoogle

  constructor(google: AccessoGoogle) {
    this.google = google
  }

  /** collegato e con il permesso del calendario */
  get disponibile() {
    return this.google.collegato && this.google.ha('calendar')
  }

  private controlla() {
    if (!this.google.collegato) throw new Error('Google non è collegato: Pietro può collegarlo da Menu → Email.')
    if (!this.google.ha('calendar'))
      throw new Error('Il permesso per il calendario manca: in Menu → Email premi «Scollega» e poi «Collega» di nuovo, accettando anche il calendario.')
  }

  /** gli impegni fra due istanti, da tutti i calendari visibili, in ordine */
  async impegni(da: Date, a: Date): Promise<Impegno[]> {
    this.controlla()
    const lista = (await this.google.chiama(`${API}/users/me/calendarList?minAccessRole=reader`)) as {
      items?: { id: string; summary?: string; summaryOverride?: string; hidden?: boolean; selected?: boolean }[]
    }
    const calendari = (lista.items ?? []).filter((c) => !c.hidden)
    const p = new URLSearchParams({ timeMin: da.toISOString(), timeMax: a.toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '100', timeZone: FUSO })
    const tutti = await Promise.all(
      calendari.map(async (c) => {
        const r = (await this.google.chiama(`${API}/calendars/${encodeURIComponent(c.id)}/events?${p}`).catch(() => ({ items: [] }))) as { items?: EventoGoogle[] }
        return (r.items ?? [])
          .filter((e) => e.status !== 'cancelled')
          .map((e) => ({
            titolo: e.summary || '(senza titolo)',
            inizio: e.start?.dateTime ?? e.start?.date ?? '',
            fine: e.end?.dateTime ?? e.end?.date ?? '',
            tuttoIlGiorno: !e.start?.dateTime,
            luogo: e.location,
            calendario: c.summaryOverride || c.summary || c.id,
          }))
      }),
    )
    return tutti.flat().sort((x, y) => x.inizio.localeCompare(y.inizio))
  }

  /** aggiunge un impegno al calendario principale */
  async aggiungi(o: { titolo: string; inizio: string; fine?: string; luogo?: string; note?: string; tuttoIlGiorno?: boolean }) {
    this.controlla()
    const giorno = /^\d{4}-\d{2}-\d{2}$/.test(o.inizio)
    const fine =
      o.fine ||
      (giorno ? new Date(Date.parse(o.inizio) + 86_400_000).toISOString().slice(0, 10) : new Date(Date.parse(o.inizio) + 60 * 60_000).toISOString())
    const quando = (v: string) => (giorno ? { date: v.slice(0, 10) } : { dateTime: v, timeZone: FUSO })
    const creato = (await this.google.chiama(`${API}/calendars/primary/events`, {
      method: 'POST',
      body: JSON.stringify({ summary: o.titolo, location: o.luogo, description: o.note, start: quando(o.inizio), end: quando(fine) }),
    })) as { htmlLink?: string }
    return creato
  }
}

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

/** "giovedì 9 ottobre alle 15:30" in ora italiana */
export function dettoQuando(i: Impegno) {
  const d = new Date(i.tuttoIlGiorno ? `${i.inizio}T12:00:00` : i.inizio)
  const parti = new Intl.DateTimeFormat('it-IT', { timeZone: FUSO, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d)
  const v = (t: string) => parti.find((p) => p.type === t)?.value ?? ''
  const giorno = `${v('weekday')} ${v('day')} ${v('month')}`
  return i.tuttoIlGiorno ? `${giorno} (tutto il giorno)` : `${giorno} alle ${v('hour')}:${v('minute')}`
}

// ───────── risposte immediate sull'agenda (senza Claude) ─────────
const DOMANDA_AGENDA = /\b(?:agenda|impegn\w*|appuntament\w*|cosa (?:ho|devo fare)|che (?:cosa )?ho|sono liber\w*|ho tempo)\b/

export async function rispostaAgenda(domanda: string, cal: CalendarioGoogle | undefined, adesso = new Date()): Promise<string | null> {
  const t = domanda.toLowerCase()
  if (!DOMANDA_AGENDA.test(t) || /\b(?:aggiung|segna|metti|crea|sposta|cancell|annull)\w*/.test(t) || /airbnb|ospit|prenotazion/.test(t)) return null
  if (!cal) return null
  // inizio del giorno di oggi in Italia
  const oggi = new Date(new Intl.DateTimeFormat('sv-SE', { timeZone: FUSO }).format(adesso) + 'T00:00:00')
  const piu = (n: number) => new Date(oggi.getTime() + n * 86_400_000)
  let da = adesso
  let a = piu(1)
  let quando = 'oggi'
  if (/dopodomani/.test(t)) [da, a, quando] = [piu(2), piu(3), 'dopodomani']
  else if (/domani/.test(t)) [da, a, quando] = [piu(1), piu(2), 'domani']
  else if (/settimana/.test(t)) [a, quando] = [piu(7), 'nei prossimi 7 giorni']
  else {
    const g = GIORNI.findIndex((x) => t.includes(x))
    if (g >= 0) {
      const tra = ((g - oggi.getDay() + 7) % 7) || 7
      ;[da, a, quando] = [piu(tra), piu(tra + 1), GIORNI[g]]
    }
  }
  let lista: Impegno[]
  try {
    lista = await cal.impegni(da, a)
  } catch (err) {
    return `Non riesco a leggere il calendario: ${(err as Error).message}`
  }
  if (!lista.length) return `${quando[0].toUpperCase()}${quando.slice(1)} non hai impegni in calendario.`
  const righe = lista.slice(0, 8).map((i) => `${i.titolo}, ${dettoQuando(i)}${i.luogo ? `, a ${i.luogo}` : ''}`)
  return `${quando[0].toUpperCase()}${quando.slice(1)} hai ${lista.length === 1 ? 'un impegno' : `${lista.length} impegni`}: ${righe.join('; ')}${lista.length > 8 ? '; e altri ancora' : ''}.`
}

export { MESI }
