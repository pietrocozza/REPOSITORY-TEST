import type { Database } from '../database/db.ts'
import type { EventoAgente } from '../agent/eventi.ts'
import { strumento, validaArgomenti, type Argomenti } from '../strumenti/catalogo.ts'

// Il gestore dei permessi: ogni richiesta di Claude di usare uno strumento passa da qui.
//  livello 1 → eseguito subito
//  livello 2 → serve il sì di Pietro (oppure un "consenti sempre" dato in precedenza)
//  livello 3 → serve SEMPRE il sì esplicito di Pietro, nessuna eccezione
// Tutto finisce nel registro delle attività.

export type EsitoStrumento = { testo: string; errore: boolean }

const ATTESA_PREDEFINITA_MS = 10 * 60 * 1000

export class GestorePermessi {
  private db: Database
  private attese = new Map<number, (esito: 'concessa' | 'negata' | 'scaduta') => void>()
  private attesaMs: number
  /** dove mandare gli eventi (la conversazione in corso, se c'è) */
  notifica: (e: EventoAgente) => void = () => {}

  constructor(db: Database, opzioni: { attesaMs?: number } = {}) {
    this.db = db
    this.attesaMs = opzioni.attesaMs ?? ATTESA_PREDEFINITA_MS
    db.scadiAutorizzazioniVecchie()
  }

  async esegui(nome: string, argomenti: unknown): Promise<EsitoStrumento> {
    const s = strumento(nome)
    if (!s) return { testo: `Strumento sconosciuto: ${nome}`, errore: true }
    const problema = validaArgomenti(s, argomenti)
    if (problema) {
      this.db.registra('errore', `Richiesta non valida per ${nome}: ${problema}`)
      return { testo: problema, errore: true }
    }
    const a = argomenti as Argomenti
    const riassunto = s.riassunto(a, this.db)
    this.notifica({ tipo: 'stato', stato: 'WORKING', strumento: nome, descrizione: riassunto })

    const serveConferma = s.livello === 3 || (s.livello === 2 && !this.db.permessoPermanente(nome))
    if (serveConferma) {
      const aut = this.db.creaAutorizzazione(nome, riassunto, a, s.livello)
      this.db.registra('autorizzazione', `Richiesta autorizzazione: ${riassunto}`, { id: aut.id, livello: s.livello })
      this.notifica({ tipo: 'stato', stato: 'WAITING_FOR_CONFIRMATION', strumento: nome, descrizione: riassunto })
      this.notifica({ tipo: 'conferma', id: aut.id, strumento: nome, descrizione: riassunto, livello: s.livello as 2 | 3 })

      const esito = await this.attendi(aut.id)
      this.notifica({ tipo: 'conferma-chiusa', id: aut.id, esito })
      if (esito !== 'concessa') {
        this.db.registra('autorizzazione', `Autorizzazione ${esito === 'negata' ? 'negata' : 'scaduta'}: ${riassunto}`, { id: aut.id })
        return {
          testo:
            esito === 'negata'
              ? "L'utente NON ha autorizzato questa azione. Non eseguirla e non riprovare, a meno che non te lo chieda lui."
              : "L'utente non ha risposto alla richiesta di autorizzazione: l'azione non è stata eseguita.",
          errore: false,
        }
      }
      this.db.registra('autorizzazione', `Autorizzazione ricevuta: ${riassunto}`, { id: aut.id })
      this.notifica({ tipo: 'stato', stato: 'WORKING', strumento: nome, descrizione: riassunto })
    }

    try {
      const testo = await s.esegui(a, this.db)
      this.db.registra('azione', riassunto, { strumento: nome, argomenti: a })
      return { testo, errore: false }
    } catch (err) {
      this.db.registra('errore', `Errore durante «${riassunto}»: ${(err as Error).message}`)
      return { testo: `Errore: ${(err as Error).message}`, errore: true }
    }
  }

  private attendi(id: number): Promise<'concessa' | 'negata' | 'scaduta'> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.attese.delete(id)
        this.db.decidiAutorizzazione(id, 'scaduta')
        resolve('scaduta')
      }, this.attesaMs)
      this.attese.set(id, (esito) => {
        clearTimeout(timer)
        this.attese.delete(id)
        resolve(esito)
      })
    })
  }

  /** La risposta di Pietro dall'interfaccia. "sempre" vale solo per il livello 2. */
  decidi(id: number, concedi: boolean, sempre = false): boolean {
    const aut = this.db.autorizzazione(id)
    if (!aut || aut.stato !== 'in_attesa') return false
    this.db.decidiAutorizzazione(id, concedi ? 'concessa' : 'negata')
    if (concedi && sempre && aut.livello === 2) {
      this.db.concediPermanente(aut.strumento)
      this.db.registra('autorizzazione', `Permesso permanente concesso per: ${aut.strumento}`)
    }
    this.attese.get(id)?.(concedi ? 'concessa' : 'negata')
    return true
  }

  /** Se la conversazione viene interrotta, le richieste aperte vengono negate */
  negaTutte() {
    for (const id of [...this.attese.keys()]) this.decidi(id, false)
  }
}
