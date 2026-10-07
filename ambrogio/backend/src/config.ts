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
    timeoutSecondi: Number(env('AMBROGIO_TIMEOUT', '900')),
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
    /** solo per i test (un finto Gemini) */
    url: env('AMBROGIO_GEMINI_URL') || undefined,
  },

  /** come Ambrogio ti chiama */
  appellativo: env('AMBROGIO_APPELLATIVO', 'Pietro'),
}

export type Config = typeof config
