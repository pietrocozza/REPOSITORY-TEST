'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReteNeurale from '@/components/ReteNeurale'
import { chiediAlServer, type Chiedi } from '@/lib/chat'
import type { Stato, Voce } from '@/lib/stato'
import {
  ascolta,
  dopoParolaAttivazione,
  estraiFrasi,
  preparaVoce,
  pronuncia,
  riconoscimentoDisponibile,
  zittisci,
} from '@/lib/voce'

const MESSAGGI_ERRORE_MIC: Record<string, string> = {
  'not-allowed': 'Accesso al microfono negato. Consentilo dall’icona del lucchetto nella barra degli indirizzi, oppure scrivi.',
  'service-not-allowed': 'Il riconoscimento vocale non è consentito qui: scrivi nella casella in basso.',
  'audio-capture': 'Nessun microfono trovato.',
  network: 'Il riconoscimento vocale ha bisogno di Internet: controlla la connessione.',
  'non-supportato': 'Questo browser non riconosce la voce: usa Google Chrome o Microsoft Edge, oppure scrivi.',
}

const ETICHETTE: Record<Stato, string> = {
  spento: 'In standby',
  pronto: 'In linea',
  ascolto: 'Ti ascolto',
  elaborazione: 'Sto pensando',
  risposta: 'Sto rispondendo',
}

function saluto() {
  const h = new Date().getHours()
  const parte = h < 5 ? 'Buonanotte' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  return `${parte}. Tutti i sistemi sono operativi. Come posso esserle utile?`
}

let prossimoId = 1

export default function Jarvis({ chiedi = chiediAlServer }: { chiedi?: Chiedi }) {
  const [stato, setStato] = useState<Stato>('spento')
  const [voci, setVoci] = useState<Voce[]>([])
  const [parziale, setParziale] = useState('')
  const [testo, setTesto] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [vocale, setVocale] = useState(true)
  const [parolaAttivazione, setParolaAttivazione] = useState(false)
  const [microfono, setMicrofono] = useState(true)
  const [cronologia, setCronologia] = useState(false)

  // Valori letti dentro callback asincrone: tenuti in ref per non leggere versioni vecchie
  const livello = useRef(0)
  const statoRef = useRef(stato)
  const vociRef = useRef(voci)
  const vocaleRef = useRef(vocale)
  const attivazioneRef = useRef(parolaAttivazione)
  const fermaAscolto = useRef<() => void>(() => {})
  const richiesta = useRef<AbortController | null>(null)
  const frasiInCoda = useRef(0)
  const flussoFinito = useRef(true)
  const turno = useRef(0) // ogni nuova domanda invalida le callback di quella precedente
  const sottotitoli = useRef<HTMLDivElement>(null)
  const righeCronologia = useRef<HTMLDivElement>(null)

  useEffect(() => {
    statoRef.current = stato
    vociRef.current = voci
    vocaleRef.current = vocale
    attivazioneRef.current = parolaAttivazione
  }, [stato, voci, vocale, parolaAttivazione])

  useEffect(() => {
    const id = setTimeout(() => setMicrofono(riconoscimentoDisponibile()), 0)
    return () => clearTimeout(id)
  }, [])

  // ───────── Ascolto ─────────

  const inviaRef = useRef<(t: string) => void>(() => {})
  const ascoltoContinuoRef = useRef<() => void>(() => {})
  const avviaAscoltoRef = useRef<(continuo: boolean) => void>(() => {})

  const avviaAscolto = useCallback((continuo: boolean) => {
    fermaAscolto.current()
    setErrore(null)
    setParziale('')
    let sentito = false
    if (!continuo) {
      zittisci()
      setStato('ascolto')
    }
    fermaAscolto.current = ascolta(continuo, {
      onParziale: (p) => {
        if (!continuo) setParziale(p)
        else if (dopoParolaAttivazione(p) !== null) {
          setStato('ascolto')
          setParziale(p)
        }
      },
      onFrase: (frase) => {
        if (!frase) return
        if (!continuo) {
          sentito = true
          setParziale('')
          inviaRef.current(frase)
          return
        }
        const comando = dopoParolaAttivazione(frase)
        if (comando === null) return
        sentito = true
        setParziale('')
        fermaAscolto.current()
        if (comando) {
          inviaRef.current(comando)
        } else {
          // Solo "Jarvis": risponde e ascolta la domanda
          setStato('risposta')
          pronuncia('Sì?', { onFine: () => avviaAscoltoRef.current(false) })
        }
      },
      onErrore: (codice) => {
        if (codice === 'no-speech' || codice === 'aborted') return
        if (codice === 'not-allowed' || codice === 'service-not-allowed') setParolaAttivazione(false)
        setErrore(MESSAGGI_ERRORE_MIC[codice] ?? `Errore del riconoscimento vocale (${codice}).`)
      },
      onFine: () => {
        setParziale('')
        if (sentito) return
        if (statoRef.current === 'ascolto') setStato('pronto')
        // Chrome chiude l'ascolto continuo dopo un po' di silenzio: si riparte
        if (continuo && attivazioneRef.current && statoRef.current !== 'elaborazione' && statoRef.current !== 'risposta') {
          setTimeout(() => ascoltoContinuoRef.current(), 300)
        }
      },
    })
  }, [])

  const ascoltoContinuo = useCallback(() => {
    if (!attivazioneRef.current || statoRef.current === 'spento') return
    avviaAscolto(true)
  }, [avviaAscolto])

  useEffect(() => {
    ascoltoContinuoRef.current = ascoltoContinuo
    avviaAscoltoRef.current = avviaAscolto
  }, [ascoltoContinuo, avviaAscolto])

  // ───────── Risposta ─────────

  const concludi = useCallback((t: number) => {
    if (t !== turno.current) return
    livello.current = 0
    setStato('pronto')
    if (attivazioneRef.current) setTimeout(() => ascoltoContinuoRef.current(), 250)
  }, [])

  const parla = useCallback(
    (frase: string, t: number) => {
      frasiInCoda.current++
      pronuncia(frase, {
        onInizio: () => t === turno.current && setStato('risposta'),
        onParola: () => {
          if (t === turno.current) livello.current = 0.9
        },
        onFine: () => {
          if (t !== turno.current) return
          frasiInCoda.current = Math.max(0, frasiInCoda.current - 1)
          if (frasiInCoda.current === 0 && flussoFinito.current) concludi(t)
        },
      })
    },
    [concludi],
  )

  const invia = useCallback(
    async (domanda: string) => {
      const pulita = domanda.trim()
      if (!pulita) return
      fermaAscolto.current()
      fermaAscolto.current = () => {}
      richiesta.current?.abort()
      zittisci()

      const t = ++turno.current
      frasiInCoda.current = 0
      flussoFinito.current = false
      setErrore(null)
      setParziale('')
      setStato('elaborazione')

      const storia = vociRef.current
        .filter((v) => !v.errore && v.testo.trim())
        .map((v) => ({ role: v.ruolo, content: v.testo }))
        .slice(-30)
      const idRisposta = prossimoId++
      setVoci((vs) => [...vs, { id: prossimoId++, ruolo: 'user', testo: pulita }, { id: idRisposta, ruolo: 'assistant', testo: '' }])

      const controller = new AbortController()
      richiesta.current = controller
      let buffer = ''
      let primo = true

      try {
        await chiedi([...storia, { role: 'user', content: pulita }], {
          signal: controller.signal,
          onTesto: (pezzo) => {
            if (t !== turno.current) return
            if (primo) {
              primo = false
              if (!vocaleRef.current) setStato('risposta')
            }
            setVoci((vs) => vs.map((v) => (v.id === idRisposta ? { ...v, testo: v.testo + pezzo } : v)))
            if (vocaleRef.current) {
              buffer += pezzo
              const { frasi, resto } = estraiFrasi(buffer)
              buffer = resto
              frasi.forEach((f) => parla(f, t))
            }
          },
        })
        if (t !== turno.current) return
        if (vocaleRef.current && buffer.trim()) parla(buffer, t)
        flussoFinito.current = true
        if (frasiInCoda.current === 0) concludi(t)
      } catch (err) {
        if (controller.signal.aborted || t !== turno.current) return
        const msg = err instanceof Error ? err.message : 'Errore imprevisto.'
        zittisci()
        setVoci((vs) => [
          ...vs.filter((v) => !(v.id === idRisposta && !v.testo)),
          { id: prossimoId++, ruolo: 'assistant', testo: msg, errore: true },
        ])
        setErrore(msg)
        flussoFinito.current = true
        frasiInCoda.current = 0
        concludi(t)
      }
    },
    [chiedi, concludi, parla],
  )

  useEffect(() => {
    inviaRef.current = invia
  }, [invia])

  // ───────── Comandi ─────────

  const interrompi = useCallback(() => {
    turno.current++
    richiesta.current?.abort()
    fermaAscolto.current()
    fermaAscolto.current = () => {}
    zittisci()
    livello.current = 0
    setParziale('')
    setStato('pronto')
    if (attivazioneRef.current) setTimeout(() => ascoltoContinuoRef.current(), 250)
  }, [])

  const attiva = useCallback(() => {
    preparaVoce()
    const t = ++turno.current
    setStato('risposta')
    const testoSaluto = saluto()
    setVoci([{ id: prossimoId++, ruolo: 'assistant', testo: testoSaluto }])
    // la sintesi vocale ha bisogno di un attimo per caricare le voci
    setTimeout(() => {
      flussoFinito.current = true
      frasiInCoda.current = 0
      if (vocaleRef.current) parla(testoSaluto, t)
      else concludi(t)
    }, 250)
  }, [parla, concludi])

  const premiMicrofono = useCallback(() => {
    const s = statoRef.current
    if (s === 'spento') return attiva()
    if (s === 'ascolto' || s === 'elaborazione' || s === 'risposta') return interrompi()
    avviaAscolto(false)
  }, [attiva, interrompi, avviaAscolto])

  // Barra spaziatrice = parla / interrompi; Esc = interrompi
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === 'Escape') return interrompi()
      if (el.closest('input, textarea, button, [contenteditable]')) return
      if (e.code === 'Space') {
        e.preventDefault()
        premiMicrofono()
      }
    }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [premiMicrofono, interrompi])

  // Mentre ascolta, la rete segue il volume del microfono
  useEffect(() => {
    if (stato !== 'ascolto') return
    let chiuso = false
    let raf = 0
    let flusso: MediaStream | null = null
    let ctx: AudioContext | null = null
    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (chiuso) return s.getTracks().forEach((tr) => tr.stop())
        flusso = s
        ctx = new AudioContext()
        const analisi = ctx.createAnalyser()
        analisi.fftSize = 512
        ctx.createMediaStreamSource(s).connect(analisi)
        const dati = new Uint8Array(analisi.fftSize)
        const ciclo = () => {
          analisi.getByteTimeDomainData(dati)
          let somma = 0
          for (const d of dati) somma += ((d - 128) / 128) ** 2
          livello.current = Math.min(1, Math.sqrt(somma / dati.length) * 5)
          raf = requestAnimationFrame(ciclo)
        }
        ciclo()
      })
      .catch(() => {})
    return () => {
      chiuso = true
      cancelAnimationFrame(raf)
      flusso?.getTracks().forEach((tr) => tr.stop())
      ctx?.close().catch(() => {})
      livello.current = 0
    }
  }, [stato])

  // Mentre parla, la rete "vibra" con la voce
  useEffect(() => {
    if (stato !== 'risposta') return
    const id = setInterval(() => {
      livello.current = Math.max(0.3 + Math.random() * 0.4, livello.current * 0.8)
    }, 90)
    return () => {
      clearInterval(id)
      livello.current = 0
    }
  }, [stato])

  // I sottotitoli e la cronologia scorrono da soli verso l'ultima riga
  useEffect(() => {
    for (const el of [sottotitoli.current, righeCronologia.current]) if (el) el.scrollTop = el.scrollHeight
  }, [voci, parziale, cronologia])

  // Accendendo la parola d'attivazione si inizia ad ascoltare subito
  const cambiaAttivazione = () => {
    const nuovo = !parolaAttivazione
    setParolaAttivazione(nuovo)
    attivazioneRef.current = nuovo
    if (nuovo && statoRef.current === 'pronto') avviaAscolto(true)
    if (!nuovo && statoRef.current !== 'elaborazione' && statoRef.current !== 'risposta') {
      fermaAscolto.current()
      fermaAscolto.current = () => {}
      setStato((s) => (s === 'ascolto' ? 'pronto' : s))
    }
  }

  const cambiaVocale = () => {
    if (vocale) zittisci()
    setVocale(!vocale)
  }

  const attivo = stato !== 'spento'
  const ultima = [...voci].reverse().find((v) => v.ruolo === 'assistant')
  const ultimaDomanda = [...voci].reverse().find((v) => v.ruolo === 'user')

  return (
    <main className="app" data-stato={stato}>
      <ReteNeurale stato={stato} livelloRef={livello} />
      <div className="velo" aria-hidden="true" />

      <header className="testata">
        <div className="marchio">
          <strong>JARVIS</strong>
          <span>Assistente neurale · Claude</span>
        </div>
        <nav className="azioni" aria-label="Impostazioni">
          <button type="button" className="chip" aria-pressed={vocale} onClick={cambiaVocale}>
            <span className="led" />
            Voce
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={parolaAttivazione}
            onClick={cambiaAttivazione}
            disabled={!microfono || !attivo}
            title="Resta in ascolto e risponde quando dici “Jarvis, …”"
          >
            <span className="led" />
            “Jarvis”
          </button>
          <button type="button" className="chip" aria-pressed={cronologia} onClick={() => setCronologia(!cronologia)}>
            Conversazione
          </button>
        </nav>
      </header>

      {attivo && (
        <section className="dialogo" aria-live="polite">
          <p className="stato">
            <span className="punto" />
            {ETICHETTE[stato]}
          </p>
          {(parziale || (stato === 'elaborazione' && ultimaDomanda)) && (
            <p className="domanda">“{parziale || ultimaDomanda?.testo}”</p>
          )}
          {!parziale && stato !== 'elaborazione' && ultima && (
            <div ref={sottotitoli} className={`sottotitoli${ultima.errore ? ' errore' : ''}`}>
              {ultima.testo}
            </div>
          )}
          {errore && !ultima?.errore && (
            <p className="avviso" role="alert">
              {errore}
            </p>
          )}
        </section>
      )}

      {attivo && (
        <footer className="comandi">
          <form
            className="barra"
            onSubmit={(e) => {
              e.preventDefault()
              invia(testo)
              setTesto('')
            }}
          >
            <button
              type="button"
              className="microfono"
              onClick={premiMicrofono}
              aria-label={stato === 'pronto' ? 'Parla con Jarvis' : 'Interrompi'}
              title={stato === 'pronto' ? 'Parla (barra spaziatrice)' : 'Interrompi (Esc)'}
            >
              {stato === 'pronto' ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                </svg>
              )}
            </button>
            <input
              id="comando"
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Chiedi qualcosa a Jarvis…"
              aria-label="Scrivi a Jarvis"
              autoComplete="off"
            />
            <button type="submit" className="invia" disabled={!testo.trim()} aria-label="Invia">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h13M13 6l6 6-6 6" fill="none" />
              </svg>
            </button>
          </form>
          <p className="aiuto">Barra spaziatrice per parlare · Esc per interrompere · trascina per ruotare la rete</p>
        </footer>
      )}

      <aside className="cronologia" data-aperta={cronologia || undefined} aria-label="Conversazione" aria-hidden={!cronologia}>
        <header>
          <h2>Conversazione</h2>
          <button type="button" onClick={() => setCronologia(false)} aria-label="Chiudi" tabIndex={cronologia ? 0 : -1}>
            ✕
          </button>
        </header>
        <div ref={righeCronologia} className="righe">
          {voci.length === 0 && <p className="vuoto">Ancora nessun messaggio.</p>}
          {voci.map((v) => (
            <article key={v.id} className={`riga ${v.ruolo}${v.errore ? ' errore' : ''}`}>
              <span>{v.ruolo === 'user' ? 'Tu' : v.errore ? 'Errore' : 'Jarvis'}</span>
              <p>{v.testo || '…'}</p>
            </article>
          ))}
        </div>
      </aside>

      {!attivo && (
        <div className="avvio">
          <h1>JARVIS</h1>
          <p>Assistente personale con intelligenza artificiale</p>
          <button type="button" className="pulsante-avvio" onClick={attiva} autoFocus>
            Attiva
          </button>
          <small>Per parlare a voce usa Google Chrome o Microsoft Edge</small>
        </div>
      )}
    </main>
  )
}
