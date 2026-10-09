'use client'

import { useEffect, useState } from 'react'
import { statoAirbnb, type StatoAirbnb } from '@/lib/chat'

// Impostazioni → Airbnb: il calendario di ogni casa arriva? (e se no, perché)
export default function SezioneAirbnb() {
  const [stato, setStato] = useState<StatoAirbnb | null>(null)
  const [prova, setProva] = useState(0)
  useEffect(() => {
    let attivo = true
    statoAirbnb().then((s) => attivo && setStato(s))
    return () => {
      attivo = false
    }
  }, [prova])
  return (
    <div className="j-riga j-riga-colonna j-telefono">
      <span>
        Airbnb
        <small>
          {!stato
            ? 'Controllo il calendario…'
            : !stato.collegato
              ? stato.motivo
              : stato.case.map((c) => (c.ok ? `${c.nome}: calendario letto, ${c.prenotazioni} prenotazioni` : `${c.nome}: ${c.errore}`)).join(' · ')}
        </small>
        {stato?.collegato && stato.archivio && (
          <small>
            {stato.archivio.errore
              ? `Email di Airbnb: ${stato.archivio.errore}`
              : `Email di Airbnb (controllo ogni minuto): ${stato.archivio.email} lette, ${stato.archivio.prenotazioni} prenotazioni con ospiti e guadagni${
                  stato.archivio.ultimoControllo
                    ? ` · ultimo controllo ${new Date(stato.archivio.ultimoControllo).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
                    : ''
                }`}
          </small>
        )}
      </span>
      <button type="button" onClick={() => setProva((p) => p + 1)}>
        Riprova
      </button>
    </div>
  )
}
