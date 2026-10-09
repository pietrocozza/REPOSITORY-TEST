import zlib from 'node:zlib'

// Un piccolo lettore di PDF (senza programmi in più): tira fuori il testo riga per riga, con le parole
// nell'ordine in cui si vedono sulla pagina. Basta per i report di Airbnb (testo compresso, caratteri
// codificati con una tabella «ToUnicode»), non per PDF scansionati o cifrati.

type Oggetto = { dict: string; stream: Buffer | null }
type Pezzo = { x: number; y: number; testo: string; pagina: number }

function oggetti(pdf: Buffer): Map<number, Oggetto> {
  const testo = pdf.toString('latin1')
  const mappa = new Map<number, Oggetto>()
  const re = /(\d+)\s+\d+\s+obj\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(testo))) {
    const inizio = m.index + m[0].length
    const fine = testo.indexOf('endobj', inizio)
    if (fine < 0) break
    const corpo = testo.slice(inizio, fine)
    const s = corpo.search(/stream\r?\n/)
    let dict = corpo
    let stream: Buffer | null = null
    if (s >= 0) {
      dict = corpo.slice(0, s)
      const a = inizio + s + (corpo[s + 6] === '\r' ? 8 : 7)
      const lunghezza = Number(dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/)?.[1] ?? NaN)
      const b = Number.isFinite(lunghezza) ? a + lunghezza : testo.indexOf('endstream', a)
      stream = pdf.subarray(a, b)
      if (/\/FlateDecode/.test(dict)) {
        try {
          stream = zlib.inflateSync(stream)
        } catch {
          try {
            stream = zlib.inflateSync(pdf.subarray(a, testo.indexOf('endstream', a)))
          } catch {
            stream = null
          }
        }
      }
    }
    mappa.set(Number(m[1]), { dict, stream })
    re.lastIndex = fine
  }
  return mappa
}

/** tabella ToUnicode: codice del carattere → testo */
function leggiCMap(cmap: string) {
  const t = new Map<number, string>()
  const esa = (h: string) => {
    let s = ''
    for (let i = 0; i + 4 <= h.length; i += 4) s += String.fromCharCode(Number.parseInt(h.slice(i, i + 4), 16))
    return s || String.fromCharCode(Number.parseInt(h, 16))
  }
  for (const blocco of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
    for (const r of blocco[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) t.set(Number.parseInt(r[1], 16), esa(r[2]))
  for (const blocco of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g))
    for (const r of blocco[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]+>|\[[^\]]*\])/g)) {
      const da = Number.parseInt(r[1], 16)
      const a = Number.parseInt(r[2], 16)
      if (r[3].startsWith('[')) {
        const lista = [...r[3].matchAll(/<([0-9a-fA-F]+)>/g)].map((x) => esa(x[1]))
        for (let c = da; c <= a; c++) t.set(c, lista[c - da] ?? '')
      } else {
        const base = Number.parseInt(r[3].slice(1, -1), 16)
        for (let c = da; c <= a; c++) t.set(c, String.fromCharCode(base + c - da))
      }
    }
  return t
}

/** le parole di un flusso di contenuto, con la loro posizione */
function leggiContenuto(cont: string, fonti: Map<string, { cmap: Map<number, string> | null; dueByte: boolean }>, pagina: number, pezzi: Pezzo[]) {
  // gettoni: stringhe letterali, esadecimali, array, nomi, numeri, operatori
  const re = /\((?:\\.|[^\\)])*\)|<[0-9a-fA-F\s]*>|\[|\]|\/[^\s/<>[\]()]+|-?\d*\.?\d+|[A-Za-z'"*]+/g
  const pila: (string | number | (string | number)[])[] = []
  let array: (string | number)[] | null = null
  let fonte: { cmap: Map<number, string> | null; dueByte: boolean } | undefined
  let tm = [1, 0, 0, 1, 0, 0]
  let linea = [1, 0, 0, 1, 0, 0]
  let interlinea = 0
  const decodifica = (g: string) => {
    let byte: number[] = []
    if (g.startsWith('<')) {
      const h = g.slice(1, -1).replace(/\s/g, '')
      for (let i = 0; i < h.length; i += 2) byte.push(Number.parseInt(h.slice(i, i + 2).padEnd(2, '0'), 16))
    } else {
      const s = g.slice(1, -1).replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, e: string) =>
        /^[0-7]/.test(e) ? String.fromCharCode(Number.parseInt(e, 8)) : ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' } as Record<string, string>)[e] ?? e,
      )
      byte = [...s].map((c) => c.charCodeAt(0) & 255)
    }
    let out = ''
    if (fonte?.dueByte) for (let i = 0; i + 1 < byte.length; i += 2) out += fonte.cmap?.get((byte[i] << 8) | byte[i + 1]) ?? ''
    else for (const b of byte) out += fonte?.cmap?.get(b) ?? String.fromCharCode(b)
    return out
  }
  const scrivi = (t: string) => {
    if (t) pezzi.push({ x: tm[4], y: tm[5], testo: t, pagina })
  }
  const sposta = (tx: number, ty: number) => {
    linea = [linea[0], linea[1], linea[2], linea[3], linea[4] + tx * linea[0] + ty * linea[2], linea[5] + tx * linea[1] + ty * linea[3]]
    tm = [...linea]
  }
  let m: RegExpExecArray | null
  while ((m = re.exec(cont))) {
    const g = m[0]
    if (g === '[') {
      array = []
      continue
    }
    if (g === ']') {
      if (array) pila.push(array)
      array = null
      continue
    }
    if (g.startsWith('(') || g.startsWith('<') || g.startsWith('/') || /^-?\d*\.?\d+$/.test(g)) {
      const v = /^-?\d*\.?\d+$/.test(g) ? Number(g) : g
      if (array) array.push(v)
      else pila.push(v)
      continue
    }
    const n = (i: number) => Number(pila[pila.length - i])
    switch (g) {
      case 'BT':
        tm = [1, 0, 0, 1, 0, 0]
        linea = [1, 0, 0, 1, 0, 0]
        break
      case 'Tf':
        fonte = fonti.get(String(pila[pila.length - 2]).slice(1))
        break
      case 'Tm':
        linea = [n(6), n(5), n(4), n(3), n(2), n(1)]
        tm = [...linea]
        break
      case 'Td':
        sposta(n(2), n(1))
        break
      case 'TD':
        interlinea = -n(1)
        sposta(n(2), n(1))
        break
      case 'TL':
        interlinea = n(1)
        break
      case 'T*':
        sposta(0, -interlinea)
        break
      case 'Tj':
        scrivi(decodifica(String(pila[pila.length - 1])))
        break
      case "'":
        sposta(0, -interlinea)
        scrivi(decodifica(String(pila[pila.length - 1])))
        break
      case 'TJ': {
        const a = pila[pila.length - 1]
        if (Array.isArray(a)) scrivi(a.map((x) => (typeof x === 'string' ? decodifica(x) : Number(x) < -200 ? ' ' : '')).join(''))
        break
      }
    }
    if (!['[', ']'].includes(g)) pila.length = 0
  }
}

/** il testo del PDF, una riga per riga visibile (le colonne separate da due spazi) */
export function testoPdf(pdf: Buffer): string[] {
  const ogg = oggetti(pdf)
  // un valore di un dizionario: scritto lì (<< … >>) oppure in un altro oggetto (N 0 R)
  const valore = (dict: string, chiave: string): string => {
    const rif = dict.match(new RegExp(`/${chiave}\\s+(\\d+)\\s+\\d+\\s+R`))
    if (rif) return ogg.get(Number(rif[1]))?.dict ?? ''
    const i = dict.search(new RegExp(`/${chiave}\\s*<<`))
    if (i < 0) return ''
    let livello = 0
    for (let j = dict.indexOf('<<', i); j < dict.length; j++) {
      if (dict.startsWith('<<', j)) {
        livello++
        j++
      } else if (dict.startsWith('>>', j)) {
        livello--
        j++
        if (!livello) return dict.slice(dict.indexOf('<<', i), j + 1)
      }
    }
    return ''
  }
  const cacheFonti = new Map<number, { cmap: Map<number, string> | null; dueByte: boolean }>()
  const fonte = (n: number) => {
    if (!cacheFonti.has(n)) {
      const f = ogg.get(n)?.dict ?? ''
      const tu = f.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/)
      const cmap = tu ? ogg.get(Number(tu[1]))?.stream : null
      cacheFonti.set(n, { cmap: cmap ? leggiCMap(cmap.toString('latin1')) : null, dueByte: /Type0|Identity-H/.test(f) })
    }
    return cacheFonti.get(n)!
  }
  // le pagine nell'ordine del documento, ognuna con le sue fonti (/F1, /F2…)
  const pezzi: Pezzo[] = []
  let pagina = 0
  for (const o of ogg.values()) {
    if (!/\/Type\s*\/Page(?!s)/.test(o.dict)) continue
    pagina++
    const fonti = new Map<string, { cmap: Map<number, string> | null; dueByte: boolean }>()
    for (const r of valore(valore(o.dict, 'Resources'), 'Font').matchAll(/\/([^\s/<>]+)\s+(\d+)\s+\d+\s+R/g)) fonti.set(r[1], fonte(Number(r[2])))
    const cont = o.dict.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/)?.[1] ?? ''
    for (const r of cont.matchAll(/(\d+)\s+\d+\s+R/g)) {
      const st = ogg.get(Number(r[1]))?.stream
      if (st) leggiContenuto(st.toString('latin1'), fonti, pagina, pezzi)
    }
  }
  // righe: stessi pagina e altezza (con un po' di tolleranza), da sinistra a destra
  pezzi.sort((a, b) => a.pagina - b.pagina || b.y - a.y || a.x - b.x)
  const righe: Pezzo[][] = []
  for (const p of pezzi) {
    const r = righe.at(-1)
    if (r && r[0].pagina === p.pagina && Math.abs(r[0].y - p.y) < 2.5) r.push(p)
    else righe.push([p])
  }
  return righe.map((r) =>
    r
      .sort((a, b) => a.x - b.x)
      .map((p) => p.testo.trim())
      .filter(Boolean)
      .join('  '),
  )
}
