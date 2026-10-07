'use client'

import { useRef, useState } from 'react'
import { trascrivi } from '@/lib/chat'
import { MESSAGGIO_PERMESSO, registraFrase, spiegaRegistrazione } from '@/lib/registra'
import { annotaProblema } from '@/lib/chat'

// Prova del microfono nelle Impostazioni: si vede se il microfono sente (la barra si muove),
// quale microfono usa Windows e cosa capisce Ambrogio. Non manda niente a Claude.

type Fase = { tipo: 'pronta' } | { tipo: 'ascolto' } | { tipo: 'capisco' } | { tipo: 'capito'; testo: string } | { tipo: 'problema'; testo: string }

export default function ProvaMicrofono({ conGemini }: { conGemini: boolean }) {
  const [fase, setFase] = useState<Fase>({ tipo: 'pronta' })
  const [livello, setLivello] = useState(0)
  const [microfono, setMicrofono] = useState('')
  const annulla = useRef<() => void>(() => {})

  const prova = async () => {
    if (fase.tipo === 'ascolto') return annulla.current()
    setFase({ tipo: 'ascolto' })
    const r = registraFrase({
      onLivello: setLivello,
      onAperto: (m) => {
        setMicrofono(m)
        setFase({ tipo: 'ascolto' })
      },
      onAttesaPermesso: () => setFase({ tipo: 'problema', testo: MESSAGGIO_PERMESSO }),
      attesaMaxMs: 6000,
    })
    annulla.current = r.annulla
    const esito = await r.promessa
    if (esito.microfono) setMicrofono(esito.microfono)
    if (!esito.audio) {
      const problema = spiegaRegistrazione(esito)
      if (problema) annotaProblema(`Prova del microfono: ${problema}`)
      return setFase(problema ? { tipo: 'problema', testo: problema } : { tipo: 'pronta' })
    }
    if (!conGemini) return setFase({ tipo: 'capito', testo: 'Il microfono funziona (per capire le parole serve la chiave di Gemini).' })
    setFase({ tipo: 'capisco' })
    const t = await trascrivi(esito.audio)
    if ('errore' in t) annotaProblema(`Prova del microfono: ${t.errore}`)
    setFase('errore' in t ? { tipo: 'problema', testo: t.errore } : { tipo: 'capito', testo: t.testo ? `Ho capito: «${t.testo}»` : 'Ti ho sentito, ma non ho capito le parole.' })
  }

  return (
    <div className="j-riga j-riga-colonna">
      <span>
        Prova il microfono
        <small>Premi, di’ una frase e aspetta: vedi se ti sente e cosa capisce.</small>
      </span>
      <div className="j-prova-mic">
        <button type="button" onClick={prova} disabled={fase.tipo === 'capisco'}>
          {fase.tipo === 'ascolto' ? 'Ferma' : fase.tipo === 'capisco' ? 'Capisco…' : fase.tipo === 'pronta' ? 'Prova' : 'Riprova'}
        </button>
        <div className="j-livello" aria-label="Livello del microfono">
          <i style={{ width: `${Math.round(livello * 100)}%` }} />
        </div>
      </div>
      {microfono && <small className="j-nota">Microfono in uso: {microfono}</small>}
      {fase.tipo === 'ascolto' && <small className="j-nota">Ti ascolto: parla adesso…</small>}
      {fase.tipo === 'capito' && <small className="j-nota j-ok">{fase.testo}</small>}
      {fase.tipo === 'problema' && <small className="j-nota j-ko">{fase.testo}</small>}
    </div>
  )
}
