import fs from 'node:fs'
import path from 'node:path'
import type { AccessoGoogle } from './google.ts'

// Le spese delle case in un foglio Google CREATO DA AMBROGIO («Ambrogio – Spese case»).
// Il permesso chiesto a Google (drive.file) vale SOLO per i file creati da Ambrogio: il resto del Drive non lo vede.
// Due schede: «Spese» (bollette, pulizie, riparazioni… una riga per spesa) e «Spese fisse» (affitto, condominio…
// ogni mese). Pietro può scriverci direttamente o dirle a voce ad Ambrogio.

export type Spesa = { data: string; descrizione: string; categoria: string; importo: number; casa: string }
export type SpesaFissa = { voce: string; importo: number; dal: string | null; al: string | null }

const API = 'https://sheets.googleapis.com/v4/spreadsheets'
export const SPESE_FISSE_INIZIALI: SpesaFissa[] = [
  { voce: 'Affitto', importo: 1400, dal: null, al: null },
  { voce: 'Spese condominiali', importo: 75, dal: null, al: null },
  { voce: 'TARI', importo: 12.5, dal: null, al: null },
  { voce: 'Wi-Fi Fastweb', importo: 11.95, dal: null, al: null },
  { voce: 'Polizza Unipolsai', importo: 14.58, dal: null, al: null },
  // stime finché non si segnano le bollette vere (poi si toglie la riga o si mette «Al»)
  { voce: 'Luce (stima)', importo: 50, dal: null, al: null },
  { voce: 'Gas (stima)', importo: 25, dal: null, al: null },
]

/** «12/10/2026», «2026-10-12», un numero di Fogli (giorni dal 30/12/1899) → AAAA-MM-GG */
export function dataSpesa(v: unknown): string | null {
  if (typeof v === 'number' && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86_400_000).toISOString().slice(0, 10)
  const t = String(v ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!m) return null
  const anno = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3])
  return `${anno}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

/** «2026-10», «10/2026», «ottobre 2026», una data → AAAA-MM (vuoto = sempre) */
export function meseSpesa(v: unknown): string | null {
  const t = String(v ?? '').trim().toLowerCase()
  if (!t) return null
  const d = dataSpesa(v)
  if (d) return d.slice(0, 7)
  let m = t.match(/^(\d{4})-(\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`
  m = t.match(/^(\d{1,2})[/.-](\d{4})$/)
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`
  const mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
  const i = mesi.findIndex((x) => t.startsWith(x))
  const anno = t.match(/\d{4}/)?.[0]
  return i >= 0 && anno ? `${anno}-${String(i + 1).padStart(2, '0')}` : null
}

const numero = (v: unknown) => {
  if (typeof v === 'number') return v
  const t = String(v ?? '').replace(/[^\d,.-]/g, '')
  if (!t) return null
  const n = Number(t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function leggiRigheSpese(righe: unknown[][]): Spesa[] {
  const spese: Spesa[] = []
  for (const r of righe) {
    const data = dataSpesa(r[0])
    const importo = numero(r[3])
    if (!data || importo == null) continue
    spese.push({ data, descrizione: String(r[1] ?? '').trim(), categoria: String(r[2] ?? '').trim() || 'Altro', importo, casa: String(r[4] ?? '').trim() })
  }
  return spese
}

export function leggiRigheFisse(righe: unknown[][]): SpesaFissa[] {
  const fisse: SpesaFissa[] = []
  for (const r of righe) {
    const voce = String(r[0] ?? '').trim()
    const importo = numero(r[1])
    if (!voce || importo == null) continue
    fisse.push({ voce, importo, dal: meseSpesa(r[2]), al: meseSpesa(r[3]) })
  }
  return fisse
}

/** spese fisse valide in un mese (AAAA-MM) */
export const fisseDelMese = (fisse: SpesaFissa[], mese: string) => fisse.filter((f) => (!f.dal || f.dal <= mese) && (!f.al || f.al >= mese))

export class FoglioSpese {
  private google: AccessoGoogle
  private file: string
  private cache: { quando: number; spese: Spesa[]; fisse: SpesaFissa[] } | null = null

  constructor(google: AccessoGoogle, cartellaDati: string) {
    this.google = google
    this.file = path.join(cartellaDati, 'foglio-spese.json')
  }

  /** il permesso di Google comprende i file creati da Ambrogio? (si dà ricollegando Google) */
  get disponibile() {
    return this.google.collegato && this.google.ha('drive.file')
  }

  private get id(): string | null {
    try {
      return (JSON.parse(fs.readFileSync(this.file, 'utf8')) as { id?: string }).id ?? null
    } catch {
      return null
    }
  }

  get link() {
    return this.id ? `https://docs.google.com/spreadsheets/d/${this.id}` : null
  }

  private serve() {
    if (!this.google.collegato) throw new Error('Google non è collegato: Pietro può collegarlo dal menu Email di Ambrogio.')
    if (!this.google.ha('drive.file'))
      throw new Error('Manca il permesso per il foglio delle spese: Pietro deve attivare «Google Sheets API» su Google Cloud e poi scollegare e ricollegare Google dal menu Email di Ambrogio.')
  }

  /** il foglio c'è? Se no, lo crea (con le spese fisse già scritte) */
  async prepara(): Promise<string> {
    this.serve()
    const esistente = this.id
    if (esistente) return esistente
    const creato = (await this.google.chiama(API, {
      method: 'POST',
      body: JSON.stringify({
        properties: { title: 'Ambrogio – Spese case', locale: 'it_IT', timeZone: 'Europe/Rome' },
        sheets: [
          {
            properties: { title: 'Spese', gridProperties: { frozenRowCount: 1 } },
            data: [{ rowData: [riga(['Data', 'Descrizione', 'Categoria', 'Importo €', 'Casa'])] }],
          },
          {
            properties: { title: 'Spese fisse', gridProperties: { frozenRowCount: 1 } },
            data: [
              {
                rowData: [
                  riga(['Voce', 'Importo al mese €', 'Dal (mese, vuoto = sempre)', 'Al (mese, vuoto = ancora oggi)']),
                  ...SPESE_FISSE_INIZIALI.map((f) => riga([f.voce, f.importo, '', ''])),
                ],
              },
            ],
          },
        ],
      }),
    })) as { spreadsheetId: string }
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    fs.writeFileSync(this.file, JSON.stringify({ id: creato.spreadsheetId }, null, 2))
    return creato.spreadsheetId
  }

  /** tutte le spese (si rileggono al massimo ogni minuto: Pietro può averle cambiate nel foglio) */
  async leggi(): Promise<{ spese: Spesa[]; fisse: SpesaFissa[] }> {
    if (this.cache && Date.now() - this.cache.quando < 60_000) return this.cache
    const id = await this.prepara()
    const p = new URLSearchParams({ valueRenderOption: 'UNFORMATTED_VALUE', dateTimeRenderOption: 'SERIAL_NUMBER' })
    p.append('ranges', 'Spese!A2:E')
    p.append('ranges', 'Spese fisse!A2:D')
    const dati = (await this.google.chiama(`${API}/${id}/values:batchGet?${p}`)) as { valueRanges?: { values?: unknown[][] }[] }
    const [spese, fisse] = dati.valueRanges ?? []
    this.cache = { quando: Date.now(), spese: leggiRigheSpese(spese?.values ?? []), fisse: leggiRigheFisse(fisse?.values ?? []) }
    return this.cache
  }

  /** aggiunge molte spese insieme (per esempio quelle degli anni passati, da un CSV) */
  async aggiungiMolte(spese: Spesa[]) {
    if (!spese.length) return
    const id = await this.prepara()
    const valori = spese.map((s) => {
      const [a, m, g] = s.data.split('-')
      return [`${g}/${m}/${a}`, s.descrizione, s.categoria, s.importo, s.casa]
    })
    await this.google.chiama(`${API}/${id}/values/${encodeURIComponent('Spese!A:E')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ values: valori }),
    })
    this.cache = null
  }

  /** le spese fisse che mancano nel foglio (per nome) si aggiungono; quelle già scritte non si toccano */
  async completaFisse(fisse = SPESE_FISSE_INIZIALI) {
    const { fisse: presenti } = await this.leggi()
    const nomi = new Set(presenti.map((f) => f.voce.toLowerCase()))
    const mancanti = fisse.filter((f) => !nomi.has(f.voce.toLowerCase()))
    if (!mancanti.length) return 0
    await this.google.chiama(`${API}/${await this.prepara()}/values/${encodeURIComponent('Spese fisse!A:D')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ values: mancanti.map((f) => [f.voce, f.importo, f.dal ?? '', f.al ?? '']) }),
    })
    this.cache = null
    return mancanti.length
  }

  /** aggiunge una spesa in fondo alla scheda «Spese» */
  async aggiungi(s: Spesa) {
    const id = await this.prepara()
    const [a, m, g] = s.data.split('-')
    await this.google.chiama(`${API}/${id}/values/${encodeURIComponent('Spese!A:E')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      body: JSON.stringify({ values: [[`${g}/${m}/${a}`, s.descrizione, s.categoria, s.importo, s.casa]] }),
    })
    this.cache = null
  }
}

const riga = (valori: (string | number)[]) => ({
  values: valori.map((v) => (typeof v === 'number' ? { userEnteredValue: { numberValue: v } } : { userEnteredValue: { stringValue: v } })),
})

const giorniDelMese = (mese: string) => new Date(Date.UTC(Number(mese.slice(0, 4)), Number(mese.slice(5, 7)), 0)).getUTCDate()

export type RendimentoMese = {
  mese: string
  /** da dove arrivano gli incassi: report ufficiale di Airbnb o somma delle prenotazioni */
  fonte: 'report' | 'prenotazioni'
  incassi: number
  notti: number
  prenotazioni: number
  occupazione: number // percentuale
  prezzoMedio: number // guadagno medio a notte (ADR)
  revpar: number // guadagno per notte disponibile
  speseFisse: number
  speseVariabili: number
  utile: number
  margine: number // percentuale dell'utile sugli incassi
}

/** il rendimento vero, mese per mese: incassi di Airbnb meno spese fisse e spese registrate nel foglio */
export function rendimentoPerMese(
  incassi: { mese: string; guadagno: number; notti: number; prenotazioni: number }[],
  spese: Spesa[] = [],
  fisse: SpesaFissa[] = [],
  numeroCase = 1,
  report: { mese: string; netto: number }[] = [],
): RendimentoMese[] {
  const mesi = new Set([...incassi.map((i) => i.mese), ...spese.map((s) => s.data.slice(0, 7)), ...report.map((r) => r.mese)])
  return [...mesi].sort().map((mese) => {
    const dallePrenotazioni = incassi.find((x) => x.mese === mese) ?? { guadagno: 0, notti: 0, prenotazioni: 0 }
    // il report ufficiale dei guadagni di Airbnb, quando c'è, vale più della somma delle prenotazioni
    const ufficiale = report.find((r) => r.mese === mese)
    const i = ufficiale ? { ...dallePrenotazioni, guadagno: ufficiale.netto } : dallePrenotazioni
    const disponibili = giorniDelMese(mese) * Math.max(1, numeroCase)
    const speseFisse = fisseDelMese(fisse, mese).reduce((a, f) => a + f.importo, 0)
    const speseVariabili = spese.filter((s) => s.data.startsWith(mese)).reduce((a, s) => a + s.importo, 0)
    const utile = i.guadagno - speseFisse - speseVariabili
    return {
      mese,
      fonte: ufficiale ? 'report' : 'prenotazioni',
      incassi: Math.round(i.guadagno),
      notti: i.notti,
      prenotazioni: i.prenotazioni,
      occupazione: Math.round((Math.min(i.notti, disponibili) / disponibili) * 100),
      prezzoMedio: i.notti ? Math.round(i.guadagno / i.notti) : 0,
      revpar: Math.round(i.guadagno / disponibili),
      speseFisse: Math.round(speseFisse),
      speseVariabili: Math.round(speseVariabili),
      utile: Math.round(utile),
      margine: i.guadagno ? Math.round((utile / i.guadagno) * 100) : 0,
    }
  })
}

const NOMI_MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const euro = (n: number) => `${Math.round(n).toLocaleString('it-IT')} €`

/**
 * Statistiche e previsione dell'anno in corso dai guadagni mese per mese (report di Airbnb).
 * La previsione: quello che manca all'anno si stima dagli stessi mesi degli anni passati,
 * così com'erano e corretti con l'andamento di quest'anno (crescita da gennaio al mese scorso).
 */
export function statisticheEPrevisione(report: { mese: string; netto: number }[], meseAdesso: string, costoMensile: number | null) {
  const per = new Map(report.map((r) => [r.mese, r.netto]))
  const anni = [...new Set(report.map((r) => r.mese.slice(0, 4)))].sort()
  const righe: string[] = []
  // anno per anno (con il confronto sullo stesso periodo dell'anno prima)
  const annoAdesso = meseAdesso.slice(0, 4)
  const meseNum = Number(meseAdesso.slice(5, 7))
  const somma = (anno: string, da: number, a: number) => {
    let t = 0
    let tutti = true
    for (let m = da; m <= a; m++) {
      const v = per.get(`${anno}-${String(m).padStart(2, '0')}`)
      if (v == null) tutti = false
      else t += v
    }
    return { t, tutti }
  }
  for (const a of anni) {
    const mesi = report.filter((r) => r.mese.startsWith(a))
    const tot = mesi.reduce((x, r) => x + r.netto, 0)
    const utile = costoMensile ? ` · utile con ${euro(costoMensile)} al mese di costi: ${euro(tot - costoMensile * mesi.length)}` : ''
    righe.push(`${a}: ${euro(tot)} netti in ${mesi.length} mesi (media ${euro(tot / Math.max(1, mesi.length))} al mese)${utile}`)
  }
  // i mesi migliori e peggiori, e la stagionalità (media di ogni mese negli anni)
  const ordinati = [...report].filter((r) => r.netto > 0 && r.mese < meseAdesso).sort((a, b) => b.netto - a.netto)
  if (ordinati.length >= 3) {
    righe.push(`Mesi migliori: ${ordinati.slice(0, 3).map((r) => `${r.mese} ${euro(r.netto)}`).join(', ')}`)
    righe.push(`Mesi peggiori: ${ordinati.slice(-3).reverse().map((r) => `${r.mese} ${euro(r.netto)}`).join(', ')}`)
    const stagioni = NOMI_MESI.map((nome, i) => {
      const v = report.filter((r) => Number(r.mese.slice(5, 7)) === i + 1 && r.netto > 0 && r.mese < meseAdesso).map((r) => r.netto)
      return { nome, media: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }
    }).filter((s) => s.media)
    righe.push(`Stagionalità (media per mese): ${stagioni.map((s) => `${s.nome} ${euro(s.media)}`).join(', ')}`)
  }
  // previsione dell'anno in corso
  const finora = somma(annoAdesso, 1, meseNum - 1)
  const parziale = per.get(meseAdesso)
  const stime: number[] = []
  const confronti: string[] = []
  for (const a of anni.filter((x) => x < annoAdesso)) {
    const prima = somma(a, 1, meseNum - 1)
    const dopo = somma(a, meseNum, 12)
    if (!prima.tutti || !dopo.tutti || !prima.t) continue
    const crescita = finora.t / prima.t
    stime.push(dopo.t, dopo.t * crescita)
    confronti.push(`rispetto al ${a} ${crescita >= 1 ? '+' : ''}${Math.round((crescita - 1) * 100)}% (stesso periodo)`)
  }
  if (meseNum > 1 && finora.tutti && stime.length) {
    const basso = Math.min(...stime)
    const alto = Math.max(...stime)
    const medio = stime.reduce((a, b) => a + b, 0) / stime.length
    const nomeDa = NOMI_MESI[meseNum - 1]
    righe.push(
      `Previsione ${annoAdesso}: finora (gennaio–${NOMI_MESI[meseNum - 2]}) ${euro(finora.t)}, ${confronti.join(', ')}.` +
        `${parziale != null ? ` ${nomeDa[0].toUpperCase()}${nomeDa.slice(1)} è a ${euro(parziale)} (mese in corso).` : ''}` +
        ` Da ${nomeDa} a dicembre stima tra ${euro(basso)} e ${euro(alto)} (media ${euro(medio)}): anno tra ${euro(finora.t + basso)} e ${euro(finora.t + alto)}, più probabile ${euro(finora.t + medio)}.` +
        (costoMensile ? ` Utile previsto con ${euro(costoMensile)} al mese di costi (${euro(costoMensile * 12)} l'anno): circa ${euro(finora.t + medio - costoMensile * 12)} (tra ${euro(finora.t + basso - costoMensile * 12)} e ${euro(finora.t + alto - costoMensile * 12)}).` : ''),
    )
  }
  return righe
}
