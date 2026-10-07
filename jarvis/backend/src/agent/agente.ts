import type { Config } from '../config.ts'
import { eseguiTurno, ProcessoClaude, type Avvio, type EsitoTurno } from './claude-code.ts'
import type { Eseguibile } from './eseguibile.ts'
import type { EventoAgente } from './eventi.ts'
import { istruzioni } from './istruzioni.ts'
import { ArchivioSessione } from './sessione.ts'

// L'agente: riceve un messaggio, lo passa a Claude Code e inoltra gli eventi all'interfaccia.
// Un solo turno alla volta: un nuovo messaggio interrompe quello precedente.

// Strumenti di sola lettura già sicuri (livello 1, automatici). Gli altri arriveranno con il gestore dei permessi.
const STRUMENTI_INTEGRATI = ['WebSearch', 'WebFetch']

// Claude Code acceso da più di un'ora viene riavviato quando è libero (così data e ora nelle istruzioni restano giuste)
const ETA_MASSIMA_MS = 60 * 60 * 1000

export class Agente {
  private config: Config
  private eseguibile: Eseguibile
  private sessioni: ArchivioSessione
  private processo: ProcessoClaude
  private inCorso: AbortController | null = null

  constructor(config: Config, eseguibile: Eseguibile) {
    this.config = config
    this.eseguibile = eseguibile
    this.sessioni = new ArchivioSessione(config.cartellaDati)
    this.processo = new ProcessoClaude(this.avvio())
  }

  get sessione() {
    return this.sessioni.attuale
  }

  get modalita() {
    return this.config.claude.modalitaVeloce && !this.processo.fallito ? 'veloce' : 'un avvio per messaggio'
  }

  /** impostazioni aggiornate per avviare Claude Code (sessione attuale, data e ora attuali) */
  private avvio(): Avvio {
    return {
      sessione: { ...this.sessioni.attuale },
      eseguibile: this.eseguibile,
      cartellaLavoro: this.config.cartellaLavoro,
      istruzioni: istruzioni(this.config.appellativo),
      strumenti: STRUMENTI_INTEGRATI,
      modello: this.config.claude.modello || undefined,
      effort: this.config.claude.effort || undefined,
      consentiApiAConsumo: this.config.claude.consentiApiAConsumo,
      onSessioneAperta: () => this.sessioni.segnaAvviata(),
    }
  }

  /** Accende Claude Code in anticipo, così il primo messaggio è più rapido. */
  prepara() {
    if (this.modalita === 'veloce' && !this.processo.acceso) this.processo.accendi(this.avvio())
  }

  interrompi() {
    this.inCorso?.abort()
    this.inCorso = null
  }

  nuovaConversazione() {
    this.interrompi()
    this.processo.spegni()
    const s = this.sessioni.nuova()
    this.prepara()
    return s
  }

  spegni() {
    this.interrompi()
    this.processo.spegni()
  }

  private async turnoVeloce(messaggio: string, onEvento: (e: EventoAgente) => void, signal: AbortSignal): Promise<EsitoTurno | 'riserva'> {
    if (this.processo.acceso && this.processo.eta > ETA_MASSIMA_MS) this.processo.spegni()
    if (!this.processo.acceso) this.processo.accendi(this.avvio())

    // gli errori vengono trattenuti: se la modalità veloce non funziona si riprova in quella di riserva
    let errore: EventoAgente | null = null
    const esito = await this.processo.invia(messaggio, {
      timeoutMs: this.config.claude.timeoutSecondi * 1000,
      signal,
      onEvento: (e) => {
        if (e.tipo === 'errore') errore = e
        else onEvento(e)
      },
    })
    if (esito === 'errore' && this.processo.fallito) {
      console.warn('[jarvis] la modalità veloce non funziona su questo PC: uso un avvio di Claude Code per ogni messaggio')
      return 'riserva'
    }
    if (errore) onEvento(errore)
    return esito
  }

  async chat(messaggio: string, onEvento: (e: EventoAgente) => void, signal?: AbortSignal) {
    this.interrompi()
    const controller = new AbortController()
    this.inCorso = controller
    signal?.addEventListener('abort', () => controller.abort(), { once: true })

    const inizio = Date.now()
    const strumentiUsati: string[] = []
    const inoltra = (e: EventoAgente) => {
      if (e.tipo === 'stato' && e.strumento) strumentiUsati.push(e.strumento)
      onEvento(e)
    }
    inoltra({ tipo: 'stato', stato: 'THINKING' })

    let esito: EsitoTurno = 'errore'
    for (let tentativo = 0; tentativo < 2; tentativo++) {
      let risultato: EsitoTurno | 'riserva' = 'riserva'
      if (this.modalita === 'veloce') risultato = await this.turnoVeloce(messaggio, inoltra, controller.signal)
      if (risultato === 'riserva') {
        risultato = await eseguiTurno({
          ...this.avvio(),
          messaggio,
          timeoutMs: this.config.claude.timeoutSecondi * 1000,
          signal: controller.signal,
          onEvento: inoltra,
        })
      }
      esito = risultato

      if (esito === 'sessione-mancante' && tentativo === 0) {
        // la conversazione salvata non esiste più (es. dati di Claude Code cancellati): se ne apre una nuova
        this.processo.spegni()
        this.sessioni.nuova()
        continue
      }
      break
    }

    if (this.inCorso === controller) this.inCorso = null
    if (esito === 'ok') {
      if (strumentiUsati.length) inoltra({ tipo: 'stato', stato: 'SUCCESS' })
      inoltra({ tipo: 'fine', sessione: this.sessioni.attuale.id, durataMs: Date.now() - inizio, strumentiUsati })
    } else if (esito === 'sessione-mancante') {
      inoltra({ tipo: 'errore', messaggio: 'Non riesco ad aprire la conversazione con Claude Code. Riprova.' })
    }
    // dopo un'interruzione Claude Code è stato chiuso: lo si riaccende subito per il prossimo messaggio
    if (esito === 'interrotto') this.prepara()
    return esito
  }
}
