import { SEGNALE_ERRORE } from '@/lib/protocollo'

// Come l'interfaccia chiede una risposta: riceve la conversazione e restituisce il testo
// un pezzo alla volta. L'app usa il server (/api/chat); la demo online usa un altro canale.
export type MessaggioChat = { role: 'user' | 'assistant'; content: string }
export type Chiedi = (
  messaggi: MessaggioChat[],
  opzioni: { onTesto: (pezzo: string) => void; signal: AbortSignal },
) => Promise<void>

export const chiediAlServer: Chiedi = async (messaggi, { onTesto, signal }) => {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaggi }),
    signal,
  })
  if (!res.ok || !res.body) {
    const dati = await res.json().catch(() => null)
    throw new Error(dati?.errore ?? `Il server ha risposto con errore ${res.status}.`)
  }

  const lettore = res.body.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await lettore.read()
    if (done) break
    const pezzo = decoder.decode(value, { stream: true })
    const posErrore = pezzo.indexOf(SEGNALE_ERRORE)
    if (posErrore >= 0) {
      if (posErrore > 0) onTesto(pezzo.slice(0, posErrore))
      throw new Error(pezzo.slice(posErrore + 1) + decoder.decode() || 'Errore del server.')
    }
    if (pezzo) onTesto(pezzo)
  }
}
