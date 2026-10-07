import { frasiFisse } from '../agent/risposte-pronte.ts'

// Le frasi che Ambrogio dice sempre uguali: con Gemini si registrano una volta (in data/voce) e poi
// non costano più nulla. Le esclamazioni in milanese le usa anche Claude, scritte esattamente così
// e come frasi a sé, così vengono riprese dall'archivio anche dentro le risposte.

export const ESCLAMAZIONI_MILANESI = [
  'Ué!',
  'Uela!',
  'Ghe pensi mi.',
  'Sun chì.',
  'Andèm!',
  'Ma va\' là!',
  'Fa nagott.',
  'Gh\'è nient de fà.',
  'Ghe sem.',
  'Sta\' schiscio.',
  'Ciapa sü e porta a cà.',
  'Ofelè, fa el tò mestè.',
  'L\'è minga vera!',
  'Te set minga normal!',
  'Te set propri un pirla!',
  'Pirla!',
  'Merluzz!',
  'Scarliga!',
  'Barlafus!',
  'Bauscia!',
  'Roba del menga!',
  'Figa!',
  'Ma va\' a ciapà i ratt!',
  'Va\' a dà via i ciap!',
  'Sun stuf!',
]

// Brevi conferme da maggiordomo: Claude le usa come prima frase, così quel pezzo parte subito dall'archivio
export const CONFERME = [
  'Fatto.',
  'Subito.',
  'Certo.',
  'Va bene.',
  'Con piacere.',
  'Ci penso io.',
  'Un attimo.',
  'Ecco fatto.',
  'Nessun problema.',
  'Ricevuto.',
  'Perfetto.',
  'Agli ordini.',
  'Come desideri.',
  'Ottima idea.',
  'Ecco qua.',
  'Vediamo un po\'.',
  'Purtroppo no.',
  'Non lo so, ma posso cercarlo.',
  'Scusami, non ho capito.',
  'Detto fatto.',
]

/** Divide un testo in frasi come fa l'interfaccia quando parla (così l'archivio coincide). */
export function dividiInFrasi(testo: string) {
  const frasi: string[] = []
  let inizio = 0
  const t = `${testo} `
  for (let i = 0; i < t.length - 1; i++) {
    const c = t[i]
    if (c === '\n' || ('.!?…'.includes(c) && /\s/.test(t[i + 1]))) {
      const frase = t.slice(inizio, i + 1).trim()
      if (frase) frasi.push(frase)
      inizio = i + 1
    }
  }
  const resto = t.slice(inizio).trim()
  if (resto) frasi.push(resto)
  return frasi
}

/** Tutte le frasi da preparare: quelle del backend più quelle che manda l'interfaccia */
export function frasiDaPreparare(appellativo: string, dallInterfaccia: string[] = []) {
  const tutte = [...ESCLAMAZIONI_MILANESI, ...CONFERME, `Ué, ${appellativo}!`, `Sciur ${appellativo}.`, ...frasiFisse(appellativo), ...dallInterfaccia]
  return [...new Set(tutte.flatMap(dividiInFrasi))].filter((f) => f.length <= 300)
}
