'use client'

import { useCallback, useEffect, useState } from 'react'
import { caricaEmail, scollegaGoogle, statoGoogle, type EmailBreve, type StatoGoogle } from '@/lib/chat'

// La sezione Email: collegare Gmail (accesso ufficiale di Google) e vedere le ultime email.
// Cliccando un'email Ambrogio la riassume.

const nomeMittente = (da: string) => da.replace(/<[^>]+>/, '').replace(/"/g, '').trim() || da
const quando = (iso: string) => {
  const d = new Date(iso)
  const oggi = new Date().toDateString() === d.toDateString()
  return oggi ? d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export default function SezioneEmail({ onChiedi, onStato }: { onChiedi: (domanda: string) => void; onStato?: (s: StatoGoogle) => void }) {
  const [stato, setStato] = useState<StatoGoogle | null>(null)
  const [email, setEmail] = useState<EmailBreve[] | null>(null)
  const [problema, setProblema] = useState<string | null>(null)
  const [inAttesa, setInAttesa] = useState(false)

  const aggiornaStato = useCallback(async () => {
    const s = await statoGoogle()
    if (s) {
      setStato(s)
      onStato?.(s)
    }
    return s
  }, [onStato])

  useEffect(() => {
    let attivo = true
    statoGoogle().then((s) => {
      if (!attivo || !s) return
      setStato(s)
      onStato?.(s)
    })
    return () => {
      attivo = false
    }
  }, [onStato])

  // mentre la pagina di Google è aperta si controlla ogni 2 secondi se il collegamento è riuscito
  useEffect(() => {
    if (!inAttesa) return
    const inizio = Date.now()
    const t = setInterval(async () => {
      const s = await aggiornaStato()
      if (s?.collegato || Date.now() - inizio > 5 * 60_000) setInAttesa(false)
    }, 2000)
    return () => clearInterval(t)
  }, [inAttesa, aggiornaStato])

  // le ultime email, aggiornate ogni minuto
  const collegato = Boolean(stato?.collegato)
  useEffect(() => {
    if (!collegato) return
    let attivo = true
    const carica = async () => {
      const r = await caricaEmail()
      if (!attivo) return
      if (r) {
        setEmail(r.email)
        setProblema(null)
      } else {
        setProblema('Non riesco a leggere Gmail adesso. Se continua, scollega e ricollega.')
        aggiornaStato()
      }
    }
    carica()
    const t = setInterval(carica, 60_000)
    return () => {
      attivo = false
      clearInterval(t)
    }
  }, [collegato, aggiornaStato])

  const collega = () => {
    window.open('/api/google/collega', 'ambrogio-google', 'width=520,height=720')
    setInAttesa(true)
  }

  return (
    <div className="j-email">
      <div className="j-sezione-testa">
        <h2>Email</h2>
        {collegato && (
          <button
            type="button"
            onClick={async () => {
              await scollegaGoogle()
              setEmail(null)
              aggiornaStato()
            }}
          >
            Scollega
          </button>
        )}
      </div>

      {!stato && <p className="j-vuoto">Controllo Gmail…</p>}

      {stato && !stato.configurato && (
        <div className="j-presto">
          <h2>Gmail non è ancora configurato</h2>
          <p>Serve una piccola preparazione su Google, gratis e una volta sola (circa 10 minuti). Ambrogio non vedrà mai la tua password.</p>
          <span>Guida: README → «Collegare Gmail»</span>
        </div>
      )}

      {stato?.configurato && !collegato && (
        <div className="j-presto">
          <h2>Collega Gmail</h2>
          <p>Si apre la pagina di Google: entra con il tuo account e premi «Consenti». Il permesso resta solo su questo PC e puoi toglierlo quando vuoi.</p>
          <button type="button" className="j-tasto-pieno" onClick={collega}>
            {inAttesa ? 'In attesa di Google…' : 'Collega Gmail'}
          </button>
        </div>
      )}

      {collegato && (
        <>
          <p className="j-nota">Collegato: {stato?.email ?? 'Gmail'} · clicca un’email e Ambrogio te la riassume</p>
          {problema && <p className="j-nota j-ko">{problema}</p>}
          {email?.length === 0 && <p className="j-vuoto">Nessuna email nella posta in arrivo.</p>}
          <ul className="j-email-lista">
            {email?.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  data-nonletta={e.nonLetta || undefined}
                  onClick={() => onChiedi(`Riassumimi l'email «${e.oggetto}» di ${nomeMittente(e.da)} (id ${e.id}).`)}
                >
                  <span className="j-email-riga">
                    <b>{nomeMittente(e.da)}</b>
                    {/airbnb/i.test(e.da) && <em>Airbnb</em>}
                    <small>{quando(e.data)}</small>
                  </span>
                  <span className="j-email-oggetto">{e.oggetto}</span>
                  <span className="j-email-anteprima">{e.anteprima}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
