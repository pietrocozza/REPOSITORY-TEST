import type { Config } from '../config.ts'
import { eseguiTurno, ProcessoClaude, type Avvio, type EsitoTurno } from './claude-code.ts'
import type { Eseguibile } from './eseguibile.ts'
import type { EventoAgente } from './eventi.ts'
import { istruzioni, PERSONALITA, type IdPersonalita } from './istruzioni.ts'
import { ArchivioImpostazioni } from '../impostazioni.ts'
import { ArchivioSessione } from './sessione.ts'
import path from 'node:path'
import { Database } from '../database/db.ts'
import { GestorePermessi } from '../permessi/gestore.ts'
import { STRUMENTI } from '../strumenti/catalogo.ts'
import { rispostaPronta } from './risposte-pronte.ts'

export type Servizi = { db?: Database; gestore?: GestorePermessi; mcp?: { url: string; chiave: string } }

// L'agente: riceve un messaggio, lo passa a Claude Code e inoltra gli eventi all'interfaccia.
// Un solo turno alla volta: un nuovo messaggio interrompe quello precedente.

// Strumenti integrati di Claude Code concessi: solo lettura dal web (livello 1, automatici).
// Tutti gli altri strumenti sono quelli di Ambrogio, controllati dal gestore dei permessi.
const STRUMENTI_INTEGRATI = ['WebSearch', 'WebFetch']

// Claude Code acceso da più di un'ora viene riavviato quando è libero (così data e ora nelle istruzioni restano giuste)
const ETA_MASSIMA_MS = 60 * 60 * 1000

export class Agente {
  private config: Config
  private eseguibile: Eseguibile
  private sessioni: ArchivioSessione
  private processo: ProcessoClaude
  private inCorso: AbortController | null = null
  private impostazioni: ArchivioImpostazioni
  /** le istruzioni sono cambiate: Claude Code va riavviato appena è libero */
  private daRiavviare = false
  readonly db: Database
  readonly gestore: GestorePermessi
  private mcp?: { url: string; chiave: string }

  constructor(config: Config, eseguibile: Eseguibile, servizi: Servizi = {}) {
    this.config = config
    this.eseguibile = eseguibile
    this.db = servizi.db ?? new Database(path.join(config.cartellaDati, 'ambrogio.sqlite'))
    this.gestore = servizi.gestore ?? new GestorePermessi(this.db)
    this.mcp = servizi.mcp
    this.sessioni = new ArchivioSessione(config.cartellaDati)
    this.impostazioni = new ArchivioImpostazioni(config.cartellaDati)
    this.processo = new ProcessoClaude(this.avvio())
  }

  /** Le cose più importanti che Ambrogio ricorda, da dare a Claude all'inizio di ogni conversazione */
  private sintesiMemoria() {
    const righe = this.db.cercaMemorie('', undefined, 40).map((m) => `- (${m.tipo}) ${m.titolo}: ${m.contenuto}`)
    let testo = ''
    for (const r of righe) {
      if (testo.length + r.length > 3500) break
      testo += r + '\n'
    }
    return testo.trim()
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
      istruzioni: istruzioni(this.config.appellativo, this.impostazioni.attuali.personalita, this.sintesiMemoria()),
      strumenti: STRUMENTI_INTEGRATI,
      modello: this.config.claude.modello || undefined,
      effort: this.config.claude.effort || undefined,
      consentiApiAConsumo: this.config.claude.consentiApiAConsumo,
      onSessioneAperta: () => this.sessioni.segnaAvviata(),
      mcp: this.mcp ? { ...this.mcp, strumenti: STRUMENTI.map((s) => s.nome) } : undefined,
    }
  }

  /** i messaggi della conversazione attuale (per mostrarli dopo un riavvio) */
  messaggi() {
    return this.db.messaggi(this.sessioni.attuale.id)
  }

  get personalita() {
    return this.impostazioni.attuali.personalita
  }

  elencoPersonalita() {
    return Object.entries(PERSONALITA).map(([id, p]) => ({ id, nome: p.nome, descrizione: p.descrizione }))
  }

  /** Cambia il carattere di Ambrogio. La conversazione continua: cambia solo il modo di parlare. */
  impostaPersonalita(id: IdPersonalita) {
    if (id === this.personalita) return
    this.impostazioni.aggiorna({ personalita: id })
    if (this.inCorso) this.daRiavviare = true
    else this.riavvia()
  }

  private riavvia() {
    this.daRiavviare = false
    this.processo.spegni()
    this.prepara()
  }

  /** Accende Claude Code in anticipo, così il primo messaggio è più rapido. */
  prepara() {
    if (this.modalita === 'veloce' && !this.processo.acceso) this.processo.accendi(this.avvio())
  }

  interrompi() {
    this.gestore.negaTutte()
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
      console.warn('[ambrogio] la modalità veloce non funziona su questo PC: uso un avvio di Claude Code per ogni messaggio')
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
    let risposta = ''
    const sessioneTurno = this.sessioni.attuale.id
    this.db.salvaMessaggio(sessioneTurno, 'user', messaggio)
    this.db.registra('messaggio', `Richiesta: ${messaggio.length > 90 ? messaggio.slice(0, 90) + '…' : messaggio}`)

    // domande elementari (ora, data, saluti…): risposta immediata, senza Claude
    const pronta = rispostaPronta(messaggio, { appellativo: this.config.appellativo })
    if (pronta) {
      if (this.inCorso === controller) this.inCorso = null
      this.db.salvaMessaggio(sessioneTurno, 'assistant', pronta)
      this.db.registra('messaggio', 'Risposta pronta (senza Claude)')
      onEvento({ tipo: 'testo', testo: pronta })
      onEvento({ tipo: 'fine', sessione: sessioneTurno, durataMs: Date.now() - inizio, strumentiUsati: [] })
      return 'ok' as const
    }
    const inoltra = (e: EventoAgente) => {
      if (e.tipo === 'stato' && e.stato === 'WORKING' && e.strumento) {
        if (!strumentiUsati.includes(e.strumento)) strumentiUsati.push(e.strumento)
        // gli strumenti integrati (ricerca web) li registra l'agente; quelli di Ambrogio il gestore dei permessi
        if (!e.strumento.startsWith('mcp__') && STRUMENTI.every((s) => s.nome !== e.strumento))
          this.db.registra('azione', e.descrizione ?? e.strumento)
      }
      if (e.tipo === 'testo') risposta += e.testo
      if (e.tipo === 'errore') this.db.registra('errore', e.messaggio)
      onEvento(e)
    }
    // le richieste di permesso degli strumenti arrivano alla conversazione in corso
    this.gestore.notifica = inoltra
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

    if (this.inCorso === controller) {
      this.inCorso = null
      this.gestore.notifica = () => {}
    }
    if (risposta.trim()) this.db.salvaMessaggio(sessioneTurno, 'assistant', risposta.trim())
    if (esito === 'ok') {
      this.db.registra('messaggio', 'Risposta data')
      if (strumentiUsati.length) inoltra({ tipo: 'stato', stato: 'SUCCESS' })
      inoltra({ tipo: 'fine', sessione: this.sessioni.attuale.id, durataMs: Date.now() - inizio, strumentiUsati })
    } else if (esito === 'sessione-mancante') {
      inoltra({ tipo: 'errore', messaggio: 'Non riesco ad aprire la conversazione con Claude Code. Riprova.' })
    }
    // dopo un'interruzione Claude Code è stato chiuso: lo si riaccende subito per il prossimo messaggio
    if (this.daRiavviare) this.riavvia()
    else if (esito === 'interrotto') this.prepara()
    return esito
  }
}
