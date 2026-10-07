import { createHash, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// Accesso a Google (Gmail, e in futuro Calendar) con il metodo ufficiale OAuth: si apre la pagina di Google,
// Pietro entra con il suo account e preme «Consenti». La password non passa mai da Ambrogio.
// Il permesso ottenuto (token) resta SOLO sul PC, in data/google-token.json, e si può revocare in ogni momento.
// Le credenziali dell'app Google (client id e secret, creati da Pietro su Google Cloud) stanno nel file .env.

export const AMBITI_GOOGLE = [
  'https://www.googleapis.com/auth/gmail.readonly', // leggere e cercare le email
  'https://www.googleapis.com/auth/gmail.compose', // preparare bozze e inviare (l'invio chiede sempre il permesso)
]

type Token = { refresh_token: string; access_token?: string; scadenza?: number; email?: string; ambiti?: string }
type Opzioni = {
  clientId: string
  clientSecret: string
  /** indirizzo a cui Google rimanda dopo il «Consenti» (il backend di Ambrogio su questo PC) */
  ritorno: string
  cartellaDati: string
  /** email da suggerire nella pagina di Google */
  suggerimento?: string
  /** solo per i test */
  urlAuth?: string
  urlToken?: string
  urlApi?: string
}

export class ErroreGoogle extends Error {
  readonly tipo: 'non-configurato' | 'non-collegato' | 'scaduto' | 'errore'
  constructor(tipo: ErroreGoogle['tipo'], messaggio: string) {
    super(messaggio)
    this.tipo = tipo
  }
}

const base64url = (b: Buffer) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export class AccessoGoogle {
  private opz: Opzioni
  private file: string
  private token: Token | null = null
  /** collegamenti in corso: stato → verificatore (scadono dopo 10 minuti) */
  private inAttesa = new Map<string, { verificatore: string; quando: number }>()

  constructor(opz: Opzioni) {
    this.opz = opz
    this.file = path.join(opz.cartellaDati, 'google-token.json')
    try {
      this.token = JSON.parse(fs.readFileSync(this.file, 'utf8'))
      if (!this.token?.refresh_token) this.token = null
    } catch {
      this.token = null
    }
  }

  get configurato() {
    return Boolean(this.opz.clientId && this.opz.clientSecret)
  }

  get collegato() {
    return Boolean(this.token?.refresh_token)
  }

  stato() {
    return { configurato: this.configurato, collegato: this.collegato, email: this.token?.email ?? null }
  }

  private salva() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true })
    fs.writeFileSync(this.file, JSON.stringify(this.token, null, 2), { mode: 0o600 })
  }

  /** L'indirizzo della pagina di Google dove Pietro dà il permesso (con PKCE e stato anti-falsificazione) */
  indirizzoConsenso() {
    if (!this.configurato) throw new ErroreGoogle('non-configurato', 'Mancano le credenziali Google nel file .env.')
    const stato = base64url(randomBytes(24))
    const verificatore = base64url(randomBytes(48))
    const sfida = base64url(createHash('sha256').update(verificatore).digest())
    const ora = Date.now()
    for (const [k, v] of this.inAttesa) if (ora - v.quando > 10 * 60 * 1000) this.inAttesa.delete(k)
    this.inAttesa.set(stato, { verificatore, quando: ora })
    const p = new URLSearchParams({
      client_id: this.opz.clientId,
      redirect_uri: this.opz.ritorno,
      response_type: 'code',
      scope: AMBITI_GOOGLE.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: stato,
      code_challenge: sfida,
      code_challenge_method: 'S256',
    })
    if (this.opz.suggerimento) p.set('login_hint', this.opz.suggerimento)
    return `${this.opz.urlAuth ?? 'https://accounts.google.com/o/oauth2/v2/auth'}?${p}`
  }

  /** Google rimanda qui dopo il «Consenti»: si scambia il codice con il permesso e lo si salva */
  async completa(codice: string, stato: string) {
    const attesa = this.inAttesa.get(stato)
    this.inAttesa.delete(stato)
    if (!attesa || Date.now() - attesa.quando > 10 * 60 * 1000) throw new ErroreGoogle('errore', 'Collegamento scaduto o non valido: riprova da Ambrogio.')
    const dati = await this.chiediToken({
      grant_type: 'authorization_code',
      code: codice,
      redirect_uri: this.opz.ritorno,
      code_verifier: attesa.verificatore,
    })
    if (!dati.refresh_token) throw new ErroreGoogle('errore', 'Google non ha dato un permesso duraturo: riprova.')
    this.token = {
      refresh_token: dati.refresh_token,
      access_token: dati.access_token,
      scadenza: Date.now() + (dati.expires_in ?? 3600) * 1000,
      ambiti: dati.scope,
    }
    // di quale account si tratta (per mostrarlo nell'interfaccia)
    try {
      const profilo = (await this.chiama('/gmail/v1/users/me/profile')) as { emailAddress?: string }
      this.token.email = profilo.emailAddress
    } catch {
      // non indispensabile
    }
    this.salva()
    return this.token.email ?? null
  }

  private async chiediToken(campi: Record<string, string>) {
    const res = await fetch(this.opz.urlToken ?? 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.opz.clientId, client_secret: this.opz.clientSecret, ...campi }),
      signal: AbortSignal.timeout(20_000),
    })
    const dati = (await res.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error?: string }
    if (!res.ok || !dati.access_token) {
      if (dati.error === 'invalid_grant') {
        // permesso revocato o scaduto: va ridato
        this.token = null
        try {
          fs.rmSync(this.file)
        } catch {
          // già assente
        }
        throw new ErroreGoogle('scaduto', 'Il permesso di Google non vale più: ricollega Gmail dal menu Email.')
      }
      throw new ErroreGoogle('errore', `Google non ha accettato la richiesta (${dati.error ?? res.status}).`)
    }
    return dati
  }

  /** Un "lasciapassare" valido per le API di Google (si rinnova da solo ogni ora) */
  private async lasciapassare() {
    if (!this.token) throw new ErroreGoogle('non-collegato', 'Gmail non è collegato: collegalo dal menu Email di Ambrogio.')
    if (this.token.access_token && (this.token.scadenza ?? 0) > Date.now() + 60_000) return this.token.access_token
    const dati = await this.chiediToken({ grant_type: 'refresh_token', refresh_token: this.token.refresh_token })
    this.token.access_token = dati.access_token
    this.token.scadenza = Date.now() + (dati.expires_in ?? 3600) * 1000
    this.salva()
    return dati.access_token as string
  }

  /** Chiamata alle API di Google (percorso relativo, es. /gmail/v1/users/me/messages) */
  async chiama(percorso: string, init: RequestInit = {}): Promise<unknown> {
    const fai = async () =>
      fetch(`${this.opz.urlApi ?? 'https://gmail.googleapis.com'}${percorso}`, {
        ...init,
        headers: { Authorization: `Bearer ${await this.lasciapassare()}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(30_000),
      })
    let res = await fai()
    if (res.status === 401 && this.token) {
      // lasciapassare rifiutato: se ne prende uno nuovo e si riprova una volta
      this.token.access_token = undefined
      res = await fai()
    }
    if (!res.ok) {
      const dettaglio = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new ErroreGoogle('errore', `Gmail ha risposto con un errore (${res.status}${dettaglio?.error?.message ? `: ${dettaglio.error.message}` : ''}).`)
    }
    return res.status === 204 ? null : res.json()
  }

  /** Scollega Gmail: revoca il permesso presso Google e cancella il file dal PC */
  async scollega() {
    const t = this.token
    this.token = null
    try {
      fs.rmSync(this.file)
    } catch {
      // già assente
    }
    if (t?.refresh_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(t.refresh_token)}`, { method: 'POST', signal: AbortSignal.timeout(10_000) }).catch(() => {})
    }
  }
}
