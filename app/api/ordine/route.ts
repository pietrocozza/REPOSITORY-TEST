import { ordineSchema } from '@/lib/order-schema'
import { costoConsegna, subtotale } from '@/lib/menu'

// Riceve l'ordine dal modulo, ricontrolla i dati e risponde con un numero d'ordine FINTO.
// Il locale è inventato: nessun ordine viene inviato da nessuna parte.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, messaggio: 'Richiesta non valida.' }, { status: 400 })
  }

  const parsed = ordineSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { ok: false, messaggio: 'Alcuni dati non sono validi: controlla il modulo.', errori: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { carrello, dati } = parsed.data
  // Il totale si ricalcola sempre qui: non ci fidiamo dei prezzi arrivati dal browser
  const sub = subtotale(carrello)
  const totale = Math.round((sub + costoConsegna(dati.zona, sub)) * 100) / 100
  const numero = `BP-${Math.floor(1000 + Math.random() * 9000)}`
  const eta = dati.orario === 'asap' ? '35–45 min' : `ore ${dati.orario}`

  // ─────────────────────────────────────────────────────────────
  // QUI, in futuro, si collega l'invio reale dell'ordine, ad esempio:
  //  - un'email al locale (es. con Resend, Postmark o Nodemailer)
  //  - un gestionale / POS della cucina tramite la sua API
  //  - un messaggio su Telegram o WhatsApp Business
  // Le chiavi segrete vanno nelle variabili d'ambiente (es. su Vercel), mai nel codice.
  // ─────────────────────────────────────────────────────────────

  return Response.json({ ok: true, numero, eta, totale })
}
