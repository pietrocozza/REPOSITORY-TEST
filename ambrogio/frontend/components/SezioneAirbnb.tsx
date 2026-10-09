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
  // si possono scegliere più file insieme (es. i report dei guadagni di tutti gli anni): uno alla volta
  const carica = async (files: FileList | null) => {
    if (!files?.length) return
    setOccupato(true)
    const esiti: string[] = []
    for (const file of Array.from(files)) {
      setEsito(`Leggo ${file.name}…`)
      const r = await caricaGuadagni(file)
      esiti.push(`${file.name}: ${'errore' in r ? r.errore : r.descrizione}`)
    }
    setOccupato(false)
    setEsito(esiti.join(' · '))
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
        <input
          ref={scegliFile}
          type="file"
          multiple
          accept=".csv,.pdf,text/csv,application/pdf"
          hidden
          onChange={(e) => carica(e.target.files).finally(() => (e.target.value = ''))}
        />
        <button
          type="button"
          disabled={occupato}
          onClick={() => scegliFile.current?.click()}
          title="Report dei guadagni (PDF), report mensile o transazioni (CSV) di Airbnb, oppure un CSV di spese"
        >
          {occupato ? 'Leggo i file…' : 'Carica file Airbnb'}
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
