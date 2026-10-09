import fs from 'node:fs'
import path from 'node:path'
import type { PrenotazioneArchiviata } from '../database/db.ts'
import { quantiOspiti } from './archivio-airbnb.ts'

// Airbnb, con i canali ufficiali che Airbnb dà a ogni host (niente password, niente robot sul sito):
//  - il CALENDARIO esportato (link iCal: Annuncio → Disponibilità → Collega calendari → Esporta): le prenotazioni;
//  - le email di Airbnb in Gmail (messaggi degli ospiti, prenotazioni): le legge Ambrogio con gli strumenti email;
//  - la SCHEDA DELLA CASA (data/case/casa-1.txt): le informazioni con cui Ambrogio risponde agli ospiti.
// I prezzi non si toccano mai: Ambrogio può solo suggerirli.

export type Casa = { numero: number; nome: string; ical: string }
export type Periodo = {
  inizio: string // AAAA-MM-GG (check-in)
  fine: string // AAAA-MM-GG (check-out)
  notti: number
  tipo: 'prenotazione' | 'blocco'
  codice?: string
  telefono4?: string
}

const giorno = (v: string) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`
const differenzaGiorni = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)

/** legge il calendario iCal di Airbnb (righe spezzate comprese) */
export function leggiIcal(testo: string): Periodo[] {
  const righe = testo.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const periodi: Periodo[] = []
  let ev: Record<string, string> | null = null
  for (const riga of righe) {
    if (riga === 'BEGIN:VEVENT') ev = {}
    else if (riga === 'END:VEVENT' && ev) {
      const inizio = ev.DTSTART?.match(/(\d{8})/)?.[1]
      const fine = ev.DTEND?.match(/(\d{8})/)?.[1]
      if (inizio && fine) {
        const descrizione = (ev.DESCRIPTION ?? '').replace(/\\n/g, '\n').replace(/\\,/g, ',')
        const prenotazione = /reserved|prenotat/i.test(ev.SUMMARY ?? '') || /reservations\/details/i.test(descrizione)
        periodi.push({
          inizio: giorno(inizio),
          fine: giorno(fine),
          notti: differenzaGiorni(giorno(inizio), giorno(fine)),
          tipo: prenotazione ? 'prenotazione' : 'blocco',
          codice: descrizione.match(/details\/([A-Z0-9]+)/)?.[1],
          telefono4: descrizione.match(/\(Last 4 Digits\):\s*(\d{4})/i)?.[1],
        })
      }
      ev = null
    } else if (ev) {
      const i = riga.indexOf(':')
      if (i > 0) ev[riga.slice(0, i).split(';')[0]] = riga.slice(i + 1)
    }
  }
  return periodi.sort((a, b) => a.inizio.localeCompare(b.inizio))
}

/** riassunto parlato dei prossimi giorni: arrivi, partenze, occupazione e buchi */
export function riassumiCalendario(nome: string, periodi: Periodo[], oggi: string, giorni = 30, dettagli?: (codice: string) => string | null) {
  const fineFinestra = new Date(Date.parse(oggi) + giorni * 86_400_000).toISOString().slice(0, 10)
  const pren = periodi.filter((p) => p.tipo === 'prenotazione' && p.fine > oggi && p.inizio < fineFinestra)
  // notti occupate nella finestra
  let occupate = 0
  for (const p of periodi.filter((p) => p.fine > oggi && p.inizio < fineFinestra)) {
    const da = p.inizio > oggi ? p.inizio : oggi
    const a = p.fine < fineFinestra ? p.fine : fineFinestra
    occupate += Math.max(0, differenzaGiorni(da, a))
  }
  // buchi liberi tra una prenotazione e l'altra
  const buchi: string[] = []
  let libero = oggi
  for (const p of periodi.filter((p) => p.fine > oggi && p.inizio < fineFinestra)) {
    if (p.inizio > libero && differenzaGiorni(libero, p.inizio) >= 1) buchi.push(`${libero} → ${p.inizio} (${differenzaGiorni(libero, p.inizio)} notti)`)
    if (p.fine > libero) libero = p.fine
  }
  if (libero < fineFinestra) buchi.push(`${libero} → ${fineFinestra} (${differenzaGiorni(libero, fineFinestra)} notti, fino alla fine della finestra)`)
  const righe = pren.map(
    (p) => `- arrivo ${p.inizio}, partenza ${p.fine} (${p.notti} notti)${p.codice ? `, codice ${p.codice}` : ''}${p.telefono4 ? `, telefono …${p.telefono4}` : ''}${p.codice && dettagli ? (dettagli(p.codice) ?? '') : ''}${p.inizio <= oggi ? ' — OSPITE IN CASA ORA' : ''}`,
  )
  return `${nome}: prossimi ${giorni} giorni, occupazione ${Math.round((occupate / giorni) * 100)}% (${occupate} notti su ${giorni}).
Prenotazioni:
${righe.join('\n') || '- nessuna'}
Periodi liberi:
${buchi.map((b) => `- ${b}`).join('\n') || '- nessuno'}`
}

const MODELLO_SCHEDA = `SCHEDA DELLA CASA — la usa Ambrogio per rispondere agli ospiti.
Scrivi sotto ogni titolo, in italiano semplice. NIENTE codici di porte, cassette o allarmi qui:
quelli Ambrogio non li dà mai da solo (li chiede a te).

NOME DELLA CASA:

INDIRIZZO E COME ARRIVARE (metro, bus, taxi, dall'aeroporto, dalla stazione):

CHECK-IN (orario, come si entra in generale, self check-in sì/no):

CHECK-OUT (orario, cosa fare prima di uscire, dove lasciare le chiavi):

WIFI (nome della rete; la password scrivila solo se va bene che Ambrogio la dia agli ospiti):

REGOLE DELLA CASA (fumo, animali, feste, rumore, ospiti extra):

COSA C'È IN CASA (asciugamani, lenzuola, phon, ferro, lavatrice, cucina, caffè, aria condizionata, riscaldamento):

PARCHEGGIO:

ZONA: SUPERMERCATI, FARMACIA, RISTORANTI CONSIGLIATI, COSA VEDERE:

DOMANDE FREQUENTI E LE TUE RISPOSTE PRONTE (copiale da Airbnb se le hai):

EMERGENZE (chi chiamare: idraulico, elettricista, numero unico 112):
`

/** la scheda della casa (se manca, si crea il modello da riempire) */
export function schedaCasa(cartellaDati: string, numero: number) {
  const file = path.join(cartellaDati, 'case', `casa-${numero}.txt`)
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, MODELLO_SCHEDA)
  }
  const testo = fs.readFileSync(file, 'utf8')
  // compilata = c'è almeno una riga scritta da Pietro (diversa da quelle del modello)
  const modello = new Set(MODELLO_SCHEDA.split('\n').map((r) => r.trim()))
  const compilata = testo.split('\n').some((r) => r.trim() && !modello.has(r.trim()))
  return { file, testo, compilata }
}

export class Airbnb {
  case: Casa[]
  private cache = new Map<number, { quando: number; periodi: Periodo[] }>()
  private scarica: (url: string) => Promise<string>

  constructor(case_: Casa[], scarica?: (url: string) => Promise<string>) {
    this.case = case_
    this.scarica =
      scarica ??
      (async (url) => {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(20_000),
          // come fanno i programmi di calendario che si sincronizzano con Airbnb
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Ambrogio-Calendario/1.0)', Accept: 'text/calendar, */*' },
        })
        if (!res.ok) throw new Error(`Airbnb non dà il calendario (errore ${res.status}): controlla il link nel file .env`)
        const testo = await res.text()
        if (!testo.includes('BEGIN:VCALENDAR')) throw new Error('Airbnb ha risposto, ma non con un calendario: controlla il link nel file .env')
        return testo
      })
  }

  casa(numero?: number) {
    return this.case.find((c) => c.numero === (numero || this.case[0]?.numero))
  }

  /** il calendario della casa (si riscarica al massimo ogni 15 minuti) */
  async calendario(numero?: number): Promise<{ casa: Casa; periodi: Periodo[] }> {
    const casa = this.casa(numero)
    if (!casa) throw new Error('Nessuna casa collegata: nel file .env manca AMBROGIO_AIRBNB_CASA_1_ICAL (il link del calendario di Airbnb).')
    const c = this.cache.get(casa.numero)
    if (c && Date.now() - c.quando < 15 * 60_000) return { casa, periodi: c.periodi }
    const periodi = leggiIcal(await this.scarica(casa.ical))
    this.cache.set(casa.numero, { quando: Date.now(), periodi })
    return { casa, periodi }
  }
}

// ───────── Risposte immediate sul calendario (senza Claude) ─────────

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
const piu = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86_400_000).toISOString().slice(0, 10)
const detto = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${GIORNI[d.getUTCDay()]} ${d.getUTCDate()} ${MESI[d.getUTCMonth()]}`
}
const notti = (n: number) => (n === 1 ? 'una notte' : `${n} notti`)

// domande sul calendario a cui si risponde da soli; prezzi, consigli e messaggi vanno a Claude
const DOMANDA_CALENDARIO = /\b(?:chi arriva|arriv\w*|chi parte|parten\w*|check.?in|check.?out|prenotazion\w*|prenotat\w*|occupa\w*|liber\w*|calendario|ospit\w*|airbnb|disponibilit\w*)\b/
const VA_A_CLAUDE = /\b(?:prezz\w*|costa|tariff\w*|consigl\w*|messaggi?\w*|scriv\w*|rispond\w*|email|recension\w*|guadagn\w*|incass\w*|perché)\b/
// quanti sono, come si chiamano, da dove vengono: il calendario non lo sa (è nelle email di Airbnb), ci pensa Claude
const DETTAGLI_OSPITI = /\b(?:quant[ie]\s+(?:ospiti|persone|adulti|bambini)|quante\s+persone|in\s+quanti|come\s+si\s+chiam\w*|nome|nomi|chi\s+(?:è|e|sono)\b|telefono|numero\s+di|da\s+dove|nazionalit\w*|codice\s+(?:di\s+)?prenotazione)/

/** Risposta parlata e immediata alle domande sul calendario, oppure null (allora risponde Claude) */
export async function rispostaCalendario(
  domanda: string,
  airbnb: Airbnb | undefined,
  oggi: string,
  archivio?: (codice: string) => PrenotazioneArchiviata | undefined,
): Promise<string | null> {
  const t = domanda.toLowerCase()
  // quanti sono e come si chiamano: si risponde subito solo se l'archivio delle email lo sa
  const chiedeOspiti = DETTAGLI_OSPITI.test(t)
  const sappiamoOspiti = chiedeOspiti && archivio && /quant[ie]|in quanti|come si chiam|\bnom[ei]\b|chi (?:è|e|sono)/.test(t)
  if (!DOMANDA_CALENDARIO.test(t) || VA_A_CLAUDE.test(t) || (chiedeOspiti && !sappiamoOspiti)) return null
  // calendario non collegato: lo si dice subito (niente giri lenti nelle email)
  if (!airbnb?.case.length)
    return /airbnb|prenotazion|calendario|arriv|parten|occupa|disponibilit/.test(t)
      ? 'Il calendario di Airbnb non è ancora collegato: nel file .env manca la riga AMBROGIO_AIRBNB_CASA_1_ICAL con il link del calendario. Aggiungila, salva e riavviami.'
      : null
  const numero = /\b(?:casa|appartamento)\s*(?:2|due)\b|second[ao] casa/.test(t) ? 2 : undefined
  let letto: Awaited<ReturnType<Airbnb['calendario']>>
  try {
    letto = await airbnb.calendario(numero)
  } catch (err) {
    return `Non riesco a leggere il calendario di Airbnb: ${(err as Error).message}.`
  }
  const { casa, periodi } = letto
  const pren = periodi.filter((p) => p.tipo === 'prenotazione')

  // la finestra di tempo della domanda
  let da = oggi
  let a = piu(oggi, 14)
  let quando = 'nei prossimi 14 giorni'
  const mese = MESI.findIndex((m) => t.includes(m))
  if (/\boggi\b/.test(t)) [a, quando] = [piu(oggi, 1), 'oggi']
  else if (/\bdomani\b/.test(t)) [da, a, quando] = [piu(oggi, 1), piu(oggi, 2), 'domani']
  else if (/prossima settimana/.test(t)) {
    const g = new Date(`${oggi}T12:00:00Z`).getUTCDay()
    da = piu(oggi, ((8 - g) % 7) || 7)
    a = piu(da, 7)
    quando = 'la prossima settimana'
  } else if (/settimana/.test(t)) [a, quando] = [piu(oggi, 7), 'nei prossimi 7 giorni']
  else if (mese >= 0) {
    const anno = Number(oggi.slice(0, 4)) + (mese < Number(oggi.slice(5, 7)) - 1 ? 1 : 0)
    da = `${anno}-${String(mese + 1).padStart(2, '0')}-01`
    a = mese === 11 ? `${anno + 1}-01-01` : `${anno}-${String(mese + 2).padStart(2, '0')}-01`
    quando = `a ${MESI[mese]}`
  } else if (/\bmese\b/.test(t)) [a, quando] = [piu(oggi, 30), 'nei prossimi 30 giorni']

  if (sappiamoOspiti) {
    const scelta = /\b(?:adesso|ora|in casa|oggi)\b/.test(t)
      ? pren.find((p) => p.inizio <= oggi && p.fine > oggi)
      : /\bdomani\b/.test(t)
        ? pren.find((p) => p.inizio === piu(oggi, 1))
        : pren.find((p) => p.inizio > oggi)
    const a = scelta?.codice ? archivio(scelta.codice) : undefined
    const ospiti = a ? quantiOspiti(a) : null
    if (!scelta || !a || (!ospiti && !a.ospite)) return null
    return `${scelta.inizio <= oggi ? `Ora a ${casa.nome} c'è` : `A ${casa.nome} arriva ${detto(scelta.inizio)}`} ${a.ospite ?? 'un ospite'}${ospiti ? `, ${ospiti}` : ''}, per ${notti(scelta.notti)}.`
  }

  // si risponde solo a quello che è chiesto: «la prossima prenotazione» è una sola
  if (/\bprossim[oa]\s+(?:prenotazion\w*|arriv\w*|ospit\w*|check.?in)/.test(t)) {
    const prossima = pren.find((p) => p.inizio > oggi)
    return prossima
      ? `La prossima prenotazione a ${casa.nome} arriva ${detto(prossima.inizio)}, per ${notti(prossima.notti)}.`
      : `A ${casa.nome} per ora non ci sono altre prenotazioni in arrivo.`
  }

  const frasi: string[] = []
  const inCasa = pren.find((p) => p.inizio <= oggi && p.fine > oggi)
  // chi c'è adesso: solo se lo chiede
  if (/\b(?:adesso|ora|in casa|c'è qualcuno|c è qualcuno|occupat[ao] oggi)\b/.test(t) || /\boggi\b/.test(t))
    frasi.push(inCasa ? `In questo momento a ${casa.nome} c'è un ospite, che parte ${detto(inCasa.fine)}.` : `In questo momento a ${casa.nome} non c'è nessuno.`)

  const chiedePartenze = /parte|parten|check.?out/.test(t)
  if (chiedePartenze) {
    const partenze = pren.filter((p) => p.fine >= da && p.fine < a)
    frasi.push(
      partenze.length
        ? `Partenze ${quando}: ${partenze.map((p) => detto(p.fine)).join(', ')}.`
        : `${quando[0].toUpperCase()}${quando.slice(1)} non parte nessuno.`,
    )
  } else {
    const arrivi = pren.filter((p) => p.inizio >= da && p.inizio < a)
    frasi.push(
      arrivi.length
        ? `${arrivi.length === 1 ? 'Arriva un ospite' : `Arrivano ${arrivi.length} prenotazioni`} ${quando}: ${arrivi.map((p) => `${detto(p.inizio)} per ${notti(p.notti)}`).join('; ')}.`
        : `${quando[0].toUpperCase()}${quando.slice(1)} non arriva nessuno a ${casa.nome}.`,
    )
  }
  // occupazione della finestra
  const giorniFinestra = Math.max(1, differenzaGiorni(da, a))
  let occupate = 0
  for (const p of periodi) {
    const x = p.inizio > da ? p.inizio : da
    const y = p.fine < a ? p.fine : a
    occupate += Math.max(0, differenzaGiorni(x, y))
  }
  if (/occupa|liber|disponibilit/.test(t))
    frasi.push(`Occupazione ${Math.round((occupate / giorniFinestra) * 100)} per cento: ${notti(occupate)} su ${giorniFinestra}.`)
  return frasi.join(' ')
}
