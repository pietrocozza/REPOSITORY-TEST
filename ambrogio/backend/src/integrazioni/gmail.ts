import type { AccessoGoogle } from './google.ts'

// Gmail: leggere, cercare, aprire, preparare bozze e inviare email (con l'accesso ufficiale di Google).
// L'invio passa SEMPRE dal gestore dei permessi (livello 2: serve il sì di Pietro).

export type EmailBreve = { id: string; thread: string; da: string; oggetto: string; data: string; anteprima: string; nonLetta: boolean }
export type EmailCompleta = EmailBreve & { a: string; testo: string; messageId: string }

type Parte = { mimeType?: string; filename?: string; body?: { data?: string; size?: number }; parts?: Parte[]; headers?: { name: string; value: string }[] }
type Messaggio = { id: string; threadId: string; snippet?: string; labelIds?: string[]; internalDate?: string; payload?: Parte }

const intestazione = (m: Messaggio, nome: string) => m.payload?.headers?.find((h) => h.name.toLowerCase() === nome.toLowerCase())?.value ?? ''
const decodifica = (dati: string) => Buffer.from(dati.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
const daEntita = (t: string) =>
  t
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

/** Da HTML a testo semplice (per le email che non hanno una versione solo testo) */
export function htmlInTesto(html: string) {
  return daEntita(
    html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

/** Il testo leggibile di un'email: la parte "solo testo" se c'è, altrimenti l'HTML ripulito */
export function testoDelMessaggio(p: Parte | undefined): string {
  if (!p) return ''
  const cerca = (parte: Parte, tipo: string): string | null => {
    if (parte.mimeType === tipo && parte.body?.data && !parte.filename) return decodifica(parte.body.data)
    for (const figlia of parte.parts ?? []) {
      const t = cerca(figlia, tipo)
      if (t) return t
    }
    return null
  }
  const semplice = cerca(p, 'text/plain')
  if (semplice) return semplice.trim()
  const html = cerca(p, 'text/html')
  return html ? htmlInTesto(html) : ''
}

/** Una parola nell'intestazione con lettere accentate va codificata (RFC 2047) */
const intestazioneUtf8 = (t: string) => (/^[\x20-\x7e]*$/.test(t) ? t : `=?UTF-8?B?${Buffer.from(t).toString('base64')}?=`)

/** Costruisce l'email nel formato standard (RFC 2822) che Gmail vuole */
export function componiEmail(e: { a: string; oggetto: string; testo: string; inRispostaA?: string }) {
  const righe = [
    `To: ${e.a}`,
    `Subject: ${intestazioneUtf8(e.oggetto)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ]
  if (e.inRispostaA) righe.push(`In-Reply-To: ${e.inRispostaA}`, `References: ${e.inRispostaA}`)
  const corpo = Buffer.from(e.testo.replace(/\r?\n/g, '\r\n')).toString('base64').replace(/(.{76})/g, '$1\r\n')
  const grezza = `${righe.join('\r\n')}\r\n\r\n${corpo}`
  return Buffer.from(grezza).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export class Gmail {
  private google: AccessoGoogle

  constructor(google: AccessoGoogle) {
    this.google = google
  }

  get collegato() {
    return this.google.collegato
  }

  private breve(m: Messaggio): EmailBreve {
    return {
      id: m.id,
      thread: m.threadId,
      da: intestazione(m, 'From'),
      oggetto: intestazione(m, 'Subject') || '(senza oggetto)',
      data: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : intestazione(m, 'Date'),
      anteprima: daEntita(m.snippet ?? ''),
      nonLetta: Boolean(m.labelIds?.includes('UNREAD')),
    }
  }

  /** Le email più recenti, oppure quelle che rispondono a una ricerca (stessa sintassi della casella di Gmail) */
  async elenco(ricerca = 'in:inbox', quante = 10): Promise<EmailBreve[]> {
    const p = new URLSearchParams({ q: ricerca, maxResults: String(Math.min(25, Math.max(1, quante))) })
    const lista = (await this.google.chiama(`/gmail/v1/users/me/messages?${p}`)) as { messages?: { id: string }[] }
    const meta = 'format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date'
    const messaggi = await Promise.all(
      (lista.messages ?? []).map((m) => this.google.chiama(`/gmail/v1/users/me/messages/${m.id}?${meta}`) as Promise<Messaggio>),
    )
    return messaggi.map((m) => this.breve(m))
  }

  /** Un'email intera, con il testo */
  async apri(id: string): Promise<EmailCompleta> {
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) throw new Error('Id email non valido.')
    const m = (await this.google.chiama(`/gmail/v1/users/me/messages/${id}?format=full`)) as Messaggio
    return { ...this.breve(m), a: intestazione(m, 'To'), messageId: intestazione(m, 'Message-ID'), testo: testoDelMessaggio(m.payload).slice(0, 12000) }
  }

  /** Prepara i dati per una risposta nella stessa conversazione */
  private async risposta(id: string | undefined, oggetto: string) {
    if (!id) return { oggetto, thread: undefined, inRispostaA: undefined }
    const originale = await this.apri(id)
    return {
      oggetto: oggetto || (/^re:/i.test(originale.oggetto) ? originale.oggetto : `Re: ${originale.oggetto}`),
      thread: originale.thread,
      inRispostaA: originale.messageId || undefined,
    }
  }

  async bozza(e: { a: string; oggetto: string; testo: string; rispondiA?: string }) {
    const r = await this.risposta(e.rispondiA, e.oggetto)
    const raw = componiEmail({ a: e.a, oggetto: r.oggetto, testo: e.testo, inRispostaA: r.inRispostaA })
    const d = (await this.google.chiama('/gmail/v1/users/me/drafts', { method: 'POST', body: JSON.stringify({ message: { raw, threadId: r.thread } }) })) as { id: string }
    return d.id
  }

  async invia(e: { a: string; oggetto: string; testo: string; rispondiA?: string }) {
    const r = await this.risposta(e.rispondiA, e.oggetto)
    const raw = componiEmail({ a: e.a, oggetto: r.oggetto, testo: e.testo, inRispostaA: r.inRispostaA })
    const m = (await this.google.chiama('/gmail/v1/users/me/messages/send', { method: 'POST', body: JSON.stringify({ raw, threadId: r.thread }) })) as { id: string }
    return m.id
  }
}
