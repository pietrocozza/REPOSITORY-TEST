'use client'

import { useEffect, useState } from 'react'
import { provaTelefono, statoTelefono, type StatoTelefono } from '@/lib/chat'

// Impostazioni → Telefono: stato del telefono di Ambrogio (Linphone) e telefonata di prova.

const quando = (d: string) => new Date(d).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function SezioneTelefono() {
  const [stato, setStato] = useState<StatoTelefono | null>(null)
  const [messaggio, setMessaggio] = useState('')

  useEffect(() => {
    let attivo = true
    const carica = async () => {
      const s = await statoTelefono()
      if (attivo) setStato(s)
    }
    carica()
    const t = setInterval(carica, 3000)
    return () => {
      attivo = false
      clearInterval(t)
    }
  }, [])

  const chiama = async () => {
    setMessaggio('Accendo il telefono e ti chiamo: tieni Linphone aperto sul cellulare…')
    const errore = await provaTelefono()
    if (errore) setMessaggio(errore)
  }

  if (!stato) return null
  const ultima = stato.ultima
  return (
    <div className="j-riga j-riga-colonna j-telefono">
      <span>
        Telefono
        <small>
          {!stato.configurato
            ? 'Non configurato: mancano le righe di Linphone nel file .env.'
            : stato.inCorso
              ? 'Telefonata in corso…'
              : stato.stato === 'errore'
                ? `Problema: ${stato.errore}`
                : stato.stato === 'pronto'
                  ? 'Acceso e collegato a Linphone.'
                  : 'Si accende da solo quando serve.'}
        </small>
      </span>
      <button type="button" onClick={chiama} disabled={!stato.configurato || stato.inCorso}>
        Chiamami adesso (prova)
      </button>
      {messaggio && !stato.inCorso && !ultima && <small>{messaggio}</small>}
      {ultima && (
        <div className="j-telefono-ultima">
          <small>
            Ultima telefonata, {quando(ultima.quando)}:{' '}
            {ultima.esito === 'conclusa' ? 'conclusa' : ultima.esito === 'nessuna-risposta' ? `nessuna risposta (${ultima.motivo ?? ''})` : `non riuscita: ${ultima.motivo ?? ''}`}
          </small>
          {ultima.conversazione.map((b, i) => (
            <p key={i} data-chi={b.chi}>
              <b>{b.chi === 'ambrogio' ? 'Ambrogio' : 'Tu'}:</b> {b.testo}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
