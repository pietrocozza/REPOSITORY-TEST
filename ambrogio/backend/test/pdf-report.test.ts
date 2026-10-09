import assert from 'node:assert/strict'
import zlib from 'node:zlib'
import { test } from 'node:test'
import { testoPdf } from '../src/integrazioni/pdf-testo.ts'
import { leggiReportGuadagniTesto } from '../src/integrazioni/guadagni-airbnb.ts'
import { statisticheEPrevisione } from '../src/integrazioni/spese.ts'

// un PDF minimo fatto come quelli di Airbnb: testo compresso, caratteri a 2 byte con tabella ToUnicode
function pdfDiProva(righe: string[]) {
  const codici = new Map<string, number>()
  const codice = (c: string) => {
    if (!codici.has(c)) codici.set(c, codici.size + 3)
    return codici.get(c)!
  }
  const esa = (t: string) => [...t].map((c) => codice(c).toString(16).padStart(4, '0')).join('')
  const contenuto = righe.map((r, i) => `BT /F1 10 Tf 1 0 0 1 40 ${760 - i * 14} Tm <${esa(r)}> Tj ET`).join('\n')
  const cmap = `begincmap\n${codici.size} beginbfchar\n${[...codici].map(([c, n]) => `<${n.toString(16).padStart(4, '0')}> <${c.charCodeAt(0).toString(16).padStart(4, '0')}>`).join('\n')}\nendbfchar\nendcmap`
  const flusso = (dati: Buffer) => Buffer.concat([Buffer.from(`<< /Length ${dati.length} /Filter /FlateDecode >>\nstream\n`, 'latin1'), dati, Buffer.from('\nendstream')])
  const parti = [
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'),
    Buffer.from('3 0 obj\n<< /Type /Page /Parent 2 0 R /Contents 4 0 R /Resources 5 0 R >>\nendobj\n'),
    Buffer.from('4 0 obj\n'), flusso(zlib.deflateSync(Buffer.from(contenuto, 'latin1'))), Buffer.from('\nendobj\n'),
    Buffer.from('5 0 obj\n<< /Font 6 0 R >>\nendobj\n6 0 obj\n<< /F1 7 0 R >>\nendobj\n'),
    Buffer.from('7 0 obj\n<< /Type /Font /Subtype /Type0 /Encoding /Identity-H /ToUnicode 8 0 R >>\nendobj\n'),
    Buffer.from('8 0 obj\n'), flusso(zlib.deflateSync(Buffer.from(cmap, 'latin1'))), Buffer.from('\nendobj\n%%EOF'),
  ]
  return Buffer.concat(parti)
}

const REPORT = [
  'Report generato: 9 ottobre 2026',
  '1 dicembre 2025 – 9 febbraio 2026',
  'Report dei guadagni',
  'Riepilogo',
  'Guadagni  9.000,00 €  -10,00 €  -100,00 €  0,00 €  4.300,00 €',
  'Alloggi',
  'CASA A  9.000,00 €  -10,00 €  -100,00 €  0,00 €  4.300,00 €',
  'Tasse',
  'Periodo di riferimento',
  'Mese  Guadagni lordi  Totale (EUR)',
  'dicembre  2000,00 €  1.800,00 €',
  'gennaio  1500,00 €  1.400,00 €',
  '01–09 feb  1200,00 €  1.100,00 €',
  'Preferenze di pagamento',
]

test('PDF: il testo si legge riga per riga (caratteri a 2 byte e tabella ToUnicode)', () => {
  const righe = testoPdf(pdfDiProva(REPORT))
  assert.deepEqual(righe, REPORT)
})

test('report dei guadagni dal testo: anno del PERIODO (non «Report generato»), cambio d’anno, controllo del totale', () => {
  const r = leggiReportGuadagniTesto(REPORT)!
  assert.equal(r.periodo, '1 dicembre 2025 – 9 febbraio 2026')
  assert.deepEqual(r.mesi, [
    { mese: '2025-12', lordo: 2000, netto: 1800 },
    { mese: '2026-01', lordo: 1500, netto: 1400 },
    { mese: '2026-02', lordo: 1200, netto: 1100 },
  ])
  assert.equal(r.totaleNetto, 4300)
  assert.equal(r.totaleControllo, true)
  assert.deepEqual(r.alloggi, [{ nome: 'CASA A', netto: 4300 }])
  assert.equal(leggiReportGuadagniTesto(['un altro PDF']), null)
})

test('statistiche e previsione dell’anno in corso dagli anni passati', () => {
  const mesi: { mese: string; netto: number }[] = []
  for (const anno of [2024, 2025]) for (let m = 1; m <= 12; m++) mesi.push({ mese: `${anno}-${String(m).padStart(2, '0')}`, netto: 1000 })
  for (let m = 1; m <= 9; m++) mesi.push({ mese: `2026-${String(m).padStart(2, '0')}`, netto: 1100 })
  mesi.push({ mese: '2026-10', netto: 200 })
  const r = statisticheEPrevisione(mesi, '2026-10', 500)
  assert.match(r[0], /^2024: 12\.000 € netti in 12 mesi .* utile con 500 € al mese di costi: 6000 €/)
  const previsione = r.find((x) => x.startsWith('Previsione 2026'))!
  assert.match(previsione, /finora \(gennaio–settembre\) 9900 €, rispetto al 2024 \+10%/)
  assert.match(previsione, /Ottobre è a 200 € \(mese in corso\)/)
  // ottobre–dicembre: 3000 € come gli anni scorsi, 3300 € con il +10%
  assert.match(previsione, /stima tra 3000 € e 3300 € \(media 3150 €\): anno tra 12\.900 € e 13\.200 €/)
  assert.match(previsione, /Utile previsto con 500 € al mese di costi \(6000 € l'anno\): circa 7050 €/)
  assert.doesNotMatch(r.find((x) => x.startsWith('Mesi peggiori')) ?? '', /2026-10/, 'il mese in corso non è «peggiore»')
})
