import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Configurazione del backend: valori predefiniti sicuri, sovrascrivibili dal file jarvis/.env.
// Nessun segreto va scritto nel codice: chiavi e token stanno solo in .env (escluso da git).

const qui = path.dirname(fileURLToPath(import.meta.url))
export const CARTELLA_JARVIS = path.resolve(qui, '..', '..')

const fileEnv = path.join(CARTELLA_JARVIS, '.env')
if (fs.existsSync(fileEnv)) process.loadEnvFile(fileEnv)

const env = (nome: string, predefinito = '') => process.env[nome]?.trim() || predefinito
const vero = (nome: string) => ['1', 'true', 'si', 'sì', 'yes'].includes(env(nome).toLowerCase())

const cartellaDati = path.resolve(CARTELLA_JARVIS, env('JARVIS_CARTELLA_DATI', 'data'))

export const config = {
  /** il backend ascolta solo su questo computer: non è raggiungibile da altri dispositivi */
  host: env('JARVIS_HOST', '127.0.0.1'),
  porta: Number(env('JARVIS_PORTA', '8787')),
  /** pagine web autorizzate a usare il backend (l'interfaccia di Jarvis) */
  originiConsentite: env('JARVIS_ORIGINI', 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  cartellaDati,
  /** cartella di lavoro di Claude Code: isolata dai tuoi file personali */
  cartellaLavoro: path.join(cartellaDati, 'agente'),

  claude: {
    /** percorso di claude.exe, se non viene trovato da solo */
    percorso: env('JARVIS_CLAUDE_PATH'),
    /** modello di Claude Code (vuoto = quello predefinito del tuo abbonamento) */
    modello: env('JARVIS_MODELLO'),
    /**
     * Quanto Claude "ragiona" prima di rispondere: low (più rapido, adatto alla chat), medium, high.
     * Più alto = risposte più ponderate ma più lente e più consumo dell'abbonamento.
     */
    effort: env('JARVIS_EFFORT', 'low'),
    /** Claude Code resta acceso tra un messaggio e l'altro (più veloce). JARVIS_MODALITA_VELOCE=0 per disattivarla. */
    modalitaVeloce: env('JARVIS_MODALITA_VELOCE', '1') !== '0',
    /** tempo massimo per una risposta, in secondi */
    // include l'eventuale attesa di una tua autorizzazione (fino a 10 minuti)
    timeoutSecondi: Number(env('JARVIS_TIMEOUT', '900')),
    /**
     * Regola sui costi: Jarvis usa SOLO il tuo abbonamento Claude.
     * Se un giorno vorrai usare l'API a consumo dovrai scrivere JARVIS_CONSENTI_API_A_CONSUMO=1 nel file .env.
     */
    consentiApiAConsumo: vero('JARVIS_CONSENTI_API_A_CONSUMO'),
  },

  /** come Jarvis ti chiama */
  appellativo: env('JARVIS_APPELLATIVO', 'Pietro'),
}

export type Config = typeof config
