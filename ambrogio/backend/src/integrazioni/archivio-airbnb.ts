import type { Database, PrenotazioneArchiviata } from '../database/db.ts'
import type { Gmail } from './gmail.ts'
import type { Airbnb, Periodo } from './airbnb.ts'

// Ambrogio si tiene aggiornato DA SOLO sulle case Airbnb, senza che Pietro debba fare niente:
//  - ogni minuto guarda se in Gmail sono arrivate email nuove di Airbnb (prenotazioni, modifiche,
//    cancellazioni, richieste, messaggi degli ospiti, recensioni, pagamenti);
//  - le fa leggere a Gemini, che ne tira fuori i dati (ospiti, date, guadagno…) e una frase di riassunto;
//  - salva le prenotazioni nella memoria e prepara gli AVVISI per Pietro (è Ambrogio che aggiorna lui);
//  - la mattina e la sera prima ricorda arrivi e partenze.
// Solo lettura: non risponde, non modifica e non cancella nulla su Airbnb o in Gmail.

export type TipoEmailAirbnb = 'conferma' | 'modifica' | 'cancellazione' | 'richiesta' | 'messaggio' | 'recensione' | 'pagamento' | 'altro'

/** dall'oggetto dell'email si capisce già di che cosa si tratta (così Gemini si usa solo quando serve) */
export function tipoDaOggetto(oggetto: string): TipoEmailAirbnb {
  const o = oggetto.toLowerCase()
  if (/cancellat|annullat|cancel/.test(o)) return 'cancellazione'
  if (/modific|alter|change/.test(o)) return 'modifica'
  if (/prenotazione confermata|reservation confirmed|booking confirmed|nuova prenotazione|new booking|confermata/.test(o)) return 'conferma'
  if (/richiesta di prenotazione|booking request|reservation request|richiesta|inquiry|pre-?approv/.test(o)) return 'richiesta'
  if (/recension|review|valutazion/.test(o)) return 'recensione'
  if (/pagamento|payout|ti abbiamo inviato|we sent|bonifico|guadagn/.test(o)) return 'pagamento'
  if (/messaggio|message|^re:|ha scritto|ti ha inviato|sent you/.test(o)) return 'messaggio'
  return 'altro'
}

export type DatiEmail = {
  codice?: string | null
  annuncio?: string | null
  ospite?: string | null
  adulti?: number | null
  bambini?: number | null
  neonati?: number | null
  animali?: number | null
  checkin?: string | null
  checkout?: string | null
  totale?: number | null
  guadagno?: number | null
  valuta?: string | null
  riassunto?: string | null
}

export const istruzioniEstrazione = (oggi: string) => `Sei l'assistente di un host Airbnb. Leggi questa email di Airbnb e rispondi SOLO con un oggetto JSON con queste chiavi
(metti null quando un dato non c'è; non inventare nulla):
{"codice": codice della prenotazione (es. "HMABC12345"),
 "annuncio": nome dell'annuncio/casa,
 "ospite": nome dell'ospite,
 "adulti": numero, "bambini": numero, "neonati": numero, "animali": numero,
 "checkin": "AAAA-MM-GG", "checkout": "AAAA-MM-GG",
 "totale": quanto paga l'ospite in tutto (numero),
 "guadagno": quanto guadagna l'host (numero, dopo la commissione di Airbnb),
 "valuta": "EUR" o altra,
 "riassunto": UNA frase in italiano per l'host (massimo 30 parole) con la cosa importante: per un messaggio cosa chiede l'ospite, per una recensione voto e commento, per un pagamento quanto e quando}
Oggi è ${oggi}: se l'anno delle date non è scritto, è quello più vicino nel futuro. Non riportare mai codici di porte, cassette o allarmi.`

const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && !Number.isNaN(Number(v.replace(',', '.'))) ? Number(v.replace(',', '.')) : null)
const data = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
const testo = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 300) : null)

/** ripulisce quello che risponde Gemini (numeri come numeri, date solo se valide) */
export function pulisciDati(grezzo: unknown): DatiEmail {
  const g = (grezzo && typeof grezzo === 'object' ? grezzo : {}) as Record<string, unknown>
  const codice = testo(g.codice)?.toUpperCase().replace(/[^A-Z0-9]/g, '') || null
  return {
    codice: codice && codice.length >= 6 ? codice : null,
    annuncio: testo(g.annuncio),
    ospite: testo(g.ospite),
    adulti: numero(g.adulti),
    bambini: numero(g.bambini),
    neonati: numero(g.neonati),
    animali: numero(g.animali),
    checkin: data(g.checkin),
    checkout: data(g.checkout),
    totale: numero(g.totale),
    guadagno: numero(g.guadagno),
    valuta: testo(g.valuta),
    riassunto: testo(g.riassunto),
  }
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
export const giornoDetto = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return `${GIORNI[d.getUTCDay()]} ${d.getUTCDate()} ${MESI[d.getUTCMonth()]}`
}
const euro = (n: number, valuta?: string | null) => `${Math.round(n)} ${!valuta || /eur|€/i.test(valuta) ? 'euro' : valuta}`

/** «3 ospiti (2 adulti, 1 bambino)» */
export function quantiOspiti(p: Pick<PrenotazioneArchiviata, 'adulti' | 'bambini' | 'neonati' | 'animali'>) {
  const parti: string[] = []
  if (p.adulti) parti.push(p.adulti === 1 ? '1 adulto' : `${p.adulti} adulti`)
  if (p.bambini) parti.push(p.bambini === 1 ? '1 bambino' : `${p.bambini} bambini`)
  if (p.neonati) parti.push(p.neonati === 1 ? '1 neonato' : `${p.neonati} neonati`)
  const totale = (p.adulti ?? 0) + (p.bambini ?? 0)
  if (!totale) return null
  const animali = p.animali ? `, ${p.animali === 1 ? 'con un animale' : `con ${p.animali} animali`}` : ''
  return `${totale === 1 ? '1 ospite' : `${totale} ospiti`}${parti.length > 1 || p.neonati ? ` (${parti.join(', ')})` : ''}${animali}`
}

/** la frase di avviso per Pietro */
export function testoAvviso(tipo: TipoEmailAirbnb, d: DatiEmail, oggetto: string) {
  const chi = d.ospite ?? 'un ospite'
  const quando = d.checkin ? ` dal ${giornoDetto(d.checkin)}${d.checkout ? ` al ${giornoDetto(d.checkout)}` : ''}` : ''
  const dove = d.annuncio ? ` a ${d.annuncio}` : ''
  const ospiti = quantiOspiti({ adulti: d.adulti ?? null, bambini: d.bambini ?? null, neonati: d.neonati ?? null, animali: d.animali ?? null })
  switch (tipo) {
    case 'conferma':
      return `Nuova prenotazione${dove}: ${chi}${ospiti ? `, ${ospiti}` : ''}${quando}.${d.guadagno ? ` Guadagno ${euro(d.guadagno, d.valuta)}.` : ''}`
    case 'modifica':
      return `Prenotazione modificata${dove}: ${chi}${quando}.${d.riassunto ? ` ${d.riassunto}` : ''}`
    case 'cancellazione':
      return `Cancellata la prenotazione di ${chi}${dove}${quando}.`
    case 'richiesta':
      return `Richiesta di prenotazione da ${chi}${quando}${ospiti ? `, ${ospiti}` : ''}: va accettata o rifiutata entro 24 ore.`
    case 'messaggio':
      return `Messaggio da ${chi}: ${d.riassunto ?? oggetto}`
    case 'recensione':
      return `Nuova recensione${d.ospite ? ` di ${d.ospite}` : ''}: ${d.riassunto ?? oggetto}`
    case 'pagamento':
      return d.riassunto ?? `Airbnb: ${oggetto}`
    default:
      return d.riassunto ?? oggetto
  }
}

type Leggi = (istruzioni: string, testo: string) => Promise<unknown>

export type StatoArchivio = { attivo: boolean; ultimoControllo: string | null; prenotazioni: number; email: number; errore: string | null }

const CODICE = /\b(HM[A-Z0-9]{8})\b/

export class ArchivioAirbnb {
  private db: Database
  private gmail: Gmail
  private airbnb?: Airbnb
  private leggi?: Leggi
  private oggi: () => string
  private ora: () => number
  private timer?: ReturnType<typeof setInterval>
  private inCorso = false
  // il recupero dell'ultimo anno dura qualche giro (30 email per volta): finché non è finito si continua
  private recupero: boolean | null = null
  stato: StatoArchivio = { attivo: false, ultimoControllo: null, prenotazioni: 0, email: 0, errore: null }

  constructor(o: { db: Database; gmail: Gmail; airbnb?: Airbnb; leggi?: Leggi; oggi: () => string; ora?: () => number }) {
    this.db = o.db
    this.gmail = o.gmail
    this.airbnb = o.airbnb
    this.leggi = o.leggi
    this.oggi = o.oggi
    this.ora = o.ora ?? (() => new Date().getHours())
  }

  /** controlla subito e poi ogni minuto */
  avvia(ogniMs = 60_000) {
    this.stato.attivo = true
    setTimeout(() => this.controlla(), 5_000).unref?.()
    this.timer = setInterval(() => this.controlla(), ogniMs)
    this.timer.unref?.()
  }

  ferma() {
    clearInterval(this.timer)
    this.stato.attivo = false
  }

  /** un giro: email nuove di Airbnb + promemoria di arrivi e partenze */
  async controlla() {
    if (this.inCorso) return
    this.inCorso = true
    try {
      if (this.gmail.collegato) await this.leggiEmail()
      await this.promemoria()
      this.stato.errore = null
    } catch (err) {
      const msg = (err as Error).message
      if (this.stato.errore !== msg) this.db.registra('errore', `Airbnb (email): ${msg}`)
      this.stato.errore = msg
    } finally {
      this.stato.ultimoControllo = new Date().toISOString()
      this.stato.prenotazioni = this.db.prenotazioniArchiviate().length
      this.stato.email = this.db.contaEmailAirbnb()
      this.inCorso = false
    }
  }

  private async leggiEmail() {
    // la prima volta si recupera l'ultimo anno (solo prenotazioni), poi bastano gli ultimi giorni
    this.recupero ??= this.db.contaEmailAirbnb() === 0
    const recupero = this.recupero
    const elenco = await this.gmail.elencoCompleto(`from:airbnb.com ${recupero ? 'newer_than:400d' : 'newer_than:3d'}`, recupero ? 500 : 50, (id) => this.db.emailLetta(id))
    const nuove = elenco.reverse() // dalla più vecchia
    const limiteRecenti = Date.now() - 2 * 86_400_000
    let lette = 0
    let finito = true
    for (const e of nuove) {
      const tipo = tipoDaOggetto(e.oggetto)
      const recente = Date.parse(e.data) >= limiteRecenti
      // le email vecchie servono solo per l'archivio delle prenotazioni; le altre non si leggono neanche
      if (tipo === 'altro' || (!recente && !['conferma', 'modifica', 'cancellazione'].includes(tipo))) {
        this.db.segnaEmail(e.id, `${tipo} (saltata)`)
        continue
      }
      // per non esaurire i limiti gratuiti di Gemini: al massimo 30 email per giro (il resto al giro dopo)
      if (++lette > 30) {
        finito = false
        break
      }
      const completa = await this.gmail.apri(e.id)
      let dati: DatiEmail = { codice: (completa.oggetto + completa.testo).match(CODICE)?.[1] ?? null }
      if (this.leggi) {
        try {
          dati = { ...pulisciDati(await this.leggi(istruzioniEstrazione(this.oggi()), `Oggetto: ${completa.oggetto}\n\n${completa.testo.slice(0, 8000)}`)), ...(dati.codice ? { codice: dati.codice } : {}) }
        } catch (err) {
          // Gemini al limite: si riprova al giro dopo (l'email resta da leggere)
          if (/limite|occupato|429/i.test((err as Error).message)) {
            finito = false
            break
          }
          throw err
        }
      }
      if (dati.codice && ['conferma', 'modifica', 'cancellazione', 'richiesta'].includes(tipo)) {
        const vecchia = this.db.prenotazione(dati.codice)
        this.db.salvaPrenotazione({
          codice: dati.codice,
          annuncio: dati.annuncio,
          ospite: dati.ospite,
          adulti: dati.adulti,
          bambini: dati.bambini,
          neonati: dati.neonati,
          animali: dati.animali,
          checkin: dati.checkin,
          checkout: dati.checkout,
          totale: dati.totale,
          guadagno: dati.guadagno,
          valuta: dati.valuta,
          stato: tipo === 'cancellazione' ? 'cancellata' : tipo === 'richiesta' ? (vecchia?.stato ?? 'richiesta') : 'confermata',
        })
      }
      this.db.segnaEmail(e.id, tipo)
      if (recente) this.db.avvisa(testoAvviso(tipo, dati, completa.oggetto), `email-${e.id}`)
    }
    if (finito) this.recupero = false
  }

  /** la mattina: chi arriva e chi parte oggi; la sera: chi arriva domani (una volta sola al giorno) */
  private async promemoria() {
    if (!this.airbnb?.case.length) return
    const ora = this.ora()
    if (ora < 8) return
    const oggi = this.oggi()
    const domani = new Date(Date.parse(oggi) + 86_400_000).toISOString().slice(0, 10)
    const giorno = ora >= 18 ? domani : oggi
    const chiave = `${ora >= 18 ? 'sera' : 'mattina'}-${oggi}`
    const frasi: string[] = []
    for (const casa of this.airbnb.case) {
      let periodi: Periodo[]
      try {
        periodi = (await this.airbnb.calendario(casa.numero)).periodi
      } catch {
        continue
      }
      const pren = periodi.filter((p) => p.tipo === 'prenotazione')
      for (const p of pren.filter((p) => p.inizio === giorno)) {
        const a = p.codice ? this.db.prenotazione(p.codice) : undefined
        const ospiti = a ? quantiOspiti(a) : null
        frasi.push(`arriva ${a?.ospite ?? 'un ospite'}${ospiti ? `, ${ospiti}` : ''} a ${casa.nome} per ${p.notti === 1 ? 'una notte' : `${p.notti} notti`}`)
      }
      for (const p of pren.filter((p) => p.fine === giorno)) {
        const a = p.codice ? this.db.prenotazione(p.codice) : undefined
        frasi.push(`parte ${a?.ospite ?? 'l’ospite'} da ${casa.nome}`)
      }
    }
    if (!frasi.length) return
    this.db.avvisa(`${ora >= 18 ? 'Domani' : 'Oggi'} ${frasi.join('; ')}.`, chiave)
  }
}

/** incassi e notti per mese (dalle prenotazioni confermate, mese del check-in) */
export function incassiPerMese(prenotazioni: PrenotazioneArchiviata[]) {
  const mesi = new Map<string, { guadagno: number; notti: number; prenotazioni: number; ospiti: number }>()
  for (const p of prenotazioni) {
    if (p.stato !== 'confermata' || !p.checkin) continue
    const m = p.checkin.slice(0, 7)
    const v = mesi.get(m) ?? { guadagno: 0, notti: 0, prenotazioni: 0, ospiti: 0 }
    v.guadagno += p.guadagno ?? 0
    v.notti += p.checkout ? Math.max(0, Math.round((Date.parse(p.checkout) - Date.parse(p.checkin)) / 86_400_000)) : 0
    v.prenotazioni++
    v.ospiti += (p.adulti ?? 0) + (p.bambini ?? 0)
    mesi.set(m, v)
  }
  return [...mesi.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mese, v]) => ({ mese, ...v, prezzoMedio: v.notti ? Math.round(v.guadagno / v.notti) : 0 }))
}
