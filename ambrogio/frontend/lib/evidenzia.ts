// Colora il codice (parole chiave, testi, commenti, numeri…) senza librerie esterne.
// Non è un analizzatore completo: basta a rendere leggibile una riga alla volta.

export type Pezzo = { c: string; t: string }

const PAROLE_CHIAVE = new Set(
  (
    'import export from default const let var function return if else for while do switch case break continue new class ' +
    'extends implements interface type enum async await try catch finally throw typeof instanceof in of as satisfies ' +
    'private public protected readonly static get set this super null undefined true false void yield keyof declare'
  ).split(' '),
)

type Regola = [RegExp, string]

const REGOLE_CODICE: Regola[] = [
  [/^\/\/.*/, 'commento'],
  [/^\/\*.*?(\*\/|$)/, 'commento'],
  [/^#(?![0-9a-f]{3,8}\b).*/i, 'commento'],
  [/^(['"`])(?:\\.|(?!\1).)*\1?/, 'testo'],
  [/^#[0-9a-f]{3,8}\b/i, 'numero'],
  [/^\d[\d_.]*(?:e[+-]?\d+)?(?:px|ms|s|em|rem|%|dvh|vh|vw|deg|fr)?/i, 'numero'],
  [/^<\/?[A-Za-z][\w.-]*/, 'tag'],
  [/^[A-Za-z_$][\w$-]*(?=\s*\()/, 'funzione'],
  [/^[A-Za-z_$][\w$]*/, 'parola'],
  [/^[{}()[\]]/, 'parentesi'],
  [/^(=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|[=+\-*/%<>!?:|&.,;])/, 'segno'],
  [/^\s+/, ''],
]

/** Divide una riga in pezzi colorati, in base al tipo di file. */
export function evidenzia(riga: string, percorso: string): Pezzo[] {
  const estensione = percorso.split('.').pop()?.toLowerCase() ?? ''
  if (['md', 'txt', 'gitignore', 'example'].includes(estensione) || !percorso.includes('.')) return [{ c: 'semplice', t: riga }]

  const pezzi: Pezzo[] = []
  let resto = riga
  while (resto) {
    let trovato = false
    for (const [regola, classe] of REGOLE_CODICE) {
      const m = resto.match(regola)
      if (!m || !m[0]) continue
      let c = classe
      if (classe === 'parola') c = PAROLE_CHIAVE.has(m[0]) ? 'chiave' : /^[A-Z]/.test(m[0]) ? 'tipo' : 'nome'
      // nei CSS le proprietà prima dei due punti hanno un colore loro
      if (estensione === 'css' && classe === 'parola' && /^\s*:/.test(resto.slice(m[0].length))) c = 'proprieta'
      pezzi.push({ c, t: m[0] })
      resto = resto.slice(m[0].length)
      trovato = true
      break
    }
    if (!trovato) {
      pezzi.push({ c: '', t: resto[0] })
      resto = resto.slice(1)
    }
  }
  // unisce i pezzi vicini dello stesso colore (meno elementi da disegnare)
  return pezzi.reduce<Pezzo[]>((acc, p) => {
    const ultimo = acc.at(-1)
    if (ultimo && ultimo.c === p.c) ultimo.t += p.t
    else acc.push({ ...p })
    return acc
  }, [])
}
