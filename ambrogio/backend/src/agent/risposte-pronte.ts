// Risposte pronte: le domande elementari (ora, data, saluti, «come ti chiami», piccoli calcoli)
// hanno una risposta immediata calcolata qui, senza disturbare Claude. Tutto il resto va a Claude.
// Si riconoscono solo frasi brevi e precise: nel dubbio la domanda passa a Claude.

type Contesto = { appellativo: string; adesso?: Date; caso?: () => number; suoni?: string[] }

const FUSO = 'Europe/Rome'

const scegli = (frasi: string[], caso: () => number) => frasi[Math.floor(caso() * frasi.length) % frasi.length]

/** minuscole, senza punteggiatura, senza il nome «Ambrogio» e senza le formule di cortesia */
export function normalizza(frase: string) {
  let t = frase
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^\p{L}\p{N}'+\-*/×÷,.\s]/gu, ' ')
    .replace(/(?<!\d)[.,](?!\d)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const cortesie = /^(?:(?:u[eèé]i?|w[eèé]|ehi|ok) ambrogio|ambrogio|u[eèé]|scusa|scusami|per favore|per piacere|senti|dimmi|mi dici|mi sai dire|sai dirmi|puoi dirmi|ma)\s+/
  for (let i = 0; i < 4 && cortesie.test(t); i++) t = t.replace(cortesie, '')
  return t.replace(/\s+(?:ambrogio|per favore|per piacere|grazie)$/, '').trim()
}

function oraParlata(adesso: Date) {
  const [h, m] = new Intl.DateTimeFormat('it-IT', { hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: FUSO })
    .format(adesso)
    .split(':')
    .map(Number)
  const minuti = m === 0 ? ' in punto' : ` e ${m}`
  if (h === 0) return `È mezzanotte${minuti}`
  if (h === 12) return `È mezzogiorno${minuti}`
  if (h === 1 || h === 13) return `È l'una${minuti}`
  return `Sono le ${h}${minuti}`
}

const dataParlata = (adesso: Date) =>
  new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSO }).format(adesso)

const momento = (adesso: Date) => {
  const h = Number(new Intl.DateTimeFormat('it-IT', { hour: 'numeric', hourCycle: 'h23', timeZone: FUSO }).format(adesso))
  return h < 5 ? 'notte' : h < 13 ? 'mattina' : h < 18 ? 'pomeriggio' : 'sera'
}

const numero = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 1000) / 1000).toLocaleString('it-IT', { maximumFractionDigits: 3 })

function calcolo(t: string): string | null {
  const m = t.match(/^(?:quanto fa|quanto è|quanto e|calcola|fa)?\s*(-?\d+(?:[.,]\d+)?)\s*(\+|più|piu|-|meno|x|×|\*|per|\/|÷|diviso(?: per)?)\s*(-?\d+(?:[.,]\d+)?)$/)
  if (!m) return null
  const a = Number(m[1].replace(',', '.'))
  const b = Number(m[3].replace(',', '.'))
  const op = m[2]
  let r: number
  let parola: string
  if (['+', 'più', 'piu'].includes(op)) [r, parola] = [a + b, 'più']
  else if (['-', 'meno'].includes(op)) [r, parola] = [a - b, 'meno']
  else if (['x', '×', '*', 'per'].includes(op)) [r, parola] = [a * b, 'per']
  else {
    if (b === 0) return 'Diviso zero non si può, nemmeno per un maggiordomo.'
    ;[r, parola] = [a / b, 'diviso']
  }
  return `${numero(a)} ${parola} ${numero(b)} fa ${numero(r)}.`
}

// ───────── Calcoli più complessi, senza internet e senza Claude ─────────
// «quanto fa 3 più 4 per 2», «radice quadrata di 144», «2 alla 10», «il 20 per cento di 150», «(12+8)/4»
function espressione(frase: string): string | null {
  let t = frase
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\b(?:u[eèé]i? )?ambrogio\b|[?!]|,(?!\d)|\bper favore\b|\bgrazie\b/g, ' ')
    .replace(/^\s*(?:mi\s+)?(?:sai dire |dimmi )?(?:quanto fa|quanto è|quanto e|quant'è|calcola(?:mi)?|mi calcoli|il risultato di|risultato di|fa)\s+/, '')
    .trim()
  if (!/\d/.test(t)) return null
  // percentuali: «il 20 per cento di 150», «20% di 150»
  t = t.replace(/(?:il |l')?(\d+(?:[.,]\d+)?)\s*(?:%|per ?cento) (?:di|su) /g, '$1/100*')
  t = t
    .replace(/radice(?: quadrata)? (?:di )?/g, ' r ')
    .replace(/ al quadrato/g, '^2')
    .replace(/ al cubo/g, '^3')
    .replace(/ elevato (?:alla?|a) | alla /g, '^')
    .replace(/\bdiviso(?: per)?\b|÷|:/g, '/')
    .replace(/\bper\b|×|\bx\b/g, '*')
    .replace(/(?<!\p{L})più(?!\p{L})|\bpiu\b/gu, '+')
    .replace(/\bmeno\b/g, '-')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, '')
  if (!/^[\d.+\-*/^()r]+$/.test(t) || !/[+\-*/^r]/.test(t.replace(/^-/, ''))) return null
  // analisi con precedenza degli operatori (nessun eval)
  let i = 0
  const leggi = (): number => {
    let v = termine()
    while (t[i] === '+' || t[i] === '-') v = t[i++] === '+' ? v + termine() : v - termine()
    return v
  }
  const termine = (): number => {
    let v = potenza()
    while (t[i] === '*' || t[i] === '/') {
      if (t[i++] === '*') v *= potenza()
      else {
        const d = potenza()
        if (d === 0) throw new Error('zero')
        v /= d
      }
    }
    return v
  }
  const potenza = (): number => {
    const b = unario()
    if (t[i] === '^') {
      i++
      return b ** potenza()
    }
    return b
  }
  const unario = (): number => {
    if (t[i] === '-') return i++, -unario()
    if (t[i] === 'r') {
      i++
      const v = unario()
      if (v < 0) throw new Error('negativo')
      return Math.sqrt(v)
    }
    if (t[i] === '(') {
      i++
      const v = leggi()
      if (t[i++] !== ')') throw new Error('parentesi')
      return v
    }
    const m = /^\d+(?:\.\d+)?/.exec(t.slice(i))
    if (!m) throw new Error('numero')
    i += m[0].length
    return Number(m[0])
  }
  try {
    const r = leggi()
    if (i !== t.length || !Number.isFinite(r)) return null
    return `Fa ${numero(r)}.`
  } catch (e) {
    if ((e as Error).message === 'zero') return 'Diviso zero non si può, nemmeno per un maggiordomo.'
    if ((e as Error).message === 'negativo') return 'La radice di un numero negativo non esiste tra i numeri normali.'
    return null
  }
}

type Regola = { frasi: RegExp; risposta: (c: Required<Contesto>) => string }

// Le risposte fisse (sempre uguali): con la voce di Gemini si registrano una volta e poi non costano più
const SALUTI = ['Buongiorno', 'Buon pomeriggio', 'Buonasera', 'Buonanotte']
const VARIANTI = {
  saluto: (saluto: string, nome: string) => [
    `${saluto}, ${nome}. Sono qui, cosa posso fare per te?`,
    `${saluto}, ${nome}. Ai tuoi ordini.`,
    `Ué, ${nome}! Sun chì, dimmi pure.`,
    `Eccomi, ${nome}. Andèm, cosa ti serve?`,
  ],
  grazie: (nome: string) => [`Dovere, ${nome}.`, 'È un piacere.', 'Sempre a disposizione.', 'Fa nagott, è il mio mestiere.'],
  chiSei: (nome: string) => [`Sono Ambrogio, il tuo maggiordomo personale. Tengo a mente le tue cose, cerco quello che ti serve e sbrigo le faccende, ${nome}.`],
  comeStai: () => ['Benissimo, grazie. Pronto a servirti.', 'In gran forma, come sempre. E tu?', 'Ué, si tira avanti! Tutto in ordine. Cosa posso fare per te?'],
  buonanotte: (nome: string) => [`Buonanotte, ${nome}. Riposa bene.`, `Buonanotte, ${nome}. Qui ci penso io.`],
}

/** Tutte le risposte pronte che non cambiano (per prepararne la voce in anticipo) */
export function frasiFisse(appellativo: string) {
  return [
    ...SALUTI.flatMap((s) => VARIANTI.saluto(s, appellativo)),
    ...VARIANTI.grazie(appellativo),
    ...VARIANTI.chiSei(appellativo),
    ...VARIANTI.comeStai(),
    ...VARIANTI.buonanotte(appellativo),
    'Diviso zero non si può, nemmeno per un maggiordomo.',
  ]
}

const REGOLE: Regola[] = [
  {
    frasi: /^(?:che ore sono|che ora è|che ora e|che ore son|l'ora|ora|sai che ore sono|che ore sono adesso|che ore sono ora)$/,
    risposta: (c) => `${oraParlata(c.adesso)}.`,
  },
  {
    frasi: /^(?:(?:oggi )?che giorno è(?: oggi)?|(?:oggi )?che giorno e(?: oggi)?|che data è(?: oggi)?|che data e(?: oggi)?|quanti ne abbiamo(?: oggi)?|che giorno della settimana è(?: oggi)?)$/,
    risposta: (c) => `Oggi è ${dataParlata(c.adesso)}.`,
  },
  {
    frasi: /^(?:ciao|salve|ehi|ehilà|eccomi|buongiorno|buon giorno|buon pomeriggio|buonasera|buona sera|ci sei|sei lì|sei li|sei sveglio|mi senti)$/,
    risposta: (c) => {
      const m = momento(c.adesso)
      const saluto = m === 'mattina' ? SALUTI[0] : m === 'pomeriggio' ? SALUTI[1] : m === 'sera' ? SALUTI[2] : SALUTI[3]
      return scegli(VARIANTI.saluto(saluto, c.appellativo), c.caso)
    },
  },
  {
    frasi: /^(?:grazie|grazie mille|grazie tante|ti ringrazio|perfetto grazie|ok grazie|va bene grazie|ottimo grazie|grazie ambrogio)$/,
    risposta: (c) => scegli(VARIANTI.grazie(c.appellativo), c.caso),
  },
  {
    frasi: /^(?:chi sei|chi sei tu|come ti chiami|qual è il tuo nome|presentati|tu chi sei)$/,
    risposta: (c) => VARIANTI.chiSei(c.appellativo)[0],
  },
  {
    frasi: /^(?:come stai|come va|tutto bene|come ti senti|come butta)$/,
    risposta: (c) => scegli(VARIANTI.comeStai(), c.caso),
  },
  {
    frasi: /^(?:buonanotte|buona notte|notte|vado a dormire)$/,
    risposta: (c) => scegli(VARIANTI.buonanotte(c.appellativo), c.caso),
  },
]

// «Fammi sentire l'inno alla gioia», «suonami qualcosa»: la musica parte subito, senza chiedere a Claude
const CHIEDE_MUSICA = /^(?:fammi sentire|fammi ascoltare|fai sentire|fai partire|fammi|suona|suonami|suonaci|riproduci|metti|mettimi|mettici|puoi suonare|puoi farmi sentire|vorrei sentire|voglio sentire)\s+(.+)$/
const GENERICO = /^(?:(?:un po' di |un po di |della |una |un |qualche )?(?:musica|canzone|canzoncina|brano|melodia|motivetto|suono|qualcosa(?: di musica)?)(?: per me)?)$/
const pulisciNome = (t: string) => t.replace(/'/g, ' ').replace(/\s+/g, ' ').trim()

function musica(t: string, c: Contesto & { caso: () => number }): string | null {
  const m = CHIEDE_MUSICA.exec(t)
  if (!m || !c.suoni?.length) return null
  const resto = pulisciNome(m[1])
  const trovato = [...c.suoni]
    .sort((a, b) => b.length - a.length)
    .find((nome) => resto.includes(pulisciNome(nome.toLowerCase())))
  const brani = c.suoni.filter((n) => n !== 'campanello')
  const scelto = trovato ?? (GENERICO.test(m[1].trim()) ? scegli(brani, c.caso) : null)
  if (!scelto) return null // un brano che non c'è: lo spiega Claude
  const apertura = scegli([`Ecco a te, ${c.appellativo}!`, 'Subito, maestro!', 'Con piacere.', 'Ghe pensi mi.'], c.caso)
  return `${apertura} [SUONO: ${scelto}]`
}

/** La risposta immediata, oppure null se la domanda va a Claude. */
export function rispostaPronta(frase: string, contesto: Contesto): string | null {
  const t = normalizza(frase)
  if (!t || t.length > 90) return null
  const c = { adesso: new Date(), caso: Math.random, ...contesto, suoni: contesto.suoni ?? [] }
  const conto = calcolo(t) ?? espressione(frase)
  if (conto) return conto
  const brano = musica(t, c)
  if (brano) return brano
  return REGOLE.find((r) => r.frasi.test(t))?.risposta(c) ?? null
}
