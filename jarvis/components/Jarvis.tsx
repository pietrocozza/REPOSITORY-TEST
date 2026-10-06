'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { chiediAlServer, type Chiedi } from '@/lib/chat'
import { disegnaHud } from '@/lib/hud'
import { NucleoNeurale, PALETTES, type Modo } from '@/lib/nucleo-neurale'
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

// Il tuo nome, mostrato nel pannello "Sessione"
const NOME_UTENTE = 'Pietro'

const MESSAGGI_ERRORE_MIC: Record<string, string> = {
  'not-allowed': 'Accesso al microfono non consentito. Abilitalo dall’icona a sinistra dell’indirizzo, oppure scrivi.',
  'service-not-allowed': 'Il riconoscimento vocale non è consentito qui: scrivi il comando nella casella.',
  'audio-capture': 'Nessun microfono trovato.',
  network: 'Il riconoscimento vocale ha bisogno di Internet: controlla la connessione.',
  'non-supportato': 'Questo browser non riconosce la voce: usa Google Chrome o Microsoft Edge, oppure scrivi.',
}

const MODO: Record<Stato, Modo> = { pronto: 'idle', ascolto: 'listening', elaborazione: 'thinking', risposta: 'speaking' }

const ETICHETTE: Record<Modo, string> = {
  idle: 'IN ATTESA',
  listening: 'IN ASCOLTO',
  thinking: 'ELABORAZIONE',
  speaking: 'STA PARLANDO',
  error: 'ATTENZIONE',
}

const EVENTI: Record<Stato, [string, string]> = {
  pronto: ['Nucleo pronto', 'In attesa del tuo prossimo comando.'],
  ascolto: ['Microfono attivo', 'Riconoscimento vocale in corso, nessuna registrazione.'],
  elaborazione: ['Elaborazione', 'Claude sta collegando linguaggio, contesto e memoria.'],
  risposta: ['Risposta', 'Jarvis sta rispondendo.'],
}

const SALUTO = 'Sono qui. Da dove cominciamo?'

let prossimoId = 1

export default function Jarvis({ chiedi = chiediAlServer, etichetta = 'CLAUDE · LIVE' }: { chiedi?: Chiedi; etichetta?: string }) {
  const [stato, setStato] = useState<Stato>('pronto')
  const [voci, setVoci] = useState<Voce[]>([])
  const [parziale, setParziale] = useState('')
  const [testo, setTesto] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [vocale, setVocale] = useState(true)
  const [parolaAttivazione, setParolaAttivazione] = useState(false)
  const [microfono, setMicrofono] = useState(true)
  const [cronologia, setCronologia] = useState(false)
  const [immersivo, setImmersivo] = useState(false)
  const [pausa, setPausa] = useState(false)
  const [conteggi, setConteggi] = useState<{ nodi: number; connessioni: number } | null>(null)
  const [senzaWebgl, setSenzaWebgl] = useState(false)

  // Valori letti dentro callback asincrone: tenuti in ref per non leggere versioni vecchie
  const livello = useRef(0)
  const bande = useRef<Uint8Array | null>(null)
  const statoRef = useRef(stato)
  const vociRef = useRef(voci)
  const vocaleRef = useRef(vocale)
  const attivazioneRef = useRef(parolaAttivazione)
  const fermaAscolto = useRef<() => void>(() => {})
  const richiesta = useRef<AbortController | null>(null)
  const frasiInCoda = useRef(0)
  const flussoFinito = useRef(true)
  const turno = useRef(0) // ogni nuova domanda invalida le callback di quella precedente
  const nucleo = useRef<NucleoNeurale | null>(null)
  const tela = useRef<HTMLCanvasElement>(null)
  const telaHud = useRef<HTMLCanvasElement>(null)
  const telaOnda = useRef<HTMLCanvasElement>(null)
  const livelloTesto = useRef<HTMLSpanElement>(null)
  const trascrizione = useRef<HTMLParagraphElement>(null)
  const righeCronologia = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  const timerErrore = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    statoRef.current = stato
    vociRef.current = voci
    vocaleRef.current = vocale
    attivazioneRef.current = parolaAttivazione
  }, [stato, voci, vocale, parolaAttivazione])

  const mostraErrore = useCallback((msg: string) => {
    setErrore(msg)
    clearTimeout(timerErrore.current)
    timerErrore.current = setTimeout(() => setErrore(null), 6000)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      setMicrofono(riconoscimentoDisponibile())
      preparaVoce()
    }, 0)
    return () => clearTimeout(id)
  }, [])

  // ───────── La rete neurale 3D e l'HUD ─────────

  useEffect(() => {
    const canvas = tela.current
    if (!canvas) return
    let ultimoHud = -1
    let core: NucleoNeurale
    try {
      core = new NucleoNeurale(canvas, {
        onFrame: (f) => {
          // mentre ascolta, la rete segue il volume reale del microfono
          if (statoRef.current === 'ascolto') core.setAudioLevel(livello.current)
          else core.clearAudio()
          if (f.time - ultimoHud > 0.03 || f.paused || ultimoHud < 0) {
            if (telaHud.current) disegnaHud(telaHud.current, telaOnda.current, f, core.fit, statoRef.current === 'ascolto' ? bande.current : null)
            ultimoHud = f.time
          }
          if (livelloTesto.current) {
            livelloTesto.current.textContent = statoRef.current === 'ascolto' ? `${Math.round(livello.current * 100)}%` : `${Math.round(f.energy * 100)}%`
          }
        },
        onError: (msg) => mostraErrore(msg),
      })
    } catch {
      const id = setTimeout(() => setSenzaWebgl(true), 0)
      return () => clearTimeout(id)
    }
    nucleo.current = core
    const id = setTimeout(() => setConteggi({ nodi: core.network.nodes.length, connessioni: core.network.edges.length }), 0)
    return () => {
      clearTimeout(id)
      core.destroy()
      nucleo.current = null
    }
  }, [mostraErrore])

  const modo: Modo = errore && stato === 'pronto' ? 'error' : MODO[stato]
  useEffect(() => {
    nucleo.current?.setState(modo)
  }, [modo])

  useEffect(() => {
    nucleo.current?.setPaused(pausa)
  }, [pausa])

  // ───────── Ascolto ─────────

  const inviaRef = useRef<(t: string) => void>(() => {})
  const ascoltoContinuoRef = useRef<() => void>(() => {})
  const avviaAscoltoRef = useRef<(continuo: boolean) => void>(() => {})

  const avviaAscolto = useCallback(
    (continuo: boolean) => {
      fermaAscolto.current()
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
          mostraErrore(MESSAGGI_ERRORE_MIC[codice] ?? `Errore del riconoscimento vocale (${codice}).`)
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
    },
    [mostraErrore],
  )

  const ascoltoContinuo = useCallback(() => {
    if (!attivazioneRef.current) return
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
        mostraErrore(msg)
        flussoFinito.current = true
        frasiInCoda.current = 0
        concludi(t)
      }
    },
    [chiedi, concludi, parla, mostraErrore],
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

  const parlaOInterrompi = useCallback(() => {
    if (statoRef.current === 'pronto') avviaAscolto(false)
    else interrompi()
  }, [avviaAscolto, interrompi])

  // Barra spaziatrice = parla / interrompi; Esc = interrompi
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCronologia(false)
        return interrompi()
      }
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, button, [contenteditable]')) return
      if (e.code === 'Space') {
        e.preventDefault()
        parlaOInterrompi()
      }
    }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [parlaOInterrompi, interrompi])

  // Mentre ascolta, misura il volume e le frequenze del microfono (per la rete e l'onda)
  useEffect(() => {
    if (stato !== 'ascolto') return
    let chiuso = false
    let raf = 0
    let flusso: MediaStream | null = null
    let ctx: AudioContext | null = null
    navigator.mediaDevices
      ?.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        if (chiuso) return s.getTracks().forEach((tr) => tr.stop())
        flusso = s
        ctx = new AudioContext()
        const analisi = ctx.createAnalyser()
        analisi.fftSize = 1024
        analisi.smoothingTimeConstant = 0.7
        ctx.createMediaStreamSource(s).connect(analisi)
        const campioni = new Float32Array(analisi.fftSize)
        const freq = new Uint8Array(analisi.frequencyBinCount)
        bande.current = freq
        const ciclo = () => {
          analisi.getFloatTimeDomainData(campioni)
          analisi.getByteFrequencyData(freq)
          let somma = 0
          for (const c of campioni) somma += c * c
          livello.current = Math.min(1, Math.max(0, (Math.sqrt(somma / campioni.length) - 0.006) * 4.5))
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
      bande.current = null
    }
  }, [stato])

  // Il testo della risposta e la cronologia scorrono da soli verso l'ultima riga
  useEffect(() => {
    for (const el of [trascrizione.current, righeCronologia.current]) if (el) el.scrollTop = el.scrollHeight
  }, [voci, parziale, cronologia])

  // Ascolto continuo: Jarvis risponde quando sente "Jarvis, …"
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

  // ───────── Testi mostrati ─────────

  const ultima = [...voci].reverse().find((v) => v.ruolo === 'assistant')
  const ultimaDomanda = [...voci].reverse().find((v) => v.ruolo === 'user')
  let parlato = ultima?.testo || SALUTO
  if (stato === 'ascolto') parlato = parziale ? `«${parziale}»` : parolaAttivazione ? 'Ti ascolto. Di’ «Jarvis» e poi il comando.' : 'Ti ascolto.'
  else if (stato === 'elaborazione') parlato = ultimaDomanda ? `«${ultimaDomanda.testo}»` : 'Sto collegando le informazioni.'
  else if (stato === 'pronto' && parolaAttivazione && !ultima) parlato = 'Sono in ascolto. Di’ «Jarvis» e poi il comando.'

  const [titoloEvento, dettaglioEvento] = errore ? ['Attenzione', errore] : EVENTI[stato]
  const fonte =
    stato === 'ascolto'
      ? 'MICROFONO / TEMPO REALE'
      : stato === 'elaborazione'
        ? 'CLAUDE / ELABORAZIONE'
        : stato === 'risposta'
          ? vocale
            ? 'VOCE DI SISTEMA / RISPOSTA'
            : 'TESTO / RISPOSTA'
          : 'ANIMAZIONE PROCEDURALE'
  const scambi = voci.filter((v) => v.ruolo === 'user').length

  return (
    <div
      id="jarvis-interface"
      data-state={modo}
      className={immersivo ? 'j-immersed' : undefined}
      style={{ '--j-accent': PALETTES[modo].css } as CSSProperties}
    >
      <header className="j-header">
        <div className="j-brand">
          <span className="j-emblem" aria-hidden="true">
            <b />
          </span>
          <div>
            J.A.R.V.I.S.<small>NEURAL INTERFACE</small>
          </div>
        </div>
        <div className="j-topline">
          <span className="j-live" />
          <span data-field="status">{ETICHETTE[modo]}</span>
          <span className="j-divider" />
          <span className="j-demo">{etichetta}</span>
        </div>
        <button
          className="j-icon-button j-immersive"
          type="button"
          aria-label={immersivo ? 'Esci dalla vista immersiva' : 'Attiva vista immersiva'}
          aria-pressed={immersivo}
          onClick={() => setImmersivo(!immersivo)}
        >
          VISTA
        </button>
      </header>

      <main className="j-main">
        <div className="j-heading">
          <span className="j-overline">INTELLIGENZA IN MOVIMENTO</span>
          <h1>
            Ogni connessione,
            <br />
            una possibilità.
          </h1>
          <p>Voce. Memoria. Azione.</p>
        </div>

        <div className="j-coordinate">
          NEURAL ENGINE <span>01 / LIVE RENDER</span>
        </div>

        <div className="j-stage" aria-label="Rete neurale tridimensionale animata. Trascina per ruotare, usa la rotella per avvicinarti.">
          <canvas ref={tela} className="j-neural" role="img" aria-label="Neuroni luminosi collegati da filamenti, con impulsi in movimento" />
          <canvas ref={telaHud} className="j-hud" aria-hidden="true" />
          {senzaWebgl && (
            <div className="j-fallback">Il rendering 3D richiede WebGL. Apri la pagina in un browser con accelerazione grafica attiva.</div>
          )}
          <div className="j-callout j-callout-a">
            <span>01</span>
            <b>LINGUAGGIO</b>
            <i />
          </div>
          <div className="j-callout j-callout-b">
            <span>02</span>
            <b>MEMORIA</b>
            <i />
          </div>
          <div className="j-callout j-callout-c">
            <span>03</span>
            <b>AZIONI</b>
            <i />
          </div>
          <div className="j-stage-caption">
            <span className="j-reticle">+</span>
            <span>TRASCINA PER ESPLORARE</span>
            <span className="j-reticle">+</span>
          </div>
        </div>

        <aside className="j-left">
          <div className="j-section-label">
            CANALE VOCALE <span>01</span>
          </div>
          <canvas ref={telaOnda} className="j-wave" aria-label="Livello del segnale audio" />
          <div className="j-small-line">
            <span>{stato === 'ascolto' ? 'LIVELLO AUDIO' : 'ATTIVITÀ NEURALE'}</span>
            <span ref={livelloTesto}>—</span>
          </div>
          <div className="j-readout">
            <div>
              <span>NEURONI VISUALI</span>
              <b>{conteggi ? conteggi.nodi.toLocaleString('it-IT') : '—'}</b>
            </div>
            <div>
              <span>CONNESSIONI</span>
              <b>{conteggi ? conteggi.connessioni.toLocaleString('it-IT') : '—'}</b>
            </div>
          </div>
          <div className="j-section-label j-event-label">ATTIVITÀ</div>
          <div className="j-event">
            <i />
            <div>
              <b>{titoloEvento}</b>
              <span>{dettaglioEvento}</span>
            </div>
          </div>
        </aside>

        <aside className="j-right">
          <div className="j-section-label">
            MODULI <span>LIVE</span>
          </div>
          <button type="button" className="j-module" onClick={parlaOInterrompi}>
            <span className="j-module-symbol">⌁</span>
            <span>
              <b>Conversazione</b>
              <small>Ascolta e risponde</small>
            </span>
            <span className="j-arrow">↗</span>
          </button>
          <button type="button" className="j-module" onClick={() => campo.current?.focus()}>
            <span className="j-module-symbol">▱</span>
            <span>
              <b>Messaggio</b>
              <small>Scrivi un comando</small>
            </span>
            <span className="j-arrow">↗</span>
          </button>
          <button type="button" className="j-module" onClick={() => setCronologia(true)}>
            <span className="j-module-symbol">◔</span>
            <span>
              <b>Cronologia</b>
              <small>Rileggi la conversazione</small>
            </span>
            <span className="j-arrow">↗</span>
          </button>
          <div className="j-session">
            <span className="j-overline">SESSIONE</span>
            <b>Pronto, {NOME_UTENTE}.</b>
            <p>
              {scambi === 0 ? (
                <>
                  Un pensiero.
                  <br />
                  Migliaia di connessioni.
                </>
              ) : (
                <>
                  {scambi} {scambi === 1 ? 'scambio' : 'scambi'} in questa sessione.
                  <br />
                  Migliaia di connessioni.
                </>
              )}
            </p>
            <span className="j-session-line" />
          </div>
        </aside>

        <section className="j-dialogue" aria-live="polite">
          <span className="j-overline">J.A.R.V.I.S. / {stato === 'pronto' && !errore ? 'STANDBY' : ETICHETTE[modo]}</span>
          <p ref={trascrizione} className={ultima?.errore && stato === 'pronto' ? 'j-errore' : undefined}>
            {parlato}
          </p>
        </section>
      </main>

      <footer className="j-controls">
        <div className="j-state-selector" aria-label="Stato dell’assistente">
          {(['pronto', 'ascolto', 'elaborazione', 'risposta'] as Stato[]).map((s) => (
            <span key={s} aria-current={stato === s ? 'true' : undefined} data-attivo={stato === s || undefined}>
              <i />
              {s === 'pronto' ? 'Attesa' : s === 'ascolto' ? 'Ascolto' : s === 'elaborazione' ? 'Elaborazione' : 'Voce'}
            </span>
          ))}
        </div>

        <div className="j-main-actions">
          <button
            type="button"
            className="j-mic"
            aria-pressed={parolaAttivazione}
            onClick={cambiaAttivazione}
            disabled={!microfono}
            title="Resta in ascolto e risponde quando dici «Jarvis, …»"
          >
            {parolaAttivazione ? 'Ascolto continuo: ON' : 'Ascolto continuo'}
          </button>
          <button type="button" className="j-voice" onClick={parlaOInterrompi} title="Barra spaziatrice">
            <span className="j-play" aria-hidden="true">
              {stato === 'pronto' ? '▶' : '■'}
            </span>
            <span>{stato === 'pronto' ? 'Parla con Jarvis' : 'Interrompi'}</span>
          </button>
          <button type="button" className="j-audio-button" aria-pressed={vocale} onClick={cambiaVocale}>
            {vocale ? 'Voce attiva' : 'Voce disattivata'}
          </button>
        </div>

        <form
          className="j-console"
          onSubmit={(e) => {
            e.preventDefault()
            invia(testo)
            setTesto('')
          }}
        >
          <span aria-hidden="true">›</span>
          <input
            ref={campo}
            id="comando"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Scrivi un comando a Jarvis…"
            aria-label="Scrivi un comando a Jarvis"
            autoComplete="off"
          />
          <button type="submit" disabled={!testo.trim()}>
            Invia ↵
          </button>
        </form>

        <div className="j-bottomline">
          <span>
            NEURAL CORE <b>V.02</b>
          </span>
          <span data-field="source">{fonte}</span>
          <span className="j-bottom-actions">
            <button type="button" onClick={() => setCronologia(true)}>
              Cronologia
            </button>
            <button type="button" aria-pressed={pausa} onClick={() => setPausa(!pausa)}>
              {pausa ? 'Riprendi animazione' : 'Pausa animazione'}
            </button>
          </span>
        </div>
      </footer>

      {errore && (
        <div className="j-toast" role="status">
          {errore}
        </div>
      )}

      <aside className="j-history" data-aperta={cronologia || undefined} aria-label="Cronologia" aria-hidden={!cronologia}>
        <header>
          <span className="j-overline">CRONOLOGIA</span>
          <button type="button" onClick={() => setCronologia(false)} tabIndex={cronologia ? 0 : -1}>
            Chiudi ✕
          </button>
        </header>
        <div ref={righeCronologia} className="j-history-rows">
          {voci.length === 0 && <p className="j-history-empty">Ancora nessun messaggio.</p>}
          {voci.map((v) => (
            <article key={v.id} className={`j-history-row ${v.ruolo}${v.errore ? ' errore' : ''}`}>
              <span>{v.ruolo === 'user' ? 'TU' : v.errore ? 'SISTEMA' : 'J.A.R.V.I.S.'}</span>
              <p>{v.testo || '…'}</p>
            </article>
          ))}
        </div>
      </aside>
    </div>
  )
}
