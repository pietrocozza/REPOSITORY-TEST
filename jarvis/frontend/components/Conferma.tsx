'use client'

import { useState } from 'react'
import type { Autorizzazione } from '@/lib/chat'

// La richiesta di permesso di Jarvis. Livello 2: "Consenti" (anche "sempre").
// Livello 3 (eliminazioni, pagamenti, azioni irreversibili): prima va spuntata la presa visione.
export default function Conferma({ richiesta, onDecidi }: { richiesta: Autorizzazione; onDecidi: (concedi: boolean, sempre: boolean) => void }) {
  const [capito, setCapito] = useState(false)
  const [sempre, setSempre] = useState(false)
  const sensibile = richiesta.livello === 3

  return (
    <div className="j-conferma" data-livello={richiesta.livello} role="alertdialog" aria-label="Jarvis chiede il permesso">
      <span className="j-conferma-etichetta">{sensibile ? 'Azione sensibile' : 'Serve il tuo permesso'}</span>
      <p>{richiesta.descrizione}</p>
      {sensibile ? (
        <label className="j-conferma-spunta">
          <input type="checkbox" checked={capito} onChange={(e) => setCapito(e.target.checked)} />
          Ho capito: è un’azione definitiva
        </label>
      ) : (
        <label className="j-conferma-spunta">
          <input type="checkbox" checked={sempre} onChange={(e) => setSempre(e.target.checked)} />
          Consenti sempre questa azione
        </label>
      )}
      <div className="j-conferma-tasti">
        <button type="button" className="j-no" onClick={() => onDecidi(false, false)}>
          Rifiuta
        </button>
        <button type="button" className="j-si" disabled={sensibile && !capito} onClick={() => onDecidi(true, !sensibile && sempre)}>
          {sensibile ? 'Sì, confermo' : 'Consenti'}
        </button>
      </div>
    </div>
  )
}
