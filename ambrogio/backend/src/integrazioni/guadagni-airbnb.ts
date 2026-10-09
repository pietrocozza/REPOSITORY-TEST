// Il file dei guadagni che Airbnb fa scaricare (Guadagni → Cronologia transazioni → Esporta CSV).
// È la fonte ufficiale dei soldi: per ogni prenotazione date, notti, ospite, annuncio e quanto incassa l'host.
// Le intestazioni cambiano con la lingua dell'account (italiano o inglese): si riconoscono dalle parole.

export type RigaGuadagni = {
  codice: string
  ospite: string | null
  annuncio: string | null
  checkin: string
  checkout: string | null
  notti: number | null
  guadagno: number
  lordo: number | null
  pulizie: number | null
  commissione: number | null
  valuta: string | null
  futura: boolean
}

/** divide il CSV in righe e colonne (virgolette, a capo dentro le virgolette, separatore , o ;) */
export function leggiCsv(testo: string): string[][] {
  const pulito = testo.replace(/^﻿/, '')
  const primaRiga = pulito.split(/\r?\n/, 1)[0] ?? ''
  const sep = (primaRiga.match(/;/g)?.length ?? 0) > (primaRiga.match(/,/g)?.length ?? 0) ? ';' : ','
  const righe: string[][] = []
  let riga: string[] = []
  let campo = ''
  let virgolette = false
  for (let i = 0; i < pulito.length; i++) {
    const c = pulito[i]
    if (virgolette) {
      if (c === '"' && pulito[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') virgolette = false
      else campo += c
    } else if (c === '"') virgolette = true
    else if (c === sep) {
      riga.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && pulito[i + 1] === '\n') i++
      riga.push(campo)
      if (riga.some((x) => x.trim())) righe.push(riga)
      riga = []
      campo = ''
    } else campo += c
  }
  riga.push(campo)
  if (riga.some((x) => x.trim())) righe.push(riga)
  return righe
}

/** «1.234,56» «1,234.56» «-12.5» «€ 80» → numero */
export function importo(v: string | undefined): number | null {
  if (!v) return null
  let t = v.replace(/[^\d,.-]/g, '')
  if (!/\d/.test(t)) return null
  const virgola = t.lastIndexOf(',')
  const punto = t.lastIndexOf('.')
  if (virgola > punto) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(/,/g, '')
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

// le colonne che servono, in italiano e in inglese
const COLONNE: Record<string, RegExp> = {
  tipo: /^(type|tipo)$/i,
  codice: /confirmation code|codice di conferma|codice prenotazione/i,
  inizio: /^(start date|data di inizio|data inizio|check-?in)$/i,
  fine: /^(end date|data di fine|data fine|check-?out)$/i,
  notti: /^(nights|notti)$/i,
  ospite: /^(guest|ospite)$/i,
  annuncio: /^(listing|annuncio|alloggio)$/i,
  valuta: /^(currency|valuta)$/i,
  importo: /^(amount|importo)$/i,
  lordo: /gross earnings|guadagni lordi|guadagno lordo/i,
  pulizie: /cleaning fee|pulizi/i,
  commissione: /^(service fee|costo del servizio|commissione del servizio|tariffa del servizio)$/i,
}

/** gg/mm/aaaa o mm/gg/aaaa? Si sceglie l'ordine che fa tornare le notti (o dove i numeri sopra 12 non lasciano dubbi) */
function ordineDate(campioni: [string, string, number | null][], italiano: boolean): 'gm' | 'mg' {
  let gm = 0
  let mg = 0
  const parti = (s: string) => s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  const iso = (a: number, m: number, g: number) => Date.UTC(a < 100 ? 2000 + a : a, m - 1, g)
  for (const [i, f, n] of campioni) {
    const a = parti(i)
    const b = parti(f)
    if (!a) continue
    if (Number(a[1]) > 12) gm += 10
    if (Number(a[2]) > 12) mg += 10
    if (b && n != null) {
      if (Math.round((iso(+b[3], +b[2], +b[1]) - iso(+a[3], +a[2], +a[1])) / 86_400_000) === n) gm++
      if (Math.round((iso(+b[3], +b[1], +b[2]) - iso(+a[3], +a[1], +a[2])) / 86_400_000) === n) mg++
    }
  }
  return gm === mg ? (italiano ? 'gm' : 'mg') : gm > mg ? 'gm' : 'mg'
}

function dataIso(v: string, ordine: 'gm' | 'mg'): string | null {
  const t = v.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10)
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!m) return null
  const [g, mese] = ordine === 'gm' ? [Number(m[1]), Number(m[2])] : [Number(m[2]), Number(m[1])]
  const anno = Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3])
  if (mese < 1 || mese > 12 || g < 1 || g > 31) return null
  return `${anno}-${String(mese).padStart(2, '0')}-${String(g).padStart(2, '0')}`
}

/** le prenotazioni del file dei guadagni (pagamenti, rettifiche e righe vuote si saltano) */
export function leggiGuadagni(testo: string, futuro = false): RigaGuadagni[] {
  const righe = leggiCsv(testo)
  const intestazione = righe[0]?.map((h) => h.trim()) ?? []
  const col: Record<string, number> = {}
  for (const [nome, r] of Object.entries(COLONNE)) col[nome] = intestazione.findIndex((h) => r.test(h))
  if (col.codice < 0 || col.importo < 0 || col.inizio < 0)
    throw new Error('Questo file non sembra quello dei guadagni di Airbnb (mancano le colonne del codice, delle date o dell’importo).')
  const italiano = intestazione.some((h) => /codice|importo|notti/i.test(h))
  const dati = righe.slice(1)
  const v = (r: string[], nome: string) => (col[nome] >= 0 ? (r[col[nome]] ?? '').trim() : '')
  const ordine = ordineDate(
    dati.map((r) => [v(r, 'inizio'), v(r, 'fine'), importo(v(r, 'notti'))]),
    italiano,
  )
  const risultato = new Map<string, RigaGuadagni>()
  for (const r of dati) {
    const codice = v(r, 'codice').toUpperCase()
    const tipo = v(r, 'tipo').toLowerCase()
    // solo le prenotazioni (niente pagamenti, rettifiche, risoluzioni…)
    if (!/^[A-Z0-9]{6,}$/.test(codice) || (tipo && !/reserv|prenotaz/.test(tipo))) continue
    const checkin = dataIso(v(r, 'inizio'), ordine)
    const guadagno = importo(v(r, 'importo'))
    if (!checkin || guadagno == null) continue
    const vecchia = risultato.get(codice)
    // la stessa prenotazione può comparire più volte (pagamenti a rate): si sommano
    risultato.set(codice, {
      codice,
      ospite: v(r, 'ospite') || null,
      annuncio: v(r, 'annuncio') || null,
      checkin,
      checkout: dataIso(v(r, 'fine'), ordine),
      notti: importo(v(r, 'notti')),
      guadagno: (vecchia?.guadagno ?? 0) + guadagno,
      lordo: vecchia?.lordo != null || importo(v(r, 'lordo')) != null ? (vecchia?.lordo ?? 0) + (importo(v(r, 'lordo')) ?? 0) : null,
      pulizie: importo(v(r, 'pulizie')) ?? vecchia?.pulizie ?? null,
      commissione: vecchia?.commissione != null || importo(v(r, 'commissione')) != null ? (vecchia?.commissione ?? 0) + (importo(v(r, 'commissione')) ?? 0) : null,
      valuta: v(r, 'valuta') || null,
      futura: futuro,
    })
  }
  return [...risultato.values()].sort((a, b) => a.checkin.localeCompare(b.checkin))
}
