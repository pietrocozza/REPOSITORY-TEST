import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { ErroreVoce } from './gemini.ts'

// La voce di Ambrogio con ElevenLabs: di solito una voce clonata da un vero milanese (con il suo permesso),
// così accento e dialetto sono autentici. La voce è sempre la stessa: quella scelta nelle Impostazioni.
// La chiave sta solo nel file .env (AMBROGIO_ELEVENLABS_CHIAVE) e non arriva mai all'interfaccia.
// Si paga a caratteri: le frasi già dette si salvano in data/voce e non si pagano due volte.

export type Qualita = 'veloce' | 'massima'
// veloce: risponde subito e consuma metà crediti; massima: un po' più lenta, accento più fedele
const MODELLI: Record<Qualita, string> = { veloce: 'eleven_flash_v2_5', massima: 'eleven_multilingual_v2' }

type Opzioni = { chiave: string; cartellaCache: string; url?: string; modello?: string }
type Voce = { id: string; descrizione: string; clonata: boolean }

export class VoceElevenLabs {
  private opz: Opzioni
  private vociSalvate: { quando: number; voci: Voce[] } | null = null
  sospesaFinoA = 0

  constructor(opz: Opzioni) {
    this.opz = opz
  }

  get disponibile() {
    return Boolean(this.opz.chiave)
  }

  private async chiama(percorso: string, init: RequestInit = {}) {
    return fetch(`${this.opz.url ?? 'https://api.elevenlabs.io'}${percorso}`, {
      ...init,
      headers: { 'xi-api-key': this.opz.chiave, ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(30_000),
    })
  }

  private async errore(res: Response): Promise<ErroreVoce> {
    const dati = (await res.json().catch(() => null)) as { detail?: { status?: string; message?: string } } | null
    const stato = dati?.detail?.status ?? ''
    if (stato === 'quota_exceeded') {
      this.sospesaFinoA = Date.now() + 60 * 60 * 1000
      return new ErroreVoce('limite', 'Crediti di ElevenLabs finiti per questo mese: uso la voce di Edge.')
    }
    if (res.status === 401 || stato === 'invalid_api_key') return new ErroreVoce('senza-chiave', 'La chiave di ElevenLabs non è valida.')
    if (res.status === 429) {
      this.sospesaFinoA = Date.now() + 20 * 1000
      return new ErroreVoce('limite', 'ElevenLabs è occupato: riprovo tra poco.')
    }
    return new ErroreVoce('errore', `ElevenLabs non risponde (${res.status}${dati?.detail?.message ? `: ${dati.detail.message}` : ''}).`)
  }

  /** Le voci del tuo account: prima quelle clonate (la voce di Ambrogio) */
  async voci(): Promise<Voce[]> {
    if (!this.disponibile) return []
    if (this.vociSalvate && Date.now() - this.vociSalvate.quando < 10 * 60 * 1000) return this.vociSalvate.voci
    const res = await this.chiama('/v1/voices')
    if (!res.ok) throw await this.errore(res)
    const dati = (await res.json()) as { voices?: { voice_id: string; name: string; category?: string }[] }
    const voci = (dati.voices ?? [])
      .map((v) => ({ id: v.voice_id, descrizione: v.name, clonata: v.category === 'cloned' || v.category === 'professional' }))
      .sort((a, b) => Number(b.clonata) - Number(a.clonata) || a.descrizione.localeCompare(b.descrizione))
    this.vociSalvate = { quando: Date.now(), voci }
    return voci
  }

  /** Quanti caratteri hai usato questo mese e quanti ne prevede il piano */
  async crediti() {
    const res = await this.chiama('/v1/user/subscription')
    if (!res.ok) return null
    const d = (await res.json()) as { character_count?: number; character_limit?: number; next_character_count_reset_unix?: number }
    return {
      usati: d.character_count ?? 0,
      limite: d.character_limit ?? 0,
      rinnovo: d.next_character_count_reset_unix ? new Date(d.next_character_count_reset_unix * 1000).toISOString() : null,
    }
  }

  async stato() {
    let voci: Voce[] = []
    let problema: string | null = null
    try {
      voci = await this.voci()
    } catch (err) {
      problema = (err as Error).message
    }
    return {
      fornitore: 'elevenlabs' as const,
      disponibile: this.disponibile && !problema,
      problema,
      voci,
      crediti: this.disponibile && !problema ? await this.crediti().catch(() => null) : null,
      sospesaFinoA: this.sospesaFinoA > Date.now() ? new Date(this.sospesaFinoA).toISOString() : null,
    }
  }

  async sintetizza(testo: string, voce: string, qualita: Qualita = 'veloce'): Promise<Buffer> {
    if (!this.disponibile) throw new ErroreVoce('senza-chiave', 'Manca la chiave di ElevenLabs nel file .env.')
    if (!/^[A-Za-z0-9]{8,40}$/.test(voce)) throw new ErroreVoce('errore', 'Voce non valida.')
    const modello = this.opz.modello || MODELLI[qualita]
    const file = path.join(
      this.opz.cartellaCache,
      `el-${createHash('sha256').update(`${voce}\n${modello}\n${testo}`).digest('hex').slice(0, 32)}.mp3`,
    )
    if (fs.existsSync(file)) return fs.readFileSync(file)
    if (this.sospesaFinoA > Date.now()) throw new ErroreVoce('limite', 'ElevenLabs in pausa: uso la voce di Edge.')

    const res = await this.chiama(`/v1/text-to-speech/${voce}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: testo,
        model_id: modello,
        // i modelli v2.5 accettano la lingua: così l'italiano non viene scambiato per un'altra lingua
        ...(modello.includes('v2_5') ? { language_code: 'it' } : {}),
        voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true },
      }),
    })
    if (!res.ok) throw await this.errore(res)
    const audio = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(this.opz.cartellaCache, { recursive: true })
    fs.writeFileSync(file, audio)
    return audio
  }
}
