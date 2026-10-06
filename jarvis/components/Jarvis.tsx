'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Reactor from '@/components/Reactor'
import { Diagnostica, Registro } from '@/components/Pannelli'
import { SEGNALE_ERRORE } from '@/lib/protocollo'
import type { Stato, Voce } from '@/lib/stato'
import {
  ascolta,
  dopoParolaAttivazione,
  estraiFrasi,
  nomeVoce,
  preparaVoce,
  pronuncia,
  riconoscimentoDisponibile,
  zittisci,
} from '@/lib/voce'

const MESSAGGI_ERRORE_MIC: Record<string, string> = {
  'not-allowed': 'Accesso al microfono negato. Consentilo dall’icona del lucchetto nella barra degli indirizzi.',
  'service-not-allowed': 'Il riconoscimento vocale non è consentito in questo browser.',
  'audio-capture': 'Nessun microfono trovato.',
  network: 'Il riconoscimento vocale ha bisogno di Internet: controlla la connessione.',
  'non-supportato': 'Questo browser non riconosce la voce: usa Google Chrome o Microsoft Edge, oppure scrivi qui sotto.',
}

function saluto() {
  const h = new Date().getHours()
  const parte = h < 5 ? 'Buonanotte' : h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  return `${parte}. Tutti i sistemi sono operativi. Come posso esserle utile?`
}

let prossimoId = 1

export default function Jarvis() {
  const [stato, setStato] = useState<Stato>('spento')
  const [voci, setVoci] = useState<Voce[]>([])
  const [parziale, setParziale] = useState('')
  const [testo, setTesto] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [vocale, setVocale] = useState(true)
  const [parolaAttivazione, setParolaAttivazione] = useState(false)
  const [latenza, setLatenza] = useState<number | null>(null)
  const [avvioAlle, setAvvioAlle] = useState<number | null>(null)
  const [microfono, setMicrofono] = useState(true)
  const [voceSistema, setVoceSistema] = useState('—')

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
          pronuncia('Sì?', { onFine: () => avviaAscolto(false) })
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
  }, [ascoltoContinuo])

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
      const idRisposta = prossimoId++
      setVoci((vs) => [...vs, { id: prossimoId++, ruolo: 'user', testo: pulita }, { id: idRisposta, ruolo: 'assistant', testo: '' }])
      const scrivi = (aggiorna: (v: Voce) => Voce) =>
        setVoci((vs) => vs.map((v) => (v.id === idRisposta ? aggiorna(v) : v)))

      const controller = new AbortController()
      richiesta.current = controller
      const partenza = performance.now()
      let buffer = ''

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaggi: [...storia, { role: 'user', content: pulita }] }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) {
          const dati = await res.json().catch(() => null)
          throw new Error(dati?.errore ?? `Il server ha risposto con errore ${res.status}.`)
        }

        const lettore = res.body.getReader()
        const decoder = new TextDecoder()
        let primo = true
        for (;;) {
          const { done, value } = await lettore.read()
          if (done) break
          let pezzo = decoder.decode(value, { stream: true })
          if (primo && pezzo) {
            primo = false
            setLatenza(Math.round(performance.now() - partenza))
            if (!vocaleRef.current) setStato('risposta')
          }
          const posErrore = pezzo.indexOf(SEGNALE_ERRORE)
          if (posErrore >= 0) {
            const msg = pezzo.slice(posErrore + 1) + decoder.decode()
            pezzo = pezzo.slice(0, posErrore)
            if (pezzo) scrivi((v) => ({ ...v, testo: v.testo + pezzo }))
            throw new Error(msg || 'Errore del server.')
          }
          scrivi((v) => ({ ...v, testo: v.testo + pezzo }))

          if (vocaleRef.current) {
            buffer += pezzo
            const { frasi, resto } = estraiFrasi(buffer)
            buffer = resto
            frasi.forEach((f) => parla(f, t))
          }
        }
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
    [concludi, parla],
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
    setAvvioAlle(Date.now())
    const t = ++turno.current
    setStato('risposta')
    const testoSaluto = saluto()
    setVoci([{ id: prossimoId++, ruolo: 'assistant', testo: testoSaluto }])
    // la sintesi vocale ha bisogno di un attimo per caricare le voci
    setTimeout(() => {
      setVoceSistema(nomeVoce())
      flussoFinito.current = true
      frasiInCoda.current = 0
      if (vocaleRef.current) parla(testoSaluto, t)
      else concludi(t)
    }, 250)
  }, [parla, concludi])

  const premiNucleo = useCallback(() => {
    const s = statoRef.current
    if (s === 'spento') return attiva()
    if (s === 'ascolto' || s === 'elaborazione' || s === 'risposta') return interrompi()
    avviaAscolto(false)
  }, [attiva, interrompi, avviaAscolto])

  // Barra spaziatrice = parla / interrompi; Esc = interrompi
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, button, [contenteditable]')) return
      if (e.code === 'Space') {
        e.preventDefault()
        premiNucleo()
      } else if (e.key === 'Escape') {
        interrompi()
      }
    }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [premiNucleo, interrompi])

  // Mentre ascolta, le barre seguono il volume del microfono
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

  // Mentre parla, le barre "vibrano" con la voce
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

  const scambi = voci.filter((v) => v.ruolo === 'user').length
  const attivo = stato !== 'spento'

  return (
    <main className="hud" data-stato={stato}>
      <div className="sfondo" aria-hidden="true" />

      <header className="barra-alta">
        <div className="logo">
          <strong>J.A.R.V.I.S.</strong>
          <span>Just A Rather Very Intelligent System</span>
        </div>
        <div className="spia" data-attiva={attivo || undefined}>
          <i />
          {attivo ? (parolaAttivazione ? 'IN ASCOLTO DI “JARVIS”' : 'SISTEMA ATTIVO') : 'STANDBY'}
        </div>
      </header>

      <Diagnostica avvioAlle={avvioAlle} latenza={latenza} voce={voceSistema} microfono={microfono} scambi={scambi} />

      <div className="centro">
        <Reactor stato={stato} livelloRef={livello} errore={!!errore} onClick={premiNucleo} />
        <p className="suggerimento">
          {stato === 'ascolto'
            ? 'Ti ascolto…'
            : stato === 'elaborazione'
              ? 'Elaborazione in corso…'
              : stato === 'risposta'
                ? 'Premi il nucleo o Esc per interrompere'
                : 'Premi il nucleo o la barra spaziatrice per parlare'}
        </p>
        {errore && (
          <p className="avviso-errore" role="alert">
            {errore}
          </p>
        )}
      </div>

      <Registro voci={voci} parziale={parziale} />

      <footer className="comandi">
        <form
          className="console"
          onSubmit={(e) => {
            e.preventDefault()
            if (!attivo) attiva()
            invia(testo)
            setTesto('')
          }}
        >
          <span className="prompt" aria-hidden="true">
            &gt;
          </span>
          <input
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Scrivi un comando…"
            aria-label="Scrivi un comando per Jarvis"
            autoComplete="off"
          />
          <button type="submit" disabled={!testo.trim()}>
            Invia
          </button>
        </form>
        <div className="interruttori">
          <button type="button" aria-pressed={vocale} onClick={cambiaVocale}>
            Voce {vocale ? 'ON' : 'OFF'}
          </button>
          <button type="button" aria-pressed={parolaAttivazione} onClick={cambiaAttivazione} disabled={!microfono || !attivo}>
            “Jarvis” {parolaAttivazione ? 'ON' : 'OFF'}
          </button>
        </div>
      </footer>

      {!attivo && (
        <div className="avvio">
          <ol className="righe-avvio" aria-hidden="true">
            <li>Caricamento moduli cognitivi</li>
            <li>Calibrazione sintesi vocale</li>
            <li>Collegamento ai server Anthropic</li>
            <li>Verifica protocolli di sicurezza</li>
          </ol>
          <button type="button" className="pulsante-avvio" onClick={attiva} autoFocus>
            Avvia J.A.R.V.I.S.
          </button>
          <p>Consiglio: usa Google Chrome o Microsoft Edge per parlare a voce.</p>
        </div>
      )}
    </main>
  )
}
