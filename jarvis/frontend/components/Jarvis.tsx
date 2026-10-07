'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { chiediAlServer, impostazioniAgente, leggiStatoBackend, nuovaConversazione, type Chiedi, type Personalita } from '@/lib/chat'
import { disegnaHud } from '@/lib/hud'
import { NucleoNeurale, PALETTES, type Modo } from '@/lib/nucleo-neurale'
import type { Stato, Voce } from '@/lib/stato'
import {
  ascolta,
  dopoParolaAttivazione,
  estraiFrasi,
  impostaVoce,
  nomeVoce,
  preparaVoce,
  pronuncia,
  riconoscimentoDisponibile,
  vociItaliane,
  zittisci,
  type InfoVoce,
} from '@/lib/voce'
import { Icona, type NomeIcona } from '@/components/Icone'

// Il tuo nome, mostrato in alto nel pannello di destra
const NOME_UTENTE = 'Pietro'

type Tema = 'chiaro' | 'scuro' | 'auto'
type Sezione = 'conversazione' | 'oggi' | 'agenda' | 'email' | 'pratiche' | 'appartamenti' | 'documenti' | 'registro' | 'impostazioni'

// Il menu di destra. Le funzioni non ancora pronte lo dicono chiaramente (arrivano nelle prossime fasi).
const MENU: { id: Sezione; nome: string; icona: NomeIcona; descrizione: string; pronto: boolean }[] = [
  { id: 'conversazione', nome: 'Chat', icona: 'chat', descrizione: 'Parla o scrivi a Jarvis', pronto: true },
  { id: 'oggi', nome: 'Oggi', icona: 'sole', descrizione: 'Il riepilogo della giornata: appuntamenti, promemoria, email importanti e scadenze.', pronto: false },
  { id: 'agenda', nome: 'Agenda', icona: 'calendario', descrizione: 'Appuntamenti e promemoria da Google Calendar, con avvisi prima degli impegni.', pronto: false },
  { id: 'email', nome: 'Email', icona: 'posta', descrizione: 'Gmail: riassunti, email importanti, bozze di risposta. L’invio solo con il tuo permesso.', pronto: false },
  { id: 'pratiche', nome: 'Pratiche', icona: 'cartella', descrizione: 'Le attività lunghe che Jarvis segue nel tempo, per esempio una richiesta di rimborso.', pronto: false },
  { id: 'appartamenti', nome: 'Affitti', icona: 'casa', descrizione: 'Prenotazioni, occupazione, ricavi, buchi in calendario e prezzi suggeriti.', pronto: false },
  { id: 'documenti', nome: 'Documenti', icona: 'documento', descrizione: 'Cerca e legge file solo nelle cartelle che autorizzi: PDF, Excel, fatture.', pronto: false },
  { id: 'registro', nome: 'Registro', icona: 'registro', descrizione: 'Tutto quello che Jarvis fa, minuto per minuto, con le autorizzazioni date.', pronto: false },
  { id: 'impostazioni', nome: 'Impostazioni', icona: 'ingranaggio', descrizione: 'Voce, tema, microfono', pronto: true },
]

// Impostazioni ricordate dal browser
const CHIAVE_IMPOSTAZIONI = 'jarvis-impostazioni'
type Impostazioni = { tema: Tema; voce: string | null; velocita: number; vocale: boolean }
const IMPOSTAZIONI_INIZIALI: Impostazioni = { tema: 'chiaro', voce: null, velocita: 1.02, vocale: true }

const MESSAGGI_ERRORE_MIC: Record<string, string> = {
  'not-allowed': 'Accesso al microfono non consentito. Abilitalo dall’icona a sinistra dell’indirizzo, oppure scrivi.',
  'service-not-allowed': 'Il riconoscimento vocale non è consentito qui: scrivi il comando nella casella.',
  'audio-capture': 'Nessun microfono trovato.',
  network: 'Il riconoscimento vocale ha bisogno di Internet: controlla la connessione.',
  'non-supportato': 'Questo browser non riconosce la voce: usa Google Chrome o Microsoft Edge, oppure scrivi.',
}

const MODO: Record<Stato, Modo> = {
  pronto: 'idle',
  ascolto: 'listening',
  elaborazione: 'thinking',
  lavoro: 'working',
  conferma: 'waiting',
  successo: 'success',
  risposta: 'speaking',
}

const ETICHETTE: Record<Modo, string> = {
  idle: 'IN ATTESA',
  listening: 'IN ASCOLTO',
  thinking: 'ELABORAZIONE',
  speaking: 'STA PARLANDO',
  working: 'STRUMENTO IN USO',
  waiting: 'ATTENDE CONFERMA',
  success: 'COMPLETATO',
  error: 'ATTENZIONE',
}

const EVENTI: Record<Stato, [string, string]> = {
  pronto: ['Nucleo pronto', 'In attesa del tuo prossimo comando.'],
  ascolto: ['Microfono attivo', 'Riconoscimento vocale in corso, nessuna registrazione.'],
  elaborazione: ['Elaborazione', 'Claude sta collegando linguaggio, contesto e memoria.'],
  lavoro: ['Strumento in uso', 'Jarvis sta usando uno strumento.'],
  conferma: ['Serve una conferma', 'Jarvis aspetta la tua autorizzazione.'],
  successo: ['Completato', 'Operazione conclusa.'],
  risposta: ['Risposta', 'Jarvis sta rispondendo.'],
}

const SALUTO = 'Sono qui. Da dove cominciamo?'

let prossimoId = 1

export default function Jarvis({ chiedi = chiediAlServer }: { chiedi?: Chiedi }) {
  const [stato, setStato] = useState<Stato>('pronto')
  const [voci, setVoci] = useState<Voce[]>([])
  const [parziale, setParziale] = useState('')
  const [testo, setTesto] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [vocale, setVocale] = useState(true)
  const [parolaAttivazione, setParolaAttivazione] = useState(false)
  const [microfono, setMicrofono] = useState(true)
  const [sezione, setSezione] = useState<Sezione>('conversazione')
  const [tema, setTema] = useState<Tema>(IMPOSTAZIONI_INIZIALI.tema)
  const [temaSistemaScuro, setTemaSistemaScuro] = useState(false)
  const [voceScelta, setVoceScelta] = useState<string | null>(null)
  const [velocita, setVelocita] = useState(IMPOSTAZIONI_INIZIALI.velocita)
  const [elencoVoci, setElencoVoci] = useState<InfoVoce[]>([])
  const [voceInUso, setVoceInUso] = useState('—')
  const [pausa, setPausa] = useState(false)
  const [personalita, setPersonalita] = useState<string | null>(null)
  const [elencoPersonalita, setElencoPersonalita] = useState<Personalita[]>([])
  // statistiche della sessione, per i numeri a sinistra
  const [inizioTurno, setInizioTurno] = useState<number | null>(null)
  const [tempi, setTempi] = useState<number[]>([])
  const [nStrumenti, setNStrumenti] = useState(0)
  const [ora, setOra] = useState(0)
  const [senzaWebgl, setSenzaWebgl] = useState(false)
  const [strumento, setStrumento] = useState<string | null>(null)

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
  const livelloTesto = useRef<HTMLSpanElement>(null)
  const trascrizione = useRef<HTMLParagraphElement>(null)
  const righeCronologia = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  const timerErrore = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const strumentiUsati = useRef(false)
  const inizioRef = useRef<number | null>(null)
  const impostazioniCaricate = useRef(false)
  const usaBackend = chiedi === chiediAlServer

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

  // Avvio: microfono, voci disponibili e impostazioni salvate
  useEffect(() => {
    const aggiornaVoci = () => {
      setElencoVoci(vociItaliane())
      setVoceInUso(nomeVoce())
    }
    const id = setTimeout(() => {
      setMicrofono(riconoscimentoDisponibile())
      let salvate = IMPOSTAZIONI_INIZIALI
      try {
        salvate = { ...IMPOSTAZIONI_INIZIALI, ...JSON.parse(localStorage.getItem(CHIAVE_IMPOSTAZIONI) ?? '{}') }
      } catch {
        // impostazioni non leggibili: si usano quelle iniziali
      }
      setTema(salvate.tema)
      setVoceScelta(salvate.voce)
      setVelocita(salvate.velocita)
      setVocale(salvate.vocale)
      impostaVoce(salvate.voce, salvate.velocita)
      preparaVoce(aggiornaVoci)
      aggiornaVoci()
      impostazioniCaricate.current = true
    }, 0)
    const sistema = window.matchMedia('(prefers-color-scheme: dark)')
    const suTema = () => setTemaSistemaScuro(sistema.matches)
    sistema.addEventListener('change', suTema)
    const id2 = setTimeout(suTema, 0)
    return () => {
      clearTimeout(id)
      clearTimeout(id2)
      sistema.removeEventListener('change', suTema)
    }
  }, [])

  // Salva le impostazioni quando cambiano
  useEffect(() => {
    if (!impostazioniCaricate.current) return
    try {
      localStorage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify({ tema, voce: voceScelta, velocita, vocale }))
    } catch {
      // archivio del browser non disponibile: le impostazioni valgono solo per questa volta
    }
  }, [tema, voceScelta, velocita, vocale])

  // Mentre Jarvis lavora, il cronometro a sinistra avanza
  useEffect(() => {
    if (inizioTurno === null) return
    const id = setInterval(() => setOra(Date.now()), 500)
    return () => clearInterval(id)
  }, [inizioTurno])

  // All'avvio controlla che backend e Claude Code siano pronti, e spiega cosa manca
  useEffect(() => {
    if (!usaBackend) return
    let annullato = false
    leggiStatoBackend().then((s) => {
      if (annullato) return
      if (!s) mostraErrore('Il backend di Jarvis non risponde. Avvia Jarvis con: npm start')
      else if (!s.ok) {
        const c = s.controlli.find((x) => !x.ok)
        if (c) mostraErrore(`${c.nome}: ${c.dettaglio}.${c.aiuto ? ' ' + c.aiuto : ''}`)
      }
    })
    return () => {
      annullato = true
    }
  }, [usaBackend, mostraErrore])

  // Personalità di Jarvis: la decide il backend
  useEffect(() => {
    if (!usaBackend) return
    let annullato = false
    impostazioniAgente().then((i) => {
      if (annullato || !i) return
      setPersonalita(i.personalita)
      setElencoPersonalita(i.personalitaDisponibili)
    })
    return () => {
      annullato = true
    }
  }, [usaBackend])

  const scegliPersonalita = async (id: string) => {
    setPersonalita(id)
    const i = await impostazioniAgente(id)
    if (i) setPersonalita(i.personalita)
    else mostraErrore('Non riesco a cambiare personalità: il backend non risponde.')
  }

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
            if (telaHud.current) disegnaHud(telaHud.current, null, f, core.fit, null)
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
    return () => {
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
    if (inizioRef.current !== null) {
      const durata = Date.now() - inizioRef.current
      setTempi((ts) => [...ts, durata])
      inizioRef.current = null
      setInizioTurno(null)
    }
    if (strumentiUsati.current) {
      // se ha usato strumenti, un attimo di "completato" prima di tornare in attesa
      strumentiUsati.current = false
      setStato('successo')
      setTimeout(() => t === turno.current && setStato((s) => (s === 'successo' ? 'pronto' : s)), 1600)
    } else {
      setStato('pronto')
    }
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
      setStrumento(null)
      const adesso = Date.now()
      inizioRef.current = adesso
      setInizioTurno(adesso)
      setOra(adesso)
      strumentiUsati.current = false

      const idRisposta = prossimoId++
      setVoci((vs) => [...vs, { id: prossimoId++, ruolo: 'user', testo: pulita }, { id: idRisposta, ruolo: 'assistant', testo: '' }])

      const controller = new AbortController()
      richiesta.current = controller
      let buffer = ''
      let primo = true

      try {
        await chiedi(pulita, {
          signal: controller.signal,
          onStato: (e) => {
            if (t !== turno.current) return
            if (e.stato === 'WORKING') {
              strumentiUsati.current = true
              setNStrumenti((n) => n + 1)
              setStrumento(e.descrizione ?? e.strumento ?? null)
              setStato('lavoro')
            } else if (e.stato === 'WAITING_FOR_CONFIRMATION') setStato('conferma')
            else if (e.stato === 'THINKING') setStato((s) => (s === 'risposta' ? s : 'elaborazione'))
          },
          onTesto: (pezzo) => {
            if (t !== turno.current) return
            if (primo) {
              primo = false
              if (!vocaleRef.current) setStato('risposta')
            }
            setStato((s) => (s === 'lavoro' ? 'elaborazione' : s))
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
    if (richiesta.current && usaBackend) fetch('/api/chat/interrompi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
    richiesta.current?.abort()
    richiesta.current = null
    fermaAscolto.current()
    fermaAscolto.current = () => {}
    zittisci()
    livello.current = 0
    inizioRef.current = null
    setInizioTurno(null)
    setParziale('')
    setStato('pronto')
    if (attivazioneRef.current) setTimeout(() => ascoltoContinuoRef.current(), 250)
  }, [usaBackend])

  const parlaOInterrompi = useCallback(() => {
    if (statoRef.current === 'pronto' || statoRef.current === 'successo') avviaAscolto(false)
    else interrompi()
  }, [avviaAscolto, interrompi])

  // Barra spaziatrice = parla / interrompi; Esc = interrompi
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return interrompi()
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
  }, [voci, parziale, sezione])

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


  const provaVoce = () => {
    zittisci()
    pronuncia(`Ciao ${NOME_UTENTE}, questa è la mia voce.`)
  }

  const scegliVoce = (nome: string | null) => {
    setVoceScelta(nome)
    impostaVoce(nome, velocita)
    setVoceInUso(nomeVoce())
  }

  const cambiaVelocita = (v: number) => {
    setVelocita(v)
    impostaVoce(voceScelta, v)
  }

  // ───────── Testi e numeri mostrati ─────────

  const ultima = [...voci].reverse().find((v) => v.ruolo === 'assistant')
  const ultimaDomanda = [...voci].reverse().find((v) => v.ruolo === 'user')
  let parlato = ultima?.testo || SALUTO
  if (stato === 'ascolto') parlato = parziale ? `«${parziale}»` : parolaAttivazione ? 'Ti ascolto. Di’ «Jarvis» e poi il comando.' : 'Ti ascolto.'
  else if (stato === 'lavoro') parlato = `${strumento ?? 'Uso uno strumento'}…`
  else if (stato === 'elaborazione') parlato = ultimaDomanda ? `«${ultimaDomanda.testo}»` : 'Sto collegando le informazioni.'
  else if (stato === 'pronto' && parolaAttivazione && !ultima) parlato = 'Sono in ascolto. Di’ «Jarvis» e poi il comando.'

  const [titoloEvento] = errore ? ['Attenzione'] : stato === 'lavoro' && strumento ? [strumento] : EVENTI[stato]
  const inAttesa = stato === 'pronto' || stato === 'successo'
  const scambi = voci.filter((v) => v.ruolo === 'user').length
  const secondi = (ms: number) => (ms < 10000 ? (ms / 1000).toFixed(1) : Math.round(ms / 1000).toString()).replace('.', ',')
  const medio = tempi.length ? tempi.reduce((a, b) => a + b, 0) / tempi.length : null
  const temaAttivo = tema === 'auto' ? (temaSistemaScuro ? 'scuro' : 'chiaro') : tema
  const voceDaEdge = elencoVoci.some((v) => /natural|online/i.test(v.nome))
  const voceMenu = MENU.find((m) => m.id === sezione)!

  return (
    <div
      id="jarvis-interface"
      data-state={modo}
      data-tema={temaAttivo}
      style={{ '--j-accent': PALETTES[modo].css } as CSSProperties}
    >
      {/* ───────── Sinistra: solo numeri ───────── */}
      <aside className="j-numeri" aria-label="Statistiche">
        <div className="j-numero j-numero-grande">
          <span>In corso</span>
          <b>{inizioTurno !== null ? `${secondi(Math.max(0, ora - inizioTurno))} s` : '—'}</b>
          <small>{inizioTurno !== null ? titoloEvento : 'Nessuna attività'}</small>
        </div>
        <div className="j-numero">
          <span>Attività neurale</span>
          <b ref={livelloTesto}>—</b>
        </div>
        <div className="j-numero">
          <span>Messaggi</span>
          <b>{scambi}</b>
        </div>
        <div className="j-numero">
          <span>Strumenti usati</span>
          <b>{nStrumenti}</b>
        </div>
        <div className="j-numero">
          <span>Tempo medio di risposta</span>
          <b>{medio !== null ? `${secondi(medio)} s` : '—'}</b>
        </div>
      </aside>

      {/* ───────── Centro: la rete neurale (invariata) ───────── */}
      <main className="j-centro">
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
          <section className="j-dialogue" aria-live="polite">
            <span className="j-overline">J.A.R.V.I.S. / {inAttesa && !errore ? 'STANDBY' : ETICHETTE[modo]}</span>
            <p ref={trascrizione} className={ultima?.errore && stato === 'pronto' ? 'j-errore' : undefined}>
              {parlato.replace(/\s*\n+\s*/g, ' ')}
            </p>
          </section>
        </div>
      </main>

      {/* ───────── Destra: menu, contenuto e barra per scrivere ───────── */}
      <aside className="j-pannello" aria-label="Comandi">
        <header className="j-pannello-testa">
          <div className="j-marchio">
            <span className="j-emblem" aria-hidden="true">
              <b />
            </span>
            <div>
              <strong>J.A.R.V.I.S.</strong>
              <small>Ciao, {NOME_UTENTE}</small>
            </div>
          </div>
          <span className="j-pillola">
            <i />
            {ETICHETTE[modo].toLowerCase()}
          </span>
          <button
            type="button"
            className="j-tasto-icona"
            aria-pressed={vocale}
            onClick={cambiaVocale}
            title={vocale ? 'Voce attiva: clic per silenziare' : 'Voce disattivata: clic per attivare'}
          >
            <Icona nome={vocale ? 'altoparlante' : 'muto'} />
          </button>
        </header>

        <nav className="j-menu" aria-label="Menu">
          {MENU.map((m) => (
            <button key={m.id} type="button" aria-current={sezione === m.id ? 'page' : undefined} onClick={() => setSezione(m.id)}>
              <Icona nome={m.icona} />
              <span>{m.nome}</span>
              {!m.pronto && <em>presto</em>}
            </button>
          ))}
        </nav>

        <section className="j-sezione" aria-label={voceMenu.nome}>
          {sezione === 'conversazione' && (
            <>
              <div className="j-sezione-testa">
                <h2>Conversazione</h2>
                <button
                  type="button"
                  onClick={() => {
                    interrompi()
                    if (usaBackend) nuovaConversazione()
                    setVoci([])
                  }}
                >
                  Nuova
                </button>
              </div>
              <div ref={righeCronologia} className="j-chat">
                {voci.length === 0 && <p className="j-vuoto">Scrivi qui sotto o premi il microfono per parlare.</p>}
                {voci.map((v) => (
                  <p key={v.id} className={`j-msg ${v.ruolo}${v.errore ? ' errore' : ''}`}>
                    {v.testo || '…'}
                  </p>
                ))}
                {parziale && <p className="j-msg user fantasma">{parziale}</p>}
              </div>
            </>
          )}

          {sezione === 'impostazioni' && (
            <div className="j-impostazioni">
              <h2>Impostazioni</h2>

              {elencoPersonalita.length > 0 && (
                <div className="j-riga j-riga-colonna">
                  <span>
                    Personalità
                    <small>Cambia il modo di parlare di Jarvis (la voce resta quella scelta sotto)</small>
                  </span>
                  <div className="j-personalita" role="radiogroup" aria-label="Personalità">
                    {elencoPersonalita.map((p) => (
                      <button key={p.id} type="button" role="radio" aria-checked={personalita === p.id} onClick={() => scegliPersonalita(p.id)}>
                        <b>{p.nome}</b>
                        <small>{p.descrizione}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="j-riga">
                <span>Tema</span>
                <div className="j-segmenti" role="group" aria-label="Tema">
                  {(['chiaro', 'scuro', 'auto'] as Tema[]).map((t) => (
                    <button key={t} type="button" aria-pressed={tema === t} onClick={() => setTema(t)}>
                      {t === 'chiaro' ? 'Chiaro' : t === 'scuro' ? 'Scuro' : 'Automatico'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="j-riga" htmlFor="voce-attiva">
                <span>Leggi le risposte ad alta voce</span>
                <input id="voce-attiva" type="checkbox" className="j-interruttore" checked={vocale} onChange={cambiaVocale} />
              </label>

              <div className="j-riga j-riga-colonna">
                <label htmlFor="scelta-voce">Voce</label>
                <div className="j-voce">
                  <select id="scelta-voce" value={voceScelta ?? ''} onChange={(e) => scegliVoce(e.target.value || null)}>
                    <option value="">Automatica ({voceInUso})</option>
                    {elencoVoci.map((v) => (
                      <option key={v.nome} value={v.nome}>
                        {v.nome}
                        {v.naturale ? ' ★' : ''}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={provaVoce}>
                    Prova
                  </button>
                </div>
                {!voceDaEdge && (
                  <small className="j-nota">Per voci più naturali apri Jarvis con Microsoft Edge: ha le voci italiane “Natural” gratuite (★).</small>
                )}
              </div>

              <div className="j-riga j-riga-colonna">
                <label htmlFor="velocita-voce">Velocità della voce: {velocita.toFixed(2).replace('.', ',')}×</label>
                <input
                  id="velocita-voce"
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.02}
                  value={velocita}
                  onChange={(e) => cambiaVelocita(Number(e.target.value))}
                />
              </div>

              <label className="j-riga" htmlFor="ascolto-continuo">
                <span>
                  Ascolto continuo
                  <small>Risponde quando dici «Jarvis, …»</small>
                </span>
                <input
                  id="ascolto-continuo"
                  type="checkbox"
                  className="j-interruttore"
                  checked={parolaAttivazione}
                  onChange={cambiaAttivazione}
                  disabled={!microfono}
                />
              </label>

              <label className="j-riga" htmlFor="pausa-animazione">
                <span>Ferma l’animazione (risparmia batteria)</span>
                <input id="pausa-animazione" type="checkbox" className="j-interruttore" checked={pausa} onChange={() => setPausa(!pausa)} />
              </label>
            </div>
          )}

          {!voceMenu.pronto && (
            <div className="j-presto">
              <Icona nome={voceMenu.icona} />
              <h2>{voceMenu.nome}</h2>
              <p>{voceMenu.descrizione}</p>
              <span>In arrivo nelle prossime fasi</span>
            </div>
          )}
        </section>

        <form
          className="j-console"
          onSubmit={(e) => {
            e.preventDefault()
            invia(testo)
            setTesto('')
            setSezione('conversazione')
          }}
        >
          <button
            type="button"
            className="j-mic-tondo"
            data-attivo={!inAttesa || undefined}
            onClick={parlaOInterrompi}
            aria-label={inAttesa ? 'Parla con Jarvis' : 'Interrompi'}
            title={inAttesa ? 'Parla (barra spaziatrice)' : 'Interrompi (Esc)'}
          >
            <Icona nome={inAttesa ? 'microfono' : 'stop'} />
          </button>
          <input
            ref={campo}
            id="comando"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Scrivi a Jarvis…"
            aria-label="Scrivi a Jarvis"
            autoComplete="off"
          />
          <button type="submit" className="j-invia" disabled={!testo.trim()} aria-label="Invia">
            <Icona nome="invia" />
          </button>
        </form>
      </aside>

      {errore && (
        <div className="j-toast" role="status">
          {errore}
        </div>
      )}
    </div>
  )
}
