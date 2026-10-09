import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Configurazione del backend: valori predefiniti sicuri, sovrascrivibili dal file ambrogio/.env.
// Nessun segreto va scritto nel codice: chiavi e token stanno solo in .env (escluso da git).

const qui = path.dirname(fileURLToPath(import.meta.url))
export const CARTELLA_AMBROGIO = path.resolve(qui, '..', '..')

const fileEnv = path.join(CARTELLA_AMBROGIO, '.env')
if (fs.existsSync(fileEnv)) process.loadEnvFile(fileEnv)

// (un .env di quando si chiamava Jarvis funziona ancora: JARVIS_… vale come AMBROGIO_…)
const env = (nome: string, predefinito = '') =>
  process.env[nome]?.trim() || process.env[nome.replace(/^AMBROGIO_/, 'JARVIS_')]?.trim() || predefinito
const vero = (nome: string) => ['1', 'true', 'si', 'sì', 'yes'].includes(env(nome).toLowerCase())

const cartellaDati = path.resolve(CARTELLA_AMBROGIO, env('AMBROGIO_CARTELLA_DATI', 'data'))

export const config = {
  /** il backend ascolta solo su questo computer: non è raggiungibile da altri dispositivi */
  host: env('AMBROGIO_HOST', '127.0.0.1'),
  porta: Number(env('AMBROGIO_PORTA', '8787')),
  /** pagine web autorizzate a usare il backend (l'interfaccia di Ambrogio) */
  originiConsentite: env('AMBROGIO_ORIGINI', 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  cartellaDati,
  /** cartella di lavoro di Claude Code: isolata dai tuoi file personali */
  cartellaLavoro: path.join(cartellaDati, 'agente'),

  claude: {
    /** percorso di claude.exe, se non viene trovato da solo */
    percorso: env('AMBROGIO_CLAUDE_PATH'),
    /** modello di Claude Code (vuoto = quello predefinito del tuo abbonamento) */
    modello: env('AMBROGIO_MODELLO'),
    /**
     * Quanto Claude "ragiona" prima di rispondere: low (più rapido, adatto alla chat), medium, high.
     * Più alto = risposte più ponderate ma più lente e più consumo dell'abbonamento.
     */
    effort: env('AMBROGIO_EFFORT', 'low'),
    /** Claude Code resta acceso tra un messaggio e l'altro (più veloce). AMBROGIO_MODALITA_VELOCE=0 per disattivarla. */
    modalitaVeloce: env('AMBROGIO_MODALITA_VELOCE', '1') !== '0',
    /** tempo massimo per una risposta, in secondi */
    // include l'eventuale attesa di una tua autorizzazione (fino a 10 minuti)
    timeoutSecondi: Number(env('AMBROGIO_TIMEOUT', '240')),
    /**
     * Regola sui costi: Ambrogio usa SOLO il tuo abbonamento Claude.
     * Se un giorno vorrai usare l'API a consumo dovrai scrivere AMBROGIO_CONSENTI_API_A_CONSUMO=1 nel file .env.
     */
    consentiApiAConsumo: vero('AMBROGIO_CONSENTI_API_A_CONSUMO'),
  },

  /** voce con accento milanese (Google Gemini): la chiave si crea gratis su aistudio.google.com */
  gemini: {
    chiave: env('AMBROGIO_GEMINI_CHIAVE'),
    /** vuoto = sceglie Ambrogio il modello vocale disponibile */
    modello: env('AMBROGIO_GEMINI_MODELLO'),
    /** pagamento a consumo attivato su Google: niente limite giornaliero, si parla frase per frase */
    pagamento: vero('AMBROGIO_GEMINI_A_PAGAMENTO'),
    /** solo per i test (un finto Gemini) */
    url: env('AMBROGIO_GEMINI_URL') || undefined,
  },

  /** voce di Ambrogio con ElevenLabs (a pagamento, piano scelto da te): se c'è la chiave ha la precedenza su Gemini */
  elevenlabs: {
    chiave: env('AMBROGIO_ELEVENLABS_CHIAVE'),
    /** vuoto = lo sceglie la qualità indicata nelle Impostazioni */
    modello: env('AMBROGIO_ELEVENLABS_MODELLO'),
    /** solo per i test */
    url: env('AMBROGIO_ELEVENLABS_URL') || undefined,
  },

  /**
   * Accesso a Google (Gmail): credenziali dell'app creata su Google Cloud (tipo "App desktop").
   * Non sono la password di Pietro: quella non passa mai da Ambrogio.
   */
  google: {
    clientId: env('AMBROGIO_GOOGLE_CLIENT_ID'),
    clientSecret: env('AMBROGIO_GOOGLE_CLIENT_SECRET'),
    /** l'account da suggerire nella pagina di Google */
    email: env('AMBROGIO_GMAIL_INDIRIZZO'),
    /** solo per i test (un finto Google) */
    urlFinto: env('AMBROGIO_GOOGLE_URL_FINTO') || undefined,
  },

  /**
   * Telefono (Linphone, gratis): gira in Ubuntu dentro Windows (WSL). Account e password li legge da .env
   * il servizio telefonico stesso; qui serve solo sapere se è configurato e in quale Ubuntu gira.
   */
  telefono: {
    configurato: Boolean(env('AMBROGIO_LINPHONE_UTENTE')),
    distro: env('AMBROGIO_WSL_DISTRO', 'Ubuntu-24.04'),
    /** solo per i test: comando che sostituisce il servizio vero (es. "node finto-telefono.mjs") */
    comando: env('AMBROGIO_TELEFONO_COMANDO'),
  },

  /**
   * Airbnb: il link del calendario esportato di ogni casa (Annuncio → Disponibilità → Collega calendari → Esporta).
   * È un link privato: sta solo nel file .env.
   */
  airbnb: {
    case: [1, 2]
      .map((n) => ({ numero: n, nome: env(`AMBROGIO_AIRBNB_CASA_${n}_NOME`, `Casa ${n}`), ical: env(`AMBROGIO_AIRBNB_CASA_${n}_ICAL`) }))
      .filter((c) => c.ical),
  },

  /** come Ambrogio ti chiama */
  appellativo: env('AMBROGIO_APPELLATIVO', 'Pietro'),
}

export type Config = typeof config
