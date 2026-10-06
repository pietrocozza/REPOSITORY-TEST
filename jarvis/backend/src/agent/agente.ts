import type { Config } from '../config.ts'
import { eseguiTurno } from './claude-code.ts'
import type { Eseguibile } from './eseguibile.ts'
import type { EventoAgente } from './eventi.ts'
import { istruzioni } from './istruzioni.ts'
import { ArchivioSessione } from './sessione.ts'

// L'agente: riceve un messaggio, lo passa a Claude Code e inoltra gli eventi all'interfaccia.
// Un solo turno alla volta: un nuovo messaggio interrompe quello precedente.

// Strumenti di sola lettura già sicuri (livello 1, automatici). Gli altri arriveranno con il gestore dei permessi.
const STRUMENTI_INTEGRATI = ['WebSearch', 'WebFetch']

export class Agente {
  private config: Config
  private eseguibile: Eseguibile
  private sessioni: ArchivioSessione
  private inCorso: AbortController | null = null

  constructor(config: Config, eseguibile: Eseguibile) {
    this.config = config
    this.eseguibile = eseguibile
    this.sessioni = new ArchivioSessione(config.cartellaDati)
  }

  get sessione() {
    return this.sessioni.attuale
  }

  interrompi() {
    this.inCorso?.abort()
    this.inCorso = null
  }

  nuovaConversazione() {
    this.interrompi()
    return this.sessioni.nuova()
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

    for (let tentativo = 0; tentativo < 2; tentativo++) {
      const esito = await eseguiTurno({
        messaggio,
        sessione: this.sessioni.attuale,
        eseguibile: this.eseguibile,
        cartellaLavoro: this.config.cartellaLavoro,
        istruzioni: istruzioni(this.config.appellativo),
        strumenti: STRUMENTI_INTEGRATI,
        modello: this.config.claude.modello || undefined,
        timeoutMs: this.config.claude.timeoutSecondi * 1000,
        consentiApiAConsumo: this.config.claude.consentiApiAConsumo,
        signal: controller.signal,
        onEvento: inoltra,
        onSessioneAperta: () => this.sessioni.segnaAvviata(),
      })

      if (esito === 'sessione-mancante' && tentativo === 0) {
        // la conversazione salvata non esiste più (es. dati di Claude Code cancellati): se ne apre una nuova
        this.sessioni.nuova()
        continue
      }
      if (this.inCorso === controller) this.inCorso = null
      if (esito === 'ok') {
        if (strumentiUsati.length) inoltra({ tipo: 'stato', stato: 'SUCCESS' })
        inoltra({ tipo: 'fine', sessione: this.sessioni.attuale.id, durataMs: Date.now() - inizio, strumentiUsati })
      } else if (esito === 'sessione-mancante') {
        inoltra({ tipo: 'errore', messaggio: 'Non riesco ad aprire la conversazione con Claude Code. Riprova.' })
      }
      return esito
    }
  }
}
