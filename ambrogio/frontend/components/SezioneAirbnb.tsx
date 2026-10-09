'use client'

import { useEffect, useRef, useState } from 'react'
import { caricaGuadagni, preparaFoglioSpese, statoAirbnb, type StatoAirbnb } from '@/lib/chat'

// Impostazioni → Airbnb: il calendario di ogni casa arriva? (e se no, perché)
export default function SezioneAirbnb() {
  const [stato, setStato] = useState<StatoAirbnb | null>(null)
  const [prova, setProva] = useState(0)
  const [esito, setEsito] = useState<string | null>(null)
  const [occupato, setOccupato] = useState(false)
  const scegliFile = useRef<HTMLInputElement>(null)
  const carica = async (file: File | undefined) => {
    if (!file) return
    setOccupato(true)
    const r = await caricaGuadagni(file)
    setOccupato(false)
    setEsito('errore' in r ? r.errore : `Caricate ${r.prenotazioni} prenotazioni ${r.periodo}: ${r.totale.toLocaleString('it-IT')} € di guadagno.`)
    setProva((p) => p + 1)
  }
  const apriFoglio = async () => {
    // la finestra si apre subito (i browser bloccano quelle aperte dopo un'attesa), poi si riempie
    const finestra = window.open('', '_blank')
    setOccupato(true)
    const r = await preparaFoglioSpese()
    setOccupato(false)
    if ('errore' in r) {
      finestra?.close()
      setEsito(r.errore)
    } else if (finestra) finestra.location.href = r.link
    else setEsito(`Il foglio delle spese è qui: ${r.link}`)
    setProva((p) => p + 1)
  }
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
      <div className="j-riga-pulsanti">
        <input ref={scegliFile} type="file" accept=".csv,text/csv" hidden onChange={(e) => carica(e.target.files?.[0]).finally(() => (e.target.value = ''))} />
        <button type="button" disabled={occupato} onClick={() => scegliFile.current?.click()} title="Il file scaricato da Airbnb: Guadagni → Esporta CSV">
          Carica file guadagni
        </button>
        <button type="button" disabled={occupato} onClick={apriFoglio} title="Bollette, pulizie, affitto e condominio: entrano nel calcolo del rendimento">
          Foglio delle spese
        </button>
        <button type="button" onClick={() => setProva((p) => p + 1)}>
          Riprova
        </button>
      </div>
      {esito && <small className="j-esito">{esito}</small>}
    </div>
  )
}
