import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

// Il telefono di Ambrogio. Il servizio vero (Linphone) gira in Ubuntu dentro Windows (telefono/servizio.py):
// qui lo si accende, gli si mandano comandi (una riga JSON) e si ascoltano i suoi eventi (righe "@@AMBROGIO {…}").

export type EventoTelefono = { evento: string; [chiave: string]: unknown }

/** C:\Users\… → /mnt/c/Users/… (i file passano tra Windows e Ubuntu) */
export function percorsoWsl(p: string) {
  const m = /^([A-Za-z]):[\\/](.*)$/.exec(p)
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}` : p
}

/** /mnt/c/Users/… → C:\Users\… (solo su Windows) */
export function percorsoWindows(p: string, piattaforma = process.platform) {
  const m = /^\/mnt\/([a-z])\/(.*)$/.exec(p)
  return m && piattaforma === 'win32' ? `${m[1].toUpperCase()}:\\${m[2].replace(/\//g, '\\')}` : p
}

type Opzioni = {
  cartellaAmbrogio: string
  distro: string
  /** comando al posto del servizio vero (test) */
  comando?: string
}

export class Telefono {
  private opz: Opzioni
  private processo: ChildProcess | null = null
  private ascoltatori = new Set<(e: EventoTelefono) => void>()
  /** ultime righe del servizio (per capire i problemi) */
  diario: string[] = []
  stato: 'spento' | 'avvio' | 'pronto' | 'errore' = 'spento'
  errore = ''

  constructor(opz: Opzioni) {
    this.opz = opz
  }

  private annota(riga: string) {
    this.diario.push(riga)
    if (this.diario.length > 60) this.diario.splice(0, this.diario.length - 60)
  }

  private accendi() {
    const su = process.platform === 'win32' && !this.opz.comando
    const [cmd, ...args] = this.opz.comando
      ? this.opz.comando.split(' ')
      : su
        ? ['wsl.exe', '-d', this.opz.distro, '--cd', percorsoWsl(this.opz.cartellaAmbrogio), '--', 'bash', 'telefono/servizio.sh']
        : ['bash', path.join(this.opz.cartellaAmbrogio, 'telefono', 'servizio.sh')]
    const p = spawn(cmd, args, { cwd: this.opz.cartellaAmbrogio, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    this.processo = p
    this.stato = 'avvio'
    this.errore = ''
    const leggi = (flusso: NodeJS.ReadableStream) =>
      readline.createInterface({ input: flusso }).on('line', (riga) => {
        const i = riga.indexOf('@@AMBROGIO ')
        if (i < 0) return this.annota(riga)
        try {
          const e = JSON.parse(riga.slice(i + 11)) as EventoTelefono
          if (e.evento === 'pronto') this.stato = 'pronto'
          if (e.evento === 'errore' && this.stato === 'avvio') {
            this.stato = 'errore'
            this.errore = String(e.messaggio ?? 'errore')
          }
          for (const a of this.ascoltatori) a(e)
        } catch {
          this.annota(riga)
        }
      })
    leggi(p.stdout!)
    leggi(p.stderr!)
    p.on('error', (err) => {
      this.stato = 'errore'
      this.errore = `Non riesco ad accendere il telefono: ${err.message}`
      for (const a of this.ascoltatori) a({ evento: 'errore', messaggio: this.errore })
    })
    p.on('exit', (codice) => {
      if (this.processo === p) this.processo = null
      if (this.stato !== 'errore') this.stato = 'spento'
      for (const a of this.ascoltatori) a({ evento: 'spento', codice })
    })
  }

  /** accende il servizio (se serve) e aspetta che sia collegato a Linphone */
  async pronto(timeoutMs = 90_000) {
    if (this.stato === 'pronto' && this.processo) return
    if (!this.processo) this.accendi()
    const e = await this.attendi((e) => ['pronto', 'errore', 'spento'].includes(e.evento), timeoutMs)
    if (e.evento !== 'pronto') {
      const motivo = e.evento === 'timeout' ? 'il telefono non risponde' : String(e.messaggio ?? this.errore ?? 'spento')
      this.spegni()
      throw new Error(`Telefono non disponibile: ${motivo}`)
    }
  }

  invia(comando: Record<string, unknown>) {
    this.processo?.stdin?.write(JSON.stringify(comando) + '\n')
  }

  /** il prossimo evento che soddisfa la condizione (o {evento: 'timeout'}) */
  attendi(condizione: (e: EventoTelefono) => boolean, timeoutMs: number): Promise<EventoTelefono> {
    return new Promise((risolvi) => {
      const fine = (e: EventoTelefono) => {
        clearTimeout(t)
        this.ascoltatori.delete(ascolta)
        risolvi(e)
      }
      const ascolta = (e: EventoTelefono) => {
        if (condizione(e)) fine(e)
      }
      const t = setTimeout(() => fine({ evento: 'timeout' }), timeoutMs)
      this.ascoltatori.add(ascolta)
    })
  }

  ascolta(f: (e: EventoTelefono) => void) {
    this.ascoltatori.add(f)
    return () => this.ascoltatori.delete(f)
  }

  spegni() {
    if (!this.processo) return
    this.invia({ cmd: 'esci' })
    const p = this.processo
    setTimeout(() => p.exitCode === null && p.kill(), 3000).unref()
  }
}

export type Battuta = { chi: 'ambrogio' | 'pietro'; testo: string }

export type Dipendenze = {
  telefono: Telefono
  /** il testo detto da Ambrogio, in WAV */
  sintetizza: (testo: string) => Promise<Buffer>
  /** quello che ha detto Pietro (WAV) in testo */
  trascrivi: (audio: Buffer) => Promise<string>
  /** la risposta di Ambrogio (Claude) */
  rispondi: (richiesta: string) => Promise<string>
  cartella: string
  annota?: (testo: string) => void
}

export type EsitoTelefonata = { esito: 'conclusa' | 'nessuna-risposta' | 'errore'; motivo?: string; conversazione: Battuta[] }

const RIATTACCA = /\[RIATTACCA\]/i

/**
 * Una telefonata a botta e risposta: Ambrogio chiama, dice la frase d'apertura e poi ascolta, capisce e risponde
 * finché uno dei due saluta (o Pietro riattacca).
 */
export class Telefonata {
  private d: Dipendenze
  conversazione: Battuta[] = []
  private numero = 0
  private finita = false

  constructor(d: Dipendenze) {
    this.d = d
  }

  private async parla(testo: string) {
    if (this.finita) return
    this.conversazione.push({ chi: 'ambrogio', testo })
    const audio = await this.d.sintetizza(testo)
    fs.mkdirSync(this.d.cartella, { recursive: true })
    const file = path.join(this.d.cartella, `ambrogio-${Date.now()}-${++this.numero}.wav`)
    fs.writeFileSync(file, audio)
    const id = this.numero
    this.d.telefono.invia({ cmd: 'parla', file: process.platform === 'win32' ? percorsoWsl(file) : file, id })
    const e = await this.d.telefono.attendi((e) => (e.evento === 'parlato' && e.id === id) || e.evento === 'fine', 120_000)
    if (e.evento === 'fine') {
      this.finita = true
      this.d.annota?.(`Telefonata chiusa mentre Ambrogio parlava (${String(e.motivo ?? '')})`)
    }
    if (e.evento === 'parlato' && e.errore) this.d.annota?.(`Telefono: non riesco a far sentire la voce (${String(e.errore)})`)
  }

  async esegui({ motivo, apertura, nome }: { motivo: string; apertura: string; nome: string }): Promise<EsitoTelefonata> {
    const { telefono } = this.d
    try {
      await telefono.pronto()
    } catch (err) {
      return { esito: 'errore', motivo: (err as Error).message, conversazione: [] }
    }
    // ogni "fine" chiude la telefonata, qualunque cosa si stia facendo
    const smetti = telefono.ascolta((e) => {
      if (e.evento === 'fine') {
        this.finita = true
        this.d.annota?.(`Telefonata chiusa: ${String(e.motivo ?? '')}`)
      }
      if (e.evento === 'errore') this.d.annota?.(`Telefono: ${String(e.messaggio ?? '')}`)
      if (e.evento === 'formato') this.d.annota?.(`Telefono: ascolto la chiamata a ${String(e.frequenza)} Hz`)
    })
    try {
      telefono.invia({ cmd: 'chiama' })
      const risposta = await telefono.attendi((e) => ['risposto', 'fine', 'errore'].includes(e.evento), 75_000)
      if (risposta.evento !== 'risposto') {
        if (risposta.evento === 'timeout') telefono.invia({ cmd: 'riattacca' })
        return { esito: 'nessuna-risposta', motivo: String(risposta.motivo ?? risposta.messaggio ?? risposta.evento), conversazione: [] }
      }
      this.d.annota?.('Telefonata: Pietro ha risposto')
      await this.parla(apertura)

      let silenzi = 0
      let primo = true
      for (let turni = 0; turni < 40 && !this.finita; turni++) {
        const e = await telefono.attendi((e) => e.evento === 'frase' || e.evento === 'fine', 15_000)
        if (e.evento === 'fine' || this.finita) break
        if (e.evento === 'timeout') {
          if (silenzi++ === 0) {
            await this.parla(`Pronto? ${nome}, mi sente?`)
            continue
          }
          await this.parla('Va bene, la richiamo più tardi. Arrivederci!')
          break
        }
        silenzi = 0
        let detto = ''
        try {
          detto = (await this.d.trascrivi(fs.readFileSync(percorsoWindows(String(e.file))))).trim()
        } catch (err) {
          this.d.annota?.(`Telefonata: non ho capito (${(err as Error).message})`)
        }
        if (!detto) {
          await this.parla('Scusi, non ho capito bene: può ripetere?')
          continue
        }
        this.conversazione.push({ chi: 'pietro', testo: detto })
        const richiesta = primo
          ? `[TELEFONATA] Sei al telefono con ${nome}: l'hai chiamato tu. Motivo della chiamata: ${motivo}\n` +
            `Gli hai detto: «${apertura}». Lui risponde: «${detto}».\n` +
            `Rispondi come in una telefonata vera: una o due frasi brevi, niente elenchi, simboli o emoji. ` +
            `Quando la conversazione è finita, saluta e scrivi in fondo [RIATTACCA].`
          : `[TELEFONATA] ${nome} al telefono dice: «${detto}». (Frasi brevi; [RIATTACCA] in fondo quando avete finito.)`
        primo = false
        const testo = await this.d.rispondi(richiesta)
        const chiudi = RIATTACCA.test(testo)
        const pulito = testo.replace(RIATTACCA, '').replace(/[*_#`>]/g, '').trim()
        if (pulito) await this.parla(pulito)
        if (chiudi) break
      }
      if (!this.finita) {
        telefono.invia({ cmd: 'riattacca' })
        await telefono.attendi((e) => e.evento === 'fine', 8000)
      }
      return { esito: 'conclusa', conversazione: this.conversazione }
    } catch (err) {
      telefono.invia({ cmd: 'riattacca' })
      return { esito: 'errore', motivo: (err as Error).message, conversazione: this.conversazione }
    } finally {
      smetti()
    }
  }
}
