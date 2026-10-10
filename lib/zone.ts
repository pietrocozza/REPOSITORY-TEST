// Zone del simulatore con indirizzo della pagina e una breve presentazione del quartiere
import DATI from '@/lib/simulatore-dati.json'

export type CittaSimulatore = keyof typeof DATI.citta
export type DatiZona = (typeof DATI.citta)['roma']['zone'][number]

const DESCRIZIONI_ROMA: Record<string, string> = {
  'Borgo e Vaticano': 'A due passi da San Pietro e dai Musei Vaticani: gli ospiti cercano case comode per visitare il Vaticano e raggiungere il centro a piedi.',
  "Campo de' Fiori e Ghetto": 'Tra Campo de’ Fiori, Piazza Farnese e il Ghetto ebraico: il cuore del centro storico, con tutto raggiungibile a piedi.',
  'Castro Pretorio': 'Tra la Stazione Termini e Porta Pia: comodissima per chi arriva in treno o dagli aeroporti.',
  'Colosseo e Celio': 'Ai piedi del Colosseo e del Celio: una delle zone più richieste da chi visita Roma per la prima volta.',
  'Della Vittoria e Mazzini': 'Quartiere elegante e tranquillo a nord di Prati, vicino al Foro Italico e allo Stadio Olimpico.',
  'Esquilino e Termini': 'Intorno a Santa Maria Maggiore e alla Stazione Termini: posizione strategica, collegata con tutta la città.',
  Monti: 'Il rione più antico di Roma, tra il Colosseo e Via Nazionale: vicoli, botteghe e locali, con tutto a portata di passeggiata.',
  'Pantheon e Navona': 'Tra il Pantheon e Piazza Navona: il centro del centro, una delle zone più ambite dai viaggiatori.',
  Prati: 'Elegante e ben collegato, tra il Vaticano e Piazza del Popolo: piace a famiglie e a chi viaggia per lavoro.',
  'Testaccio e Aventino': 'Testaccio con il suo mercato e la cucina romana, l’Aventino con il Giardino degli Aranci: la Roma autentica vicino al centro.',
  Trastevere: 'Piazze, vicoli e trattorie sull’altra sponda del Tevere: uno dei quartieri più amati dai turisti di tutto il mondo.',
  'Trevi e Piazza di Spagna': 'Tra Fontana di Trevi, Piazza di Spagna e Via Condotti: le grandi icone di Roma e le vie dello shopping.',
  Aurelio: 'Alle spalle del Vaticano e servito dalla metro A: un buon equilibrio tra richiesta e tranquillità.',
  'Garbatella, Ostiense e Appia': 'Garbatella, Ostiense e l’Appia Antica: quartieri vivaci, con la metro B e tanti locali.',
  'Monte Mario': 'Zona residenziale e verde a nord-ovest della città, con vista su Roma.',
  Monteverde: 'Quartiere residenziale sopra Trastevere, tra Villa Pamphili e Villa Sciarra.',
  'Ostia e Acilia': 'Il mare di Roma: una richiesta concentrata soprattutto nella stagione estiva.',
  'Parioli e Nomentano': 'Quartieri eleganti tra Villa Borghese, Villa Ada e Villa Torlonia.',
  'Pigneto, Prenestino e Centocelle': 'Quartieri vivaci a est, serviti dalla metro C e amati da chi cerca la Roma più giovane.',
  'Portuense e Magliana': 'Zona sud-ovest vicina a Trastevere, comoda per il treno verso Fiumicino.',
  'San Giovanni e Cinecittà': 'Da San Giovanni in Laterano a Cinecittà, lungo la metro A: in pochi minuti al centro.',
  Tiburtina: 'Intorno alla stazione Tiburtina e a San Lorenzo: comoda per i treni e per l’università.',
}

export const slugZona = (nome: string) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const ZONE_ROMA = DATI.citta.roma.zone.map((z) => ({ ...z, slug: slugZona(z.nome), descrizione: DESCRIZIONI_ROMA[z.nome] ?? '' }))

export const zonaRoma = (slug: string) => ZONE_ROMA.find((z) => z.slug === slug)

export const CAMERE_NOMI = { '0': 'Monolocale', '1': '1 camera', '2': '2 camere', '3': '3 o più camere' } as const

// Formato italiano scritto a mano: identico sul server e nel browser
export const migliaia = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
