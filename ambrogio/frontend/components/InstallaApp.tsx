'use client'

import { useEffect, useState } from 'react'

// Edge mostra l'icona di Ambrogio nella barra delle applicazioni solo se Ambrogio è "installato" come app.
// Quando Edge dice che si può installare, compare questo bottone; un clic, "Installa", e dalla volta dopo
// Ambrogio si apre con la sua icona (lo script di avvio se ne accorge da solo).

type RichiestaInstallazione = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export default function InstallaApp() {
  const [richiesta, setRichiesta] = useState<RichiestaInstallazione | null>(null)

  useEffect(() => {
    const prima = (e: Event) => {
      e.preventDefault()
      setRichiesta(e as RichiestaInstallazione)
    }
    const fatto = () => setRichiesta(null)
    window.addEventListener('beforeinstallprompt', prima)
    window.addEventListener('appinstalled', fatto)
    return () => {
      window.removeEventListener('beforeinstallprompt', prima)
      window.removeEventListener('appinstalled', fatto)
    }
  }, [])

  if (!richiesta) return null
  return (
    <button
      type="button"
      className="j-installa"
      onClick={async () => {
        await richiesta.prompt()
        await richiesta.userChoice.catch(() => null)
        setRichiesta(null)
      }}
      title="Installa Ambrogio come app: nella barra delle applicazioni avrà la sua icona invece di quella di Edge"
    >
      Metti l’icona di Ambrogio nella barra
    </button>
  )
}
