import Anthropic from '@anthropic-ai/sdk'
import { SEGNALE_ERRORE } from '@/lib/protocollo'

// Il cervello di Jarvis: riceve la conversazione dal browser, la passa a Claude
// e rimanda indietro la risposta un pezzetto alla volta (streaming), così la voce
// può iniziare a parlare prima che la risposta sia finita.
//
// La chiave API resta qui sul server (in .env.local): il browser non la vede mai.

const MODELLO = 'claude-opus-5-5'
const MAX_MESSAGGI = 30
const MAX_CARATTERI = 4000

type Messaggio = { role: 'user' | 'assistant'; content: string }

function istruzioni(appellativo: string) {
  const adesso = new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Rome',
  }).format(new Date())

  return `Sei J.A.R.V.I.S., l'assistente personale con intelligenza artificiale. Parli in italiano con il tuo utente, che chiami "${appellativo}".

Carattere: calmo, preciso, educatissimo, con un umorismo asciutto da maggiordomo inglese. Sei leale e diretto: se qualcosa è una cattiva idea lo dici con garbo.

Le tue risposte vengono lette ad alta voce da una sintesi vocale, quindi:
- di norma rispondi in una o due frasi; vai più a fondo solo se te lo chiedono
- niente markdown, elenchi puntati, titoli, tabelle, emoji o link: solo frasi parlate
- scrivi i numeri e le sigle in modo che suonino naturali detti a voce

Per meteo, notizie, risultati sportivi, prezzi e qualunque cosa recente usa la ricerca web, poi riassumi in poche parole senza citare le fonti a voce.

Data e ora attuali: ${adesso} (ora italiana).`
}

function leggiMessaggi(body: unknown): Messaggio[] | null {
  if (!body || typeof body !== 'object' || !('messaggi' in body)) return null
  const lista = (body as { messaggi: unknown }).messaggi
  if (!Array.isArray(lista) || lista.length === 0) return null

  const messaggi: Messaggio[] = []
  for (const m of lista.slice(-MAX_MESSAGGI)) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as Record<string, unknown>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const testo = content.trim().slice(0, MAX_CARATTERI)
    if (testo) messaggi.push({ role, content: testo })
  }
  // La conversazione deve iniziare e finire con un messaggio dell'utente
  while (messaggi.length && messaggi[0].role !== 'user') messaggi.shift()
  if (!messaggi.length || messaggi[messaggi.length - 1].role !== 'user') return null
  return messaggi
}

function spiegaErrore(err: unknown) {
  if (err instanceof Anthropic.AuthenticationError) return 'La chiave API non è valida. Controlla il file .env.local.'
  if (err instanceof Anthropic.PermissionDeniedError) return 'La chiave API non ha i permessi per questo modello.'
  if (err instanceof Anthropic.RateLimitError) return 'Troppe richieste in poco tempo, o credito esaurito. Riprova tra poco.'
  if (err instanceof Anthropic.BadRequestError) return `Richiesta rifiutata: ${err.message}`
  if (err instanceof Anthropic.APIConnectionError) return 'Non riesco a raggiungere i server di Anthropic. Controlla la connessione.'
  if (err instanceof Anthropic.APIError) return `Errore dei server di Anthropic (${err.status ?? '?'}). Riprova.`
  return 'Errore imprevisto del server.'
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { errore: 'Manca la chiave API: crea il file .env.local con ANTHROPIC_API_KEY (vedi README).' },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ errore: 'Richiesta non valida.' }, { status: 400 })
  }
  const messaggi = leggiMessaggi(body)
  if (!messaggi) return Response.json({ errore: 'Conversazione non valida.' }, { status: 400 })

  const client = new Anthropic()
  const conversazione: Anthropic.Beta.BetaMessageParam[] = [...messaggi]
  const system = istruzioni(process.env.JARVIS_APPELLATIVO?.trim() || 'signore')
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Con la ricerca web il server può mettere in pausa il turno (pause_turn):
        // in quel caso si rimanda la risposta parziale e Claude riprende da lì.
        for (let giro = 0; giro < 4; giro++) {
          const risposta = client.beta.messages.stream(
            {
              model: MODELLO,
              max_tokens: 16000,
              system,
              messages: conversazione,
              // Conversazione parlata: risposte rapide, ragionamento leggero
              output_config: { effort: 'low' },
              tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
              // Se il modello declina una richiesta, l'API riprova da sola con un modello di riserva
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
            },
            { signal: request.signal },
          )
          risposta.on('text', (testo) => controller.enqueue(encoder.encode(testo)))
          const finale = await risposta.finalMessage()

          if (finale.stop_reason === 'refusal') {
            controller.enqueue(encoder.encode(' Mi dispiace, non posso aiutarla con questa richiesta.'))
          }
          if (finale.stop_reason !== 'pause_turn') break
          conversazione.push({ role: 'assistant', content: finale.content })
        }
      } catch (err) {
        if (!request.signal.aborted) {
          console.error('[jarvis] errore API:', err)
          controller.enqueue(encoder.encode(SEGNALE_ERRORE + spiegaErrore(err)))
        }
      } finally {
        try {
          controller.close()
        } catch {
          // il browser ha già chiuso la connessione
        }
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
