'use client'

import { useEffect, useState } from 'react'
import {
  cancellaMemoria,
  caricaAutorizzazioni,
  caricaMemorie,
  caricaPratiche,
  caricaRegistro,
  revocaPermesso,
  type Memoria,
  type Pratica,
  type VoceRegistro,
} from '@/lib/chat'

// Le sezioni del pannello di destra che leggono i dati dal backend. Si aggiornano da sole mentre sono aperte.

function useDati<T>(carica: () => Promise<T | null>, ogniMs = 3000) {
  const [dati, setDati] = useState<T | null>(null)
  const [versione, setVersione] = useState(0)
  useEffect(() => {
    let attivo = true
    const aggiorna = () => carica().then((d) => attivo && d && setDati(d))
    aggiorna()
    const id = setInterval(aggiorna, ogniMs)
    return () => {
      attivo = false
      clearInterval(id)
    }
  }, [carica, ogniMs, versione])
  return [dati, () => setVersione((v) => v + 1)] as const
}

const ora = (iso: string) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
const giorno = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

const ETICHETTE_REGISTRO: Record<string, string> = {
  azione: 'Azione',
  autorizzazione: 'Permesso',
  messaggio: 'Messaggio',
  errore: 'Errore',
  memoria: 'Memoria',
  sistema: 'Sistema',
}

export function SezioneRegistro() {
  const [dati] = useDati(caricaRegistro)
  // le voci più recenti in alto, raggruppate per giorno
  const gruppi: { giorno: string; voci: VoceRegistro[] }[] = []
  for (const v of [...(dati?.voci ?? [])].reverse()) {
    const g = giorno(v.quando)
    if (gruppi.at(-1)?.giorno !== g) gruppi.push({ giorno: g, voci: [] })
    gruppi.at(-1)!.voci.push(v)
  }
  return (
    <>
      <div className="j-sezione-testa">
        <h2>Registro</h2>
      </div>
      <div className="j-lista">
        {gruppi.length === 0 && <p className="j-vuoto">Qui comparirà tutto quello che Ambrogio fa, minuto per minuto.</p>}
        {gruppi.map((gr) => (
          <div key={gr.giorno}>
            <h3 className="j-giorno">{gr.giorno}</h3>
            {gr.voci.map((v) => (
              <div key={v.id} className="j-registro-riga" data-tipo={v.tipo}>
                <time>{ora(v.quando)}</time>
                <span>{v.descrizione}</span>
                <em>{ETICHETTE_REGISTRO[v.tipo] ?? v.tipo}</em>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

const STATI: Record<Pratica['stato'], string> = { aperta: 'Aperta', in_attesa: 'In attesa di risposta', chiusa: 'Chiusa' }

export function SezionePratiche() {
  const [dati] = useDati(caricaPratiche, 5000)
  const pratiche = dati?.pratiche ?? []
  return (
    <>
      <div className="j-sezione-testa">
        <h2>Pratiche</h2>
      </div>
      <div className="j-lista">
        {pratiche.length === 0 && (
          <p className="j-vuoto">
            Nessuna pratica. Prova a dire a Ambrogio: «Apri una pratica per il rimborso della palestra».
          </p>
        )}
        {pratiche.map((p: Pratica) => (
          <article key={p.id} className="j-scheda" data-stato={p.stato}>
            <header>
              <b>{p.titolo}</b>
              <span className="j-stato-pratica">{STATI[p.stato]}</span>
            </header>
            {p.descrizione && <p>{p.descrizione}</p>}
            {p.note && <pre>{p.note}</pre>}
          </article>
        ))}
      </div>
    </>
  )
}

const TIPI: Record<string, string> = { preferenza: 'Preferenza', persona: 'Persona', contatto: 'Contatto', regola: 'Regola', nota: 'Nota' }

export function SezioneMemoria() {
  const [memorie, ricaricaMemorie] = useDati(caricaMemorie, 5000)
  const [permessi, ricaricaPermessi] = useDati(caricaAutorizzazioni, 5000)
  const elenco: Memoria[] = memorie?.memorie ?? []
  return (
    <>
      <div className="j-riga j-riga-colonna">
        <span>
          Cosa ricorda Ambrogio
          <small>Digli «ricordati che…» per aggiungere qualcosa</small>
        </span>
        {elenco.length === 0 && <small className="j-nota">Ancora niente.</small>}
        {elenco.map((m) => (
          <div key={m.id} className="j-memoria">
            <span>
              <em>{TIPI[m.tipo] ?? m.tipo}</em> <b>{m.titolo}</b>
              <small>{m.contenuto}</small>
            </span>
            <button type="button" aria-label={`Cancella ${m.titolo}`} title="Cancella" onClick={() => cancellaMemoria(m.id).then(ricaricaMemorie)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      {!!permessi?.permanenti.length && (
        <div className="j-riga j-riga-colonna">
          <span>
            Azioni consentite sempre
            <small>Per queste Ambrogio non chiede più il permesso</small>
          </span>
          {permessi.permanenti.map((p) => (
            <div key={p.strumento} className="j-memoria">
              <span>
                <b>{p.strumento.replace(/_/g, ' ')}</b>
              </span>
              <button type="button" onClick={() => revocaPermesso(p.strumento).then(ricaricaPermessi)}>
                Revoca
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
