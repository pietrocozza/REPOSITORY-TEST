'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  caricaAggiornamenti,
  caricaAutorizzazioni,
  caricaStatoVoce,
  statoGoogle,
  annotaProblema,
  preparaFrasi,
  trascrivi,
  caricaConversazione,
  chiediAlServer,
  decidiAutorizzazione,
  impostazioniAgente,
  salvaStileVoce,
  salvaCervello,
  leggiStatoBackend,
  nuovaConversazione,
  type Autorizzazione,
  type Cervello,
  type Chiedi,
  type Personalita,
  type StatoVoce,
} from '@/lib/chat'
import Conferma from '@/components/Conferma'
import ProvaMicrofono from '@/components/ProvaMicrofono'
import SezioneEmail from '@/components/SezioneEmail'
import SezioneTelefono from '@/components/SezioneTelefono'
import SezioneAirbnb from '@/components/SezioneAirbnb'
import { MESSAGGIO_PERMESSO, registraFrase, spiegaRegistrazione } from '@/lib/registra'
import Codice, { CHIAVE_VISTO, piuRecente } from '@/components/Codice'
import PannelloCodice from '@/components/PannelloCodice'
import SalaMacchine, { type StatoSala } from '@/components/SalaMacchine'
import InstallaApp from '@/components/InstallaApp'
import { SezioneMemoria, SezionePratiche, SezioneRegistro } from '@/components/Sezioni'
import { disegnaEtichette, disegnaHud } from '@/lib/hud'
import { aggiornaIconaViva } from '@/lib/icona-viva'
import { NucleoNeurale, PALETTES, type Modo } from '@/lib/nucleo-neurale'
import type { Stato, Voce } from '@/lib/stato'
import {
  ascolta,
  dopoParolaAttivazione,
  togliNome,
  eStop,
  estraiFrasi,
  senzaSuoni,
  suona,
  suoniNelTesto,
  impostaVoce,
  impostaMotore,
  livelloVoce,
  bandeVoce,
  nomeVoce,
  rispostaIntera,
  preparaVoce,
  pronuncia,
  riconoscimentoDisponibile,
  suonoAttivazione,
  vociItaliane,
  zittisci,
  type InfoVoce,
  type MotoreVoce,
} from '@/lib/voce'
import { Icona, type NomeIcona } from '@/components/Icone'

// Il tuo nome, mostrato in alto nel pannello di destra
const NOME_UTENTE = 'Pietro'

type Tema = 'chiaro' | 'scuro' | 'auto'
type Sezione = 'conversazione' | 'oggi' | 'agenda' | 'email' | 'pratiche' | 'appartamenti' | 'documenti' | 'registro' | 'impostazioni'

// Il menu di destra. Le funzioni non ancora pronte lo dicono chiaramente (arrivano nelle prossime fasi).
const MENU: { id: Sezione; nome: string; icona: NomeIcona; descrizione: string; pronto: boolean }[] = [
  { id: 'conversazione', nome: 'Chat', icona: 'chat', descrizione: 'Parla o scrivi a Ambrogio', pronto: true },
  { id: 'oggi', nome: 'Oggi', icona: 'sole', descrizione: 'Il riepilogo della giornata: appuntamenti, promemoria, email importanti e scadenze.', pronto: false },
  { id: 'agenda', nome: 'Agenda', icona: 'calendario', descrizione: 'Appuntamenti e promemoria da Google Calendar, con avvisi prima degli impegni.', pronto: false },
  { id: 'email', nome: 'Email', icona: 'posta', descrizione: 'Gmail: riassunti, email importanti, bozze di risposta. L’invio solo con il tuo permesso.', pronto: true },
  { id: 'pratiche', nome: 'Pratiche', icona: 'cartella', descrizione: 'Le attività lunghe che Ambrogio segue nel tempo, per esempio una richiesta di rimborso.', pronto: true },
  { id: 'appartamenti', nome: 'Affitti', icona: 'casa', descrizione: 'Prenotazioni, occupazione, ricavi, buchi in calendario e prezzi suggeriti.', pronto: false },
  { id: 'documenti', nome: 'Documenti', icona: 'documento', descrizione: 'Cerca e legge file solo nelle cartelle che autorizzi: PDF, Excel, fatture.', pronto: false },
  { id: 'registro', nome: 'Registro', icona: 'registro', descrizione: 'Tutto quello che Ambrogio fa, minuto per minuto, con le autorizzazioni date.', pronto: true },
  { id: 'impostazioni', nome: 'Impostazioni', icona: 'ingranaggio', descrizione: 'Voce, tema, microfono', pronto: true },
]

// Impostazioni ricordate dal browser
const CHIAVE_IMPOSTAZIONI = 'ambrogio-impostazioni'
const CHIAVE_PANNELLO_CODICE = 'ambrogio-pannello-codice'
// attivazione = ascolto continuo con «Uè Ambrogio» (come gli assistenti vocali di casa)
// motore = chi parla: 'gemini' (Ambrogio con accento milanese, se c'è la chiave) oppure 'edge'
type Impostazioni = {
  tema: Tema
  voce: string | null
  velocita: number
  vocale: boolean
  attivazione: boolean
  motore: MotoreVoce
  voceGemini: string
  qualitaVoce: 'veloce' | 'massima'
}
const IMPOSTAZIONI_INIZIALI: Impostazioni = {
  tema: 'scuro',
  voce: null,
  velocita: 1.02,
  vocale: true,
  attivazione: true,
  motore: 'gemini',
  voceGemini: 'Charon',
  qualitaVoce: 'veloce',
}

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
  lavoro: ['Strumento in uso', 'Ambrogio sta usando uno strumento.'],
  conferma: ['Serve una conferma', 'Ambrogio aspetta la tua autorizzazione.'],
  successo: ['Completato', 'Operazione conclusa.'],
  risposta: ['Risposta', 'Ambrogio sta rispondendo.'],
}

const SALUTO = 'Ambrogio, al tuo servizio. Da dove cominciamo?'

// Quando lo chiami solo per nome, Ambrogio risponde e poi ascolta la richiesta
const DOMANDE_ATTIVAZIONE = [
  `Dimmi, ${NOME_UTENTE}.`,
  'Sì? Cosa ti serve?',
  'Ué, dimmi tutto.',
  'Eccomi. Cosa posso fare per te?',
  'Agli ordini, dimmi pure.',
]
const scegliFrase = (frasi: string[]) => frasi[Math.floor(Math.random() * frasi.length)]

const FRASI_ASCOLTO = { attivo: 'Ascolto attivo: chiamami quando vuoi.', spento: 'Va bene, smetto di ascoltare.' }
const FRASE_PROVA = `Ué, ciao ${NOME_UTENTE}! Sono Ambrogio, il tuo maggiordomo. Ghe pensi mi.`

/** Il saluto quando si apre Ambrogio (poche varianti fisse: con Gemini restano salvate e partono subito) */
function salutoIniziale(ascoltoAttivo: boolean, ora = new Date().getHours()) {
  const saluto = ora < 5 ? 'Buonanotte' : ora < 13 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera'
  return `Ué, ${saluto.toLowerCase()} ${NOME_UTENTE}! Sono Ambrogio, il tuo maggiordomo personale. ${
    ascoltoAttivo ? 'Quando ti serve, dimmi: uè Ambrogio!' : 'Quando ti serve, premi il microfono o scrivimi.'
  }`
}

// Detta subito quando serve cercare online, così l'attesa non è un silenzio
const FRASI_RICERCA = [
  'Certo, signore. Cerco subito.',
  'Subito, signore: do un’occhiata in rete.',
  'Un istante, signore, sto cercando.',
  'Lo verifico subito, signore.',
  'Ci penso io, signore. Un attimo che controllo.',
]
// Detta appena Ambrogio prende in carico una richiesta che richiede qualche secondo (così si sa che ha capito)
const FRASI_PRESA = ['Ricevuto, ci penso io.', 'Subito.', 'Me ne occupo io.', 'Ghe pensi mi.', 'Certo, un momento.']
// Mentre lavora: cosa sta facendo, strumento per strumento
const FRASI_STRUMENTO: [RegExp, string][] = [
  [/WebSearch/, 'Cerco su internet.'],
  [/WebFetch/, 'Leggo una pagina web.'],
  [/leggi_email|apri_email/, 'Guardo le email.'],
  [/bozza_email/, 'Preparo la bozza.'],
  [/invia_email/, 'Preparo l’invio.'],
  [/prenotazioni/, 'Controllo il calendario di Airbnb.'],
  [/info_casa/, 'Guardo la scheda della casa.'],
  [/agenda/, 'Guardo la tua agenda.'],
  [/aggiungi_impegno/, 'Preparo l’impegno.'],
  [/ricorda|cerca_memoria|dimentica/, 'Controllo la memoria.'],
  [/pratic/, 'Aggiorno le pratiche.'],
]
// Se ci mette tanto: un aggiornamento ogni tanto, mai un silenzio lungo
const FRASI_AGGIORNAMENTO: [number, string][] = [
  [15, 'Ci sto ancora lavorando.'],
  [35, 'Sto mettendo insieme le informazioni, un attimo di pazienza.'],
  [65, 'Ci vuole ancora un po’, ma ci sono.'],
  [100, 'Quasi fatto, grazie della pazienza.'],
  [150, 'Sto ancora lavorando: è una richiesta lunga.'],
]

// Domande che quasi certamente richiedono una ricerca: la frase parte prima ancora che Claude risponda
const SERVE_RICERCA =
  /\b(meteo|che tempo fa|pioverà|piove|notizi|news|prezz|quanto costa|risultat|partit|classifica|borsa|cambio|orari|apert[oa]|chiuso|cerca|cercami|trova|trovami|ultim[ei] |oggi in tv|chi ha vinto)/i

let prossimoId = 1

export default function Ambrogio({ chiedi = chiediAlServer }: { chiedi?: Chiedi }) {
  const [stato, setStato] = useState<Stato>('pronto')
  const [voci, setVoci] = useState<Voce[]>([])
  const [parziale, setParziale] = useState('')
  const [testo, setTesto] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  /** un messaggio importante resta finché non lo chiudi */
  const [erroreFisso, setErroreFisso] = useState(false)
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
  const [motoreVoce, setMotoreVoce] = useState<MotoreVoce>(IMPOSTAZIONI_INIZIALI.motore)
  const [voceGemini, setVoceGemini] = useState(IMPOSTAZIONI_INIZIALI.voceGemini)
  const [statoVoce, setStatoVoce] = useState<StatoVoce | null>(null)
  const [qualitaVoce, setQualitaVoce] = useState<'veloce' | 'massima'>(IMPOSTAZIONI_INIZIALI.qualitaVoce)
  const [pausa, setPausa] = useState(false)
  const [personalita, setPersonalita] = useState<string | null>(null)
  const [cervello, setCervello] = useState<Cervello | null>(null)
  const [conferme, setConferme] = useState<Autorizzazione[]>([])
  const [codiceAperto, setCodiceAperto] = useState(false)
  const [codiceNuovo, setCodiceNuovo] = useState(false)
  const [salaAperta, setSalaAperta] = useState(false)
  // la finestra del codice a sinistra: aperta di serie, si chiude con la X (e la scelta si ricorda)
  const [pannelloCodice, setPannelloCodice] = useState(false)
  const [menuAperto, setMenuAperto] = useState(false)
  const [elencoPersonalita, setElencoPersonalita] = useState<Personalita[]>([])
  // come deve parlare la voce di Ambrogio, spiegato a parole a Gemini
  const [stileVoce, setStileVoce] = useState('')
  const [stilePredefinito, setStilePredefinito] = useState('')
  const [bozzaStile, setBozzaStile] = useState('')
  const [versioneStile, setVersioneStile] = useState(0)
  // statistiche della sessione, per i numeri a sinistra
  const [inizioTurno, setInizioTurno] = useState<number | null>(null)
  const [tempi, setTempi] = useState<number[]>([])
  const [nStrumenti, setNStrumenti] = useState(0)
  const [ora, setOra] = useState(0)
  const [senzaWebgl, setSenzaWebgl] = useState(false)
  const [strumento, setStrumento] = useState<string | null>(null)
  const [fraseAttesa, setFraseAttesa] = useState<string | null>(null)
  /** frase detta da Ambrogio fuori dalla conversazione (saluto, «Dimmi»): si mostra al centro */
  const [annuncio, setAnnuncio] = useState<string | null>(null)

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
  // ascolto (vedi sotto, «Ascolto»)
  const inviaRef = useRef<(t: string) => void>(() => {})
  const interrompiRef = useRef<() => void>(() => {})
  const sentinellaRef = useRef<() => void>(() => {})
  const fermaSentinella = useRef<(() => void) | null>(null)
  const comandoInCorso = useRef(false)
  /** il pulsante del microfono usa Gemini (più preciso del browser), se c'è la chiave */
  const ascoltoGemini = useRef(false)
  const riavvii = useRef(0)
  const avvisoSentinella = useRef(false)
  /** l'ultima frase "fuori conversazione" detta da Ambrogio (perché non si svegli sentendo il proprio nome) */
  const dettoDaSe = useRef('')

  useEffect(() => {
    statoRef.current = stato
    vociRef.current = voci
    vocaleRef.current = vocale
    attivazioneRef.current = parolaAttivazione
  }, [stato, voci, vocale, parolaAttivazione])

  // fisso = resta finché non lo chiudi, e si scrive anche nel Registro (per i problemi da risolvere)
  const erroreFissoRef = useRef(false)
  const mostraErrore = useCallback((msg: string, fisso = false) => {
    // un avviso qualsiasi non copre un messaggio importante ancora aperto
    if (!fisso && erroreFissoRef.current) return
    erroreFissoRef.current = fisso
    setErrore(msg)
    setErroreFisso(fisso)
    clearTimeout(timerErrore.current)
    if (fisso) annotaProblema(msg)
    else timerErrore.current = setTimeout(() => setErrore(null), Math.max(6000, msg.length * 80))
  }, [])

  // Avvio: microfono, voci disponibili e impostazioni salvate
  useEffect(() => {
    const aggiornaVoci = () => {
      setElencoVoci(vociItaliane())
      setVoceInUso(nomeVoce())
    }
    const id = setTimeout(() => {
      setMicrofono(riconoscimentoDisponibile())
      try {
        setPannelloCodice(localStorage.getItem(CHIAVE_PANNELLO_CODICE) !== 'chiuso')
      } catch {
        setPannelloCodice(true)
      }
      let salvate = IMPOSTAZIONI_INIZIALI
      try {
        // (le impostazioni di quando si chiamava Jarvis valgono ancora)
        salvate = {
          ...IMPOSTAZIONI_INIZIALI,
          ...JSON.parse(localStorage.getItem(CHIAVE_IMPOSTAZIONI) ?? localStorage.getItem('jarvis-impostazioni') ?? '{}'),
        }
      } catch {
        // impostazioni non leggibili: si usano quelle iniziali
      }
      setTema(salvate.tema)
      setVoceScelta(salvate.voce)
      setVelocita(salvate.velocita)
      setVocale(salvate.vocale)
      // ascolto continuo: riparte da solo a ogni apertura (il microfono va consentito una volta)
      const conAttivazione = salvate.attivazione && riconoscimentoDisponibile()
      setParolaAttivazione(conAttivazione)
      attivazioneRef.current = conAttivazione
      if (conAttivazione) setTimeout(() => sentinellaRef.current(), 800)
      impostaVoce(salvate.voce, salvate.velocita)
      setMotoreVoce(salvate.motore)
      setVoceGemini(salvate.voceGemini)
      setQualitaVoce(salvate.qualitaVoce)
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
      localStorage.setItem(CHIAVE_IMPOSTAZIONI, JSON.stringify({ tema, voce: voceScelta, velocita, vocale, attivazione: parolaAttivazione, motore: motoreVoce, voceGemini, qualitaVoce }))
    } catch {
      // archivio del browser non disponibile: le impostazioni valgono solo per questa volta
    }
  }, [tema, voceScelta, velocita, vocale, parolaAttivazione, motoreVoce, voceGemini, qualitaVoce])

  // Chi parla: la voce di Ambrogio (ElevenLabs o Gemini) se c'è la chiave e l'hai scelta, altrimenti le voci di Edge
  useEffect(() => {
    if (!usaBackend) return
    let annullato = false
    caricaStatoVoce().then((s) => {
      if (annullato) return
      setStatoVoce(s)
      ascoltoGemini.current = Boolean(s?.trascrizione)
    })
    return () => {
      annullato = true
    }
  }, [usaBackend, motoreVoce])
  // la voce scelta, oppure (se non c'è più) la prima voce clonata del tuo account
  const voceAmbrogio = statoVoce?.voci.some((v) => v.id === voceGemini)
    ? voceGemini
    : (statoVoce?.voci.find((v) => v.clonata) ?? statoVoce?.voci[0])?.id
  useEffect(() => {
    impostaMotore(motoreVoce === 'gemini' && statoVoce?.disponibile ? 'gemini' : 'edge', voceAmbrogio, mostraErrore, {
      // Gemini gratuito: una sola richiesta per risposta. ElevenLabs: frase per frase, così parla prima
      intera: statoVoce?.fornitore === 'gemini' && !statoVoce.pagamento,
      qualita: qualitaVoce,
    })
  }, [motoreVoce, statoVoce, voceAmbrogio, qualitaVoce, mostraErrore])

  // Archivio delle frasi pronte: con Gemini a pagamento le frasi fisse si registrano una volta
  // (in sottofondo, piano piano) e da lì in poi partono subito e non costano più nulla
  useEffect(() => {
    if (!voceAmbrogio || motoreVoce !== 'gemini' || statoVoce?.fornitore !== 'gemini' || !statoVoce.pagamento) return
    const frasiInterfaccia = [
      ...FRASI_RICERCA,
      ...FRASI_PRESA,
      ...FRASI_STRUMENTO.map(([, f]) => f),
      ...FRASI_AGGIORNAMENTO.map(([, f]) => f),
      ...DOMANDE_ATTIVAZIONE,
      FRASI_ASCOLTO.attivo,
      FRASI_ASCOLTO.spento,
      FRASE_PROVA,
      ...[3, 9, 15, 20].flatMap((ora) => [salutoIniziale(true, ora), salutoIniziale(false, ora)]),
    ]
    preparaFrasi(voceAmbrogio, frasiInterfaccia)
      .then(() => caricaStatoVoce())
      .then((s) => s && setStatoVoce(s))
  }, [voceAmbrogio, motoreVoce, statoVoce?.fornitore, statoVoce?.pagamento, versioneStile])

  // mentre l'archivio si prepara, il conteggio nelle Impostazioni si aggiorna
  const preparazioneInCorso = Boolean(statoVoce?.preparazione?.inCorso)
  useEffect(() => {
    if (!preparazioneInCorso) return
    const t = setInterval(() => caricaStatoVoce().then((s) => s && setStatoVoce(s)), 5000)
    return () => clearInterval(t)
  }, [preparazioneInCorso])

  // Appena si apre, Ambrogio saluta e si presenta (una volta per finestra, non a ogni ricarica).
  // Aspetta di sapere quale voce usare, al massimo 3 secondi.
  const salutato = useRef(false)
  const [attesaSalutoFinita, setAttesaSalutoFinita] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAttesaSalutoFinita(true), 3000)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    if (salutato.current || !impostazioniCaricate.current) return
    if (usaBackend && !statoVoce && !attesaSalutoFinita) return
    salutato.current = true
    try {
      if (sessionStorage.getItem('ambrogio-salutato')) return
      sessionStorage.setItem('ambrogio-salutato', '1')
    } catch {
      // archivio del browser non disponibile: si saluta lo stesso
    }
    const frase = salutoIniziale(attivazioneRef.current)
    dettoDaSe.current = frase
    setTimeout(() => {
      setAnnuncio(frase)
      if (!vocaleRef.current) return
      pronuncia(frase, {
        onInizio: () => setStato((st) => (st === 'pronto' ? 'risposta' : st)),
        onFine: () => setStato((st) => (st === 'risposta' ? 'pronto' : st)),
      })
    }, 0)
  }, [usaBackend, statoVoce, attesaSalutoFinita])

  // Mentre Ambrogio lavora, il cronometro a sinistra avanza
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
      if (!s) mostraErrore('Il backend di Ambrogio non risponde. Avvia Ambrogio con: npm start')
      else if (!s.ok) {
        const c = s.controlli.find((x) => !x.ok)
        if (c) mostraErrore(`${c.nome}: ${c.dettaglio}.${c.aiuto ? ' ' + c.aiuto : ''}`)
      }
    })
    return () => {
      annullato = true
    }
  }, [usaBackend, mostraErrore])

  // Conversazione salvata (anche dopo un riavvio) e richieste di permesso in sospeso
  useEffect(() => {
    if (!usaBackend) return
    let annullato = false
    caricaConversazione().then((c) => {
      if (annullato || !c) return
      setVoci((attuali) =>
        attuali.length ? attuali : c.messaggi.map((m) => ({ id: prossimoId++, ruolo: m.ruolo, testo: m.testo })),
      )
    })
    const controllaPermessi = () =>
      caricaAutorizzazioni().then((a) => {
        if (!annullato && a) setConferme(a.inAttesa)
      })
    controllaPermessi()
    const id = setInterval(controllaPermessi, 4000)
    return () => {
      annullato = true
      clearInterval(id)
    }
  }, [usaBackend])

  const decidi = async (richiesta: Autorizzazione, concedi: boolean, sempre: boolean) => {
    setConferme((cs) => cs.filter((c) => c.id !== richiesta.id))
    const ok = await decidiAutorizzazione(richiesta.id, concedi, sempre)
    if (!ok) mostraErrore('Questa richiesta non è più valida (forse è scaduta).')
  }

  // Personalità di Ambrogio: la decide il backend
  useEffect(() => {
    if (!usaBackend) return
    let annullato = false
    impostazioniAgente().then((i) => {
      if (annullato || !i) return
      setPersonalita(i.personalita)
      setCervello(i.cervello ?? null)
      setElencoPersonalita(i.personalitaDisponibili)
      setStileVoce(i.stileVoce ?? '')
      setBozzaStile(i.stileVoce ?? '')
      setStilePredefinito(i.stileVocePredefinito ?? '')
    })
    return () => {
      annullato = true
    }
  }, [usaBackend])

  // nuovo stile: si salva, si ascolta subito con la prova, e l'archivio delle frasi si rifà
  const applicaStile = async (testo: string) => {
    const i = await salvaStileVoce(testo)
    if (!i) return mostraErrore('Non riesco a salvare lo stile: il backend non risponde.')
    setStileVoce(i.stileVoce ?? '')
    setBozzaStile(i.stileVoce ?? '')
    setVersioneStile((v) => v + 1)
    zittisci()
    pronuncia(FRASE_PROVA)
  }

  const mostraPannelloCodice = (aperto: boolean) => {
    setPannelloCodice(aperto)
    try {
      localStorage.setItem(CHIAVE_PANNELLO_CODICE, aperto ? 'aperto' : 'chiuso')
    } catch {}
  }

  const scegliCervello = async (c: Cervello) => {
    setCervello(c)
    const i = await salvaCervello(c)
    if (i) setCervello(i.cervello ?? c)
    else mostraErrore('Non riesco a cambiare cervello: il backend non risponde.')
  }

  const scegliPersonalita = async (id: string) => {
    setPersonalita(id)
    const i = await impostazioniAgente(id)
    if (i) setPersonalita(i.personalita)
    else mostraErrore('Non riesco a cambiare personalità: il backend non risponde.')
  }

  // la zona «Email» della rete si accende quando Gmail è collegato
  const statoEmail = useCallback((s: { collegato: boolean }) => nucleo.current?.impostaZona('Email', s.collegato), [])
  useEffect(() => {
    if (!usaBackend) return
    const t = setTimeout(() => statoGoogle().then((s) => s && statoEmail(s)), 1500)
    return () => clearTimeout(t)
  }, [usaBackend, statoEmail])

  // ───────── La rete neurale 3D e l'HUD ─────────

  useEffect(() => {
    const canvas = tela.current
    if (!canvas) return
    let ultimoHud = -1
    let core: NucleoNeurale
    try {
      core = new NucleoNeurale(canvas, {
        onFrame: (f) => {
          // mentre ascolta la rete segue il microfono; mentre parla segue il volume della sua voce
          const voce = livelloVoce()
          if (statoRef.current === 'ascolto') core.setAudioLevel(livello.current)
          else if (voce >= 0) core.setAudioLevel(voce)
          else core.clearAudio()
          if (f.time - ultimoHud > 0.03 || f.paused || ultimoHud < 0) {
            if (telaHud.current) {
              disegnaHud(telaHud.current, null, f, core.fit, null)
              disegnaEtichette(telaHud.current, f)
            }
            ultimoHud = f.time
          }
          // l'icona della finestra è una piccola copia della rete che si muove
          if (!f.paused) aggiornaIconaViva(canvas, PALETTES[f.mode].css)
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
  // la Sala macchine legge lo stato vero di Ambrogio a ogni fotogramma (senza far ridisegnare la pagina)
  const statoSala = useRef<Pick<StatoSala, 'modo' | 'strumento' | 'errore'>>({ modo: 'idle', strumento: null, errore: null })
  useEffect(() => {
    statoSala.current = { modo, strumento: stato === 'lavoro' ? strumento : null, errore: modo === 'error' ? errore : null }
  })
  const leggiStatoSala = useCallback(
    (): StatoSala => ({ ...statoSala.current, livelloIn: livello.current, livelloOut: livelloVoce(), bande: bandeVoce() }),
    [],
  )
  useEffect(() => {
    nucleo.current?.setState(modo)
  }, [modo])

  useEffect(() => {
    nucleo.current?.setPaused(pausa)
  }, [pausa])

  // ───────── Ascolto ─────────
  // Due "orecchie":
  //  - la sentinella: con l'ascolto continuo acceso è sempre in ascolto e reagisce solo a «Uè Ambrogio…»,
  //    anche mentre Ambrogio parla o lavora (così «Uè Ambrogio, basta» lo ferma), come gli assistenti vocali di casa;
  //  - l'ascolto di un comando: dopo il pulsante del microfono o dopo un «Uè Ambrogio» detto da solo.
  // Il browser permette un solo ascolto alla volta: mentre si ascolta un comando la sentinella si ferma, poi riparte.


  /** spegne l'ascolto continuo; restituisce vero se era acceso */
  const spegniSentinella = useCallback(() => {
    const accesa = Boolean(fermaSentinella.current)
    fermaSentinella.current?.()
    fermaSentinella.current = null
    return accesa
  }, [])

  /** chiude l'ascolto di un comando e lascia ripartire la sentinella */
  const fermaComando = useCallback(() => {
    fermaAscolto.current()
    fermaAscolto.current = () => {}
    comandoInCorso.current = false
    setTimeout(() => sentinellaRef.current(), 300)
  }, [])

  const erroreMicrofono = useCallback(
    (codice: string) => {
      if (codice === 'no-speech' || codice === 'aborted') return
      if (codice === 'not-allowed' || codice === 'service-not-allowed') {
        attivazioneRef.current = false
        setParolaAttivazione(false)
      }
      mostraErrore(MESSAGGI_ERRORE_MIC[codice] ?? `Errore del riconoscimento vocale (${codice}).`)
    },
    [mostraErrore],
  )

  // Dopo il pulsante del microfono (o un «Uè Ambrogio» detto da solo): ascolta UNA frase e la invia
  const ascoltaComando = useCallback(
    (conSuono: boolean) => {
      const sentinellaAccesa = spegniSentinella()
      fermaAscolto.current()
      comandoInCorso.current = true
      setParziale('')
      zittisci()
      setStato('ascolto')
      if (conSuono) suonoAttivazione()
      const turnoInizio = turno.current
      const eseguiComando = (frase: string) => {
        // se ripete «(Uè) Ambrogio» all'inizio, lo si toglie
        const comando = togliNome(frase)
        if (!comando || eStop(comando)) interrompiRef.current()
        else inviaRef.current(comando)
      }

      if (ascoltoGemini.current) {
        // registra la frase (si ferma da solo quando smetti di parlare) e la fa trascrivere a Gemini
        const registrazione = registraFrase({
          onLivello: (l) => (livello.current = l),
          onAttesaPermesso: () => mostraErrore(MESSAGGIO_PERMESSO, true),
        })
        fermaAscolto.current = () => registrazione.annulla()
        registrazione.promessa.then(async (esito) => {
          if (turno.current !== turnoInizio || !comandoInCorso.current) return
          fermaComando()
          const audio = esito.audio
          if (!audio) {
            setStato('pronto')
            const spiegazione = spiegaRegistrazione(esito)
            if (spiegazione) mostraErrore(spiegazione, esito.motivo !== 'silenzio' || esito.livelloMax < 0.004)
            return
          }
          setStato('elaborazione')
          setParziale('…')
          const capito = await trascrivi(audio)
          if (turno.current !== turnoInizio) return
          setParziale('')
          if ('errore' in capito) {
            setStato('pronto')
            mostraErrore(`Non riesco a capire l’audio: ${capito.errore}`, true)
          } else if (!capito.testo) {
            setStato('pronto')
            mostraErrore('Non ho capito bene: puoi ripetere?')
          } else eseguiComando(capito.testo)
        })
        return
      }

      // riconoscimento del browser: se l'ascolto continuo era acceso, si aspetta che si chiuda del tutto
      // (Edge non ne accetta due insieme e il secondo fallirebbe in silenzio)
      let sentito = false
      let annullato = false
      fermaAscolto.current = () => {
        annullato = true
      }
      setTimeout(
        () => {
          if (annullato) return
          fermaAscolto.current = ascolta(false, {
            onParziale: setParziale,
            onFrase: (frase) => {
              if (!frase) return
              sentito = true
              setParziale('')
              fermaComando()
              eseguiComando(frase)
            },
            onErrore: (codice) => {
              if (codice === 'no-speech') mostraErrore('Non ho sentito niente. Parla subito dopo il suono, vicino al microfono.')
              else if (codice !== 'aborted') erroreMicrofono(codice)
            },
            onFine: () => {
              setParziale('')
              if (!sentito && statoRef.current === 'ascolto') setStato('pronto')
              fermaAscolto.current = () => {}
              comandoInCorso.current = false
              setTimeout(() => sentinellaRef.current(), 300)
            },
          })
        },
        sentinellaAccesa ? 450 : 0,
      )
    },
    [spegniSentinella, fermaComando, erroreMicrofono, mostraErrore],
  )

  const avviaSentinella = useCallback(() => {
    if (!attivazioneRef.current || comandoInCorso.current || fermaSentinella.current) return
    const partenza = Date.now()
    let sveglio = false
    // se Ambrogio pronuncia il proprio nome non deve "svegliarsi" da solo
    const sentitoDaSe = () =>
      statoRef.current === 'risposta' &&
      /ambrogio/i.test(`${dettoDaSe.current} ${[...vociRef.current].reverse().find((v) => v.ruolo === 'assistant')?.testo ?? ''}`)
    const svegliati = () => {
      sveglio = true
      suonoAttivazione()
      // se stava parlando o lavorando si ferma, come quando si chiama un assistente vocale
      if (!['pronto', 'successo', 'ascolto'].includes(statoRef.current)) interrompiRef.current()
      setStato('ascolto')
    }
    const torna = () => {
      if (sveglio && statoRef.current === 'ascolto' && !comandoInCorso.current) {
        setStato('pronto')
        setParziale('')
      }
      sveglio = false
    }
    fermaSentinella.current = ascolta(true, {
      onParziale: (p) => {
        if (dopoParolaAttivazione(p) === null || sentitoDaSe()) return
        if (!sveglio) svegliati()
        setParziale(p)
      },
      onFrase: (frase) => {
        const comando = dopoParolaAttivazione(frase)
        if (comando === null || sentitoDaSe()) return torna()
        if (!sveglio) svegliati()
        sveglio = false
        setParziale('')
        if (!comando) {
          // solo «Uè Ambrogio»: risponde «Dimmi…» e poi ascolta la richiesta
          spegniSentinella()
          comandoInCorso.current = true
          const turnoInizio = turno.current
          const domanda = scegliFrase(DOMANDE_ATTIVAZIONE)
          dettoDaSe.current = domanda
          setAnnuncio(domanda)
          setStato('risposta')
          pronuncia(domanda, {
            onFine: () => {
              if (turno.current === turnoInizio && comandoInCorso.current) ascoltaComando(false)
            },
          })
        }
        else if (eStop(comando)) {
          interrompiRef.current()
          suonoAttivazione(true)
        } else inviaRef.current(comando)
      },
      onErrore: (codice) => {
        // silenzio: normale. Problemi di rete: la sentinella riprova da sola, ma lo dice una volta
        if (codice === 'not-allowed' || codice === 'service-not-allowed' || codice === 'audio-capture') erroreMicrofono(codice)
        else if (codice === 'network' && !avvisoSentinella.current) {
          avvisoSentinella.current = true
          mostraErrore('L’ascolto di «Uè Ambrogio» non riesce a collegarsi al riconoscimento vocale di Edge: riprovo da solo. Intanto usa il pulsante del microfono.')
        }
      },
      onFine: () => {
        fermaSentinella.current = null
        torna()
        if (!attivazioneRef.current || comandoInCorso.current) return
        // il browser chiude l'ascolto dopo un po': riparte subito; se si chiude di continuo, aspetta di più
        riavvii.current = Date.now() - partenza < 3000 ? riavvii.current + 1 : 0
        setTimeout(() => sentinellaRef.current(), Math.min(15000, 300 * 2 ** riavvii.current))
      },
    })
  }, [ascoltaComando, erroreMicrofono, mostraErrore, spegniSentinella])

  useEffect(() => {
    sentinellaRef.current = avviaSentinella
  }, [avviaSentinella])
  useEffect(
    () => () => {
      spegniSentinella()
    },
    [spegniSentinella],
  )

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
    setTimeout(() => sentinellaRef.current(), 250)
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
      if (comandoInCorso.current) fermaComando()
      richiesta.current?.abort()
      zittisci()

      const t = ++turno.current
      frasiInCoda.current = 0
      flussoFinito.current = false
      erroreFissoRef.current = false
      setErrore(null)
      setParziale('')
      setStato('elaborazione')
      setStrumento(null)
      setFraseAttesa(null)
      setAnnuncio(null)
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
      // con Gemini la risposta si dice tutta insieme (una sola richiesta: le gratuite sono poche)
      const tuttaInsieme = rispostaIntera()
      // frase di cortesia per le ricerche (una sola per domanda)
      let cortesiaDetta = false
      const cortesia = () => {
        if (cortesiaDetta || !primo) return
        cortesiaDetta = true
        const frase = FRASI_RICERCA[Math.floor(Math.random() * FRASI_RICERCA.length)]
        setFraseAttesa(frase)
        if (vocaleRef.current) parla(frase, t)
      }
      if (SERVE_RICERCA.test(pulita)) setTimeout(() => t === turno.current && primo && cortesia(), 350)

      // Tenere informato Pietro mentre lavora: presa in carico, cosa sta facendo, aggiornamenti se ci mette tanto
      let ultimoAvviso = 0
      const detti = new Set<string>()
      const avvisa = (frase: string, forza = false) => {
        if (t !== turno.current || !primo || detti.has(frase)) return
        // non uno sopra l'altro: almeno 4 secondi tra un avviso e il successivo (gli aggiornamenti passano comunque)
        if (!forza && Date.now() - ultimoAvviso < 4000) return
        detti.add(frase)
        ultimoAvviso = Date.now()
        setFraseAttesa(frase)
        if (vocaleRef.current) parla(frase, t)
      }
      // le risposte pronte arrivano in un attimo: la presa in carico serve solo se dopo quasi un secondo non c'è ancora niente
      const presa = setTimeout(() => {
        if (!cortesiaDetta) avvisa(FRASI_PRESA[Math.floor(Math.random() * FRASI_PRESA.length)])
      }, 900)
      const aggiornamenti = setInterval(() => {
        if (t !== turno.current || !primo) return clearInterval(aggiornamenti)
        const trascorsi = (Date.now() - adesso) / 1000
        const prossimo = FRASI_AGGIORNAMENTO.find(([s, f]) => trascorsi >= s && !detti.has(f))
        if (prossimo) avvisa(prossimo[1], true)
      }, 1000)
      const fermaAvvisi = () => {
        clearTimeout(presa)
        clearInterval(aggiornamenti)
      }

      try {
        await chiedi(pulita, {
          signal: controller.signal,
          onStato: (e) => {
            if (t !== turno.current) return
            if (e.stato === 'WORKING') {
              if ((e.strumento === 'WebSearch' || e.strumento === 'WebFetch') && !cortesiaDetta && !detti.size) cortesia()
              else {
                const frase = FRASI_STRUMENTO.find(([r]) => r.test(e.strumento ?? ''))?.[1]
                if (frase) avvisa(frase)
              }
              strumentiUsati.current = true
              setNStrumenti((n) => n + 1)
              setStrumento(e.descrizione ?? e.strumento ?? null)
              setStato('lavoro')
            } else if (e.stato === 'WAITING_FOR_CONFIRMATION') setStato('conferma')
            else if (e.stato === 'THINKING') setStato((s) => (s === 'risposta' ? s : 'elaborazione'))
          },
          onConferma: (e) => {
            if (e.tipo === 'conferma') {
              setConferme((cs) => (cs.some((c) => c.id === e.id) ? cs : [...cs, { id: e.id, strumento: e.strumento, descrizione: e.descrizione, livello: e.livello }]))
              if (vocaleRef.current) pronuncia(`Mi serve il tuo permesso: ${e.descrizione}.`)
            } else {
              setConferme((cs) => cs.filter((c) => c.id !== e.id))
            }
          },
          onTesto: (pezzo) => {
            if (t !== turno.current) return
            if (primo) {
              primo = false
              fermaAvvisi()
              if (!vocaleRef.current) setStato('risposta')
            }
            setStato((s) => (s === 'lavoro' ? 'elaborazione' : s))
            setVoci((vs) => vs.map((v) => (v.id === idRisposta ? { ...v, testo: v.testo + pezzo } : v)))
            if (vocaleRef.current) {
              buffer += pezzo
              if (tuttaInsieme) return
              const { frasi, resto } = estraiFrasi(buffer)
              buffer = resto
              frasi.forEach((f) => parla(f, t))
            }
          },
        })
        fermaAvvisi()
        if (t !== turno.current) return
        if (vocaleRef.current && buffer.trim()) parla(buffer, t)
        // risposte non lette ad alta voce: la musica richiesta si fa sentire lo stesso
        if (!vocaleRef.current) {
          const testoFinale = vociRef.current.find((v) => v.id === idRisposta)?.testo ?? ''
          for (const nome of suoniNelTesto(testoFinale)) suona(nome)
        }
        flussoFinito.current = true
        if (frasiInCoda.current === 0) concludi(t)
      } catch (err) {
        fermaAvvisi()
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
    [chiedi, concludi, parla, mostraErrore, fermaComando],
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
    fermaComando()
    zittisci()
    livello.current = 0
    inizioRef.current = null
    setInizioTurno(null)
    setParziale('')
    setStato('pronto')
  }, [usaBackend, fermaComando])

  useEffect(() => {
    interrompiRef.current = interrompi
  }, [interrompi])

  const parlaOInterrompi = useCallback(() => {
    if (statoRef.current === 'pronto' || statoRef.current === 'successo') ascoltaComando(true)
    else interrompi()
  }, [ascoltaComando, interrompi])

  // C'è un aggiornamento del codice che Pietro non ha ancora guardato? (controllo ogni 10 minuti)
  useEffect(() => {
    if (!usaBackend) return
    const controlla = async () => {
      const recente = piuRecente(await caricaAggiornamenti(true))
      let visto: string | null = null
      try {
        visto = localStorage.getItem(CHIAVE_VISTO)
      } catch {}
      setCodiceNuovo(!!recente && recente.sha !== visto)
    }
    controlla()
    const t = setInterval(controlla, 10 * 60_000)
    return () => clearInterval(t)
  }, [usaBackend])

  // Barra spaziatrice = parla / interrompi; Esc = chiude il menu oppure interrompe;
  // basta iniziare a scrivere per aprire la chat
  const menuApertoRef = useRef(menuAperto)
  // si sta aprendo la chat perché hai iniziato a scrivere: i tasti vanno nella casella, spazio compreso
  const scritturaInArrivo = useRef(false)
  useEffect(() => {
    menuApertoRef.current = menuAperto
    if (menuAperto && scritturaInArrivo.current) {
      scritturaInArrivo.current = false
      campo.current?.focus()
    }
  }, [menuAperto])
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuApertoRef.current) return setMenuAperto(false)
        return interrompi()
      }
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable], .j-codice')) return
      // sui pulsanti la barra spaziatrice li preme: lì non attiva il microfono
      if (e.code === 'Space' && el.closest('button') && !scritturaInArrivo.current) return
      if (e.code === 'Space' && !scritturaInArrivo.current) {
        e.preventDefault()
        parlaOInterrompi()
      } else if (e.key === 'Enter' && scritturaInArrivo.current) {
        e.preventDefault()
        scritturaInArrivo.current = false
        inviaRef.current(campo.current?.value ?? '')
        setTesto('')
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        if (!menuApertoRef.current || document.activeElement !== campo.current) scritturaInArrivo.current = true
        setMenuAperto(true)
        setSezione('conversazione')
        setTesto((t) => t + e.key)
        if (menuApertoRef.current) campo.current?.focus()
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

  // Ascolto continuo: Ambrogio risponde quando sente "Ambrogio, …"
  const cambiaAttivazione = () => {
    const nuovo = !parolaAttivazione
    setParolaAttivazione(nuovo)
    attivazioneRef.current = nuovo
    riavvii.current = 0
    const frase = nuovo ? FRASI_ASCOLTO.attivo : FRASI_ASCOLTO.spento
    setAnnuncio(frase)
    if (vocaleRef.current && statoRef.current === 'pronto') {
      dettoDaSe.current = frase
      pronuncia(frase)
    }
    if (nuovo) avviaSentinella()
    else {
      spegniSentinella()
      if (!comandoInCorso.current) setStato((s) => (s === 'ascolto' ? 'pronto' : s))
    }
  }

  const cambiaVocale = () => {
    if (vocale) zittisci()
    setVocale(!vocale)
  }


  const provaVoce = () => {
    zittisci()
    pronuncia(motoreVoce === 'gemini' && statoVoce?.disponibile ? FRASE_PROVA : `Ciao ${NOME_UTENTE}, questa è la mia voce.`, {
      onInizio: () => setStato((st) => (st === 'pronto' ? 'risposta' : st)),
      onFine: () => setStato((st) => (st === 'risposta' ? 'pronto' : st)),
    })
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
  let parlato = annuncio || (ultima?.testo ? senzaSuoni(ultima.testo) : '') || fraseAttesa || SALUTO
  if (stato === 'ascolto') parlato = parziale ? `«${parziale}»` : 'Ti ascolto.'
  else if (conferme.length) parlato = `Mi serve il tuo permesso: ${conferme[0].descrizione}.`
  else if (stato === 'lavoro') parlato = fraseAttesa ?? `${strumento ?? 'Uso uno strumento'}…`
  else if (stato === 'elaborazione' && !ultima?.testo && fraseAttesa) parlato = fraseAttesa
  else if (stato === 'elaborazione') parlato = ultimaDomanda ? `«${ultimaDomanda.testo}»` : 'Sto collegando le informazioni.'
  else if (stato === 'pronto' && parolaAttivazione && !ultima) parlato = 'Quando ti serve, chiamami: «Uè Ambrogio…»'

  const [titoloEvento] = errore ? ['Attenzione'] : stato === 'lavoro' && strumento ? [strumento] : EVENTI[stato]
  const inAttesa = stato === 'pronto' || stato === 'successo'
  const scambi = voci.filter((v) => v.ruolo === 'user').length
  const secondi = (ms: number) => (ms < 10000 ? (ms / 1000).toFixed(1) : Math.round(ms / 1000).toString()).replace('.', ',')
  const medio = tempi.length ? tempi.reduce((a, b) => a + b, 0) / tempi.length : null
  const temaAttivo = tema === 'auto' ? (temaSistemaScuro ? 'scuro' : 'chiaro') : tema
  const voceDaEdge = elencoVoci.some((v) => /natural|online/i.test(v.nome))
  const voceMenu = MENU.find((m) => m.id === sezione)!

  const tendina = menuAperto || conferme.length > 0

  return (
    <div
      id="ambrogio-interface"
      data-state={modo}
      data-tema={temaAttivo}
      data-menu={tendina ? 'aperto' : undefined}
      data-codice={pannelloCodice && !codiceAperto ? 'aperto' : undefined}
      style={{ '--j-accent': PALETTES[modo].css } as CSSProperties}
    >
      {/* ───────── Centro: la rete neurale (invariata) ───────── */}
      <main className="j-centro">
        <div className="j-stage" aria-label="Rete neurale tridimensionale animata. Trascina per ruotare, usa la rotella per avvicinarti.">
          <canvas ref={tela} className="j-neural" role="img" aria-label="Neuroni luminosi collegati da filamenti, con impulsi in movimento" />
          <canvas ref={telaHud} className="j-hud" aria-hidden="true" />
          {senzaWebgl && (
            <div className="j-fallback">Il rendering 3D richiede WebGL. Apri la pagina in un browser con accelerazione grafica attiva.</div>
          )}
          <div className="j-stage-caption">
            <span className="j-reticle">+</span>
            <span>TRASCINA PER ESPLORARE</span>
            <span className="j-reticle">+</span>
          </div>
          <section className="j-dialogue" aria-live="polite">
            <span className="j-overline">
              AMBROGIO / {inAttesa && !errore ? 'STANDBY' : ETICHETTE[modo]}
              {(stato === 'elaborazione' || stato === 'lavoro') && inizioTurno !== null && ora - inizioTurno > 2000
                ? ` · ${Math.round((ora - inizioTurno) / 1000)} s`
                : ''}
            </span>
            <p ref={trascrizione} className={ultima?.errore && stato === 'pronto' ? 'j-errore' : undefined}>
              {parlato.replace(/\s*\n+\s*/g, ' ')}
            </p>
          </section>
        </div>
      </main>

      {/* ───────── Sotto la rete: solo il microfono e, se attivo, il promemoria «Uè Ambrogio» ───────── */}
      <div className="j-sotto">
        <button
          type="button"
          className="j-mic-centrale"
          data-attivo={!inAttesa || undefined}
          onClick={parlaOInterrompi}
          aria-label={inAttesa ? 'Parla con Ambrogio' : 'Interrompi'}
          title={inAttesa ? 'Parla (barra spaziatrice)' : 'Interrompi (Esc)'}
        >
          <Icona nome={inAttesa ? 'microfono' : 'stop'} />
        </button>
        {microfono && (
          <button
            type="button"
            className="j-sentinella"
            aria-pressed={parolaAttivazione}
            onClick={cambiaAttivazione}
            title={parolaAttivazione ? 'Ascolto attivo: clic per spegnerlo' : 'Ascolto spento: clic per accenderlo'}
          >
            <i />
            {parolaAttivazione ? 'ascolto attivo · di’ «Uè Ambrogio»' : 'ascolto spento'}
          </button>
        )}
      </div>

      {/* ───────── Menu a tendina ───────── */}
      <button
        type="button"
        className="j-tasto-menu"
        aria-expanded={tendina}
        aria-controls="j-tendina"
        data-nuovo={(codiceNuovo && !tendina) || undefined}
        onClick={() => setMenuAperto(!tendina)}
        disabled={conferme.length > 0}
        title={tendina ? 'Chiudi il menu (Esc)' : 'Apri il menu'}
      >
        <Icona nome={tendina ? 'chiudi' : 'menu'} />
        <span>{tendina ? 'Chiudi' : 'Menu'}</span>
      </button>

      <aside id="j-tendina" className="j-pannello" aria-label="Menu di Ambrogio" inert={!tendina}>
        <header className="j-pannello-testa">
          <div className="j-marchio">
            <span className="j-emblem" aria-hidden="true">
              <b />
            </span>
            <div>
              <strong>AMBROGIO</strong>
              <small>Ciao, {NOME_UTENTE}</small>
            </div>
          </div>
          <span className="j-pillola">
            <i />
            {ETICHETTE[modo].toLowerCase()}
          </span>
          {usaBackend && (
            <button
              type="button"
              className="j-tasto-icona"
              onClick={() => {
                setSalaAperta(true)
                setMenuAperto(false)
              }}
              title="Sala macchine: i grafici dal vivo di Ambrogio"
              aria-label="Sala macchine"
            >
              <Icona nome="grafico" />
            </button>
          )}
          {usaBackend && (
            <button
              type="button"
              className="j-tasto-icona"
              data-nuovo={codiceNuovo || undefined}
              onClick={() => {
                setCodiceAperto(true)
                setCodiceNuovo(false)
                setMenuAperto(false)
              }}
              title={codiceNuovo ? 'Codice: c’è un aggiornamento nuovo da guardare' : 'Codice: guarda come cambia Ambrogio'}
              aria-label="Codice"
            >
              <Icona nome="codice" />
            </button>
          )}
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

        <div className="j-numeri" aria-label="Statistiche">
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
            <span>Tempo medio</span>
            <b>{medio !== null ? `${secondi(medio)} s` : '—'}</b>
        </div>
        </div>

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
                    {senzaSuoni(v.testo) || '…'}
                  </p>
                ))}
                {parziale && <p className="j-msg user fantasma">{parziale}</p>}
              </div>
            </>
          )}

          {sezione === 'registro' && <SezioneRegistro />}
          {sezione === 'email' && (
            <SezioneEmail
              onStato={statoEmail}
              onChiedi={(domanda) => {
                setSezione('conversazione')
                invia(domanda)
              }}
            />
          )}
          {sezione === 'pratiche' && <SezionePratiche />}

          {sezione === 'impostazioni' && (
            <div className="j-impostazioni">
              <h2>Impostazioni</h2>

              <SezioneTelefono />
              <SezioneAirbnb />

              {cervello && (
                <div className="j-riga j-riga-colonna">
                  <span>
                    Cervello
                    <small>Sonnet è veloce e capisce bene (consigliato); Haiku è il più svelto ma meno sveglio; Completo ragiona di più ma è lento</small>
                  </span>
                  <div className="j-segmenti" role="group" aria-label="Cervello">
                    {(['sonnet', 'rapido', 'bilanciato'] as Cervello[]).map((c) => (
                      <button key={c} type="button" aria-pressed={cervello === c} onClick={() => scegliCervello(c)}>
                        {c === 'sonnet' ? 'Sonnet' : c === 'rapido' ? 'Haiku' : 'Completo'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {elencoPersonalita.length > 0 && (
                <div className="j-riga j-riga-colonna">
                  <span>
                    Personalità
                    <small>Cambia il modo di parlare di Ambrogio (la voce resta quella scelta sotto)</small>
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
                <span>
                  Chi parla
                  <small>
                    {statoVoce?.problema
                      ? `${statoVoce.problema} Controlla la chiave nel file .env.`
                      : !statoVoce?.disponibile
                        ? 'Per la voce di Ambrogio serve la chiave di ElevenLabs (o di Gemini) nel file .env: vedi il README.'
                        : statoVoce.sospesaFinoA
                          ? 'La voce di Ambrogio è in pausa (crediti o richieste finiti): per ora parla Edge, poi si riprova da solo.'
                          : statoVoce.fornitore === 'elevenlabs'
                            ? 'Ambrogio con la sua voce milanese (ElevenLabs).'
                            : statoVoce.pagamento
                              ? 'Ambrogio con accento milanese (Gemini, a consumo: pochi centesimi al giorno).'
                              : 'Ambrogio con accento milanese (Gemini, gratis con un limite di richieste al giorno).'}
                  </small>
                </span>
                <div className="j-segmenti" role="group" aria-label="Chi parla">
                  <button type="button" aria-pressed={motoreVoce === 'gemini'} onClick={() => setMotoreVoce('gemini')} disabled={!statoVoce?.disponibile}>
                    Ambrogio milanese
                  </button>
                  <button type="button" aria-pressed={motoreVoce === 'edge' || !statoVoce?.disponibile} onClick={() => setMotoreVoce('edge')}>
                    Voce di Edge
                  </button>
                </div>
              </div>

              {motoreVoce === 'gemini' && statoVoce?.disponibile && (
                <div className="j-riga j-riga-colonna">
                  <label htmlFor="voce-gemini">Voce di Ambrogio</label>
                  <div className="j-voce">
                    <select id="voce-gemini" value={voceAmbrogio ?? ''} onChange={(e) => setVoceGemini(e.target.value)}>
                      {statoVoce.voci.map((v) => (
                        <option key={v.id} value={v.id}>
                          {statoVoce.fornitore === 'elevenlabs' ? `${v.descrizione}${v.clonata ? ' (la tua voce)' : ''}` : `${v.id} – ${v.descrizione}`}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={provaVoce}>
                      Prova
                    </button>
                  </div>
                  {statoVoce.preparazione && statoVoce.preparazione.voce === voceAmbrogio && (
                    <small className="j-nota">
                      Frasi pronte in archivio (gratis): {statoVoce.preparazione.pronte} di {statoVoce.preparazione.totali}
                      {statoVoce.preparazione.inCorso ? ' — le sto registrando…' : ''}
                    </small>
                  )}
                  {statoVoce.crediti && statoVoce.crediti.limite > 0 && (
                    <small className="j-nota">
                      Crediti usati questo mese: {statoVoce.crediti.usati.toLocaleString('it-IT')} di {statoVoce.crediti.limite.toLocaleString('it-IT')}
                      {statoVoce.crediti.rinnovo ? ` (si rinnovano il ${new Date(statoVoce.crediti.rinnovo).toLocaleDateString('it-IT')})` : ''}
                    </small>
                  )}
                </div>
              )}

              {motoreVoce === 'gemini' && statoVoce?.fornitore === 'gemini' && statoVoce.disponibile && (
                <div className="j-riga j-riga-colonna">
                  <label htmlFor="stile-voce">
                    Come deve parlare Ambrogio
                    <small>Spiega a parole accento, tono e ritmo (per esempio: «accento milanese stretto, da vecchio sciur, lento e ironico»). Vale per tutte le frasi.</small>
                  </label>
                  <textarea id="stile-voce" className="j-stile" rows={5} value={bozzaStile} onChange={(e) => setBozzaStile(e.target.value)} />
                  <div className="j-stile-tasti">
                    <button type="button" onClick={() => applicaStile(bozzaStile)} disabled={!bozzaStile.trim() || bozzaStile === stileVoce}>
                      Salva e prova
                    </button>
                    <button type="button" onClick={() => applicaStile('')} disabled={stileVoce === stilePredefinito}>
                      Torna allo stile iniziale
                    </button>
                  </div>
                </div>
              )}

              {motoreVoce === 'gemini' && statoVoce?.fornitore === 'elevenlabs' && statoVoce.disponibile && (
                <div className="j-riga j-riga-colonna">
                  <span>
                    Qualità della voce
                    <small>Veloce: risponde subito e consuma metà crediti. Massima: accento più fedele, un attimo più lenta.</small>
                  </span>
                  <div className="j-segmenti" role="group" aria-label="Qualità della voce">
                    <button type="button" aria-pressed={qualitaVoce === 'veloce'} onClick={() => setQualitaVoce('veloce')}>
                      Veloce
                    </button>
                    <button type="button" aria-pressed={qualitaVoce === 'massima'} onClick={() => setQualitaVoce('massima')}>
                      Massima
                    </button>
                  </div>
                </div>
              )}

              <div className="j-riga j-riga-colonna">
                <label htmlFor="scelta-voce">{motoreVoce === 'gemini' && statoVoce?.disponibile ? 'Voce di riserva (Edge)' : 'Voce'}</label>
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
                  <small className="j-nota">Per voci più naturali apri Ambrogio con Microsoft Edge: ha le voci italiane “Natural” gratuite (★).</small>
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

              {usaBackend && <ProvaMicrofono conGemini={Boolean(statoVoce?.trascrizione)} />}

              <label className="j-riga" htmlFor="ascolto-continuo">
                <span>
                  Attivazione con la voce
                  <small>Come Alexa: di’ «Uè Ambrogio, …» quando ti serve, anche mentre parla. «Uè Ambrogio, basta» lo ferma.</small>
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

              {usaBackend && <SezioneMemoria />}
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

        {conferme.map((c) => (
          <Conferma key={c.id} richiesta={c} onDecidi={(concedi, sempre) => decidi(c, concedi, sempre)} />
        ))}

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
            aria-label={inAttesa ? 'Parla con Ambrogio' : 'Interrompi'}
            title={inAttesa ? 'Parla (barra spaziatrice)' : 'Interrompi (Esc)'}
          >
            <Icona nome={inAttesa ? 'microfono' : 'stop'} />
          </button>
          <input
            ref={campo}
            id="comando"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Scrivi a Ambrogio…"
            aria-label="Scrivi a Ambrogio"
            autoComplete="off"
          />
          <button type="submit" className="j-invia" disabled={!testo.trim()} aria-label="Invia">
            <Icona nome="invia" />
          </button>
        </form>
      </aside>

      {pannelloCodice && !codiceAperto ? (
        <PannelloCodice
          onChiudi={() => mostraPannelloCodice(false)}
          onApriTutto={() => {
            setCodiceAperto(true)
            setCodiceNuovo(false)
          }}
        />
      ) : (
        !codiceAperto && (
          <button type="button" className="j-pc-riapri" onClick={() => mostraPannelloCodice(true)} title="Mostra la finestra del codice" aria-label="Mostra la finestra del codice">
            {'</>'}
          </button>
        )
      )}

      {codiceAperto && <Codice onChiudi={() => setCodiceAperto(false)} />}
      {salaAperta && <SalaMacchine onChiudi={() => setSalaAperta(false)} leggiStato={leggiStatoSala} />}
      <InstallaApp />

      {errore && (
        <div className="j-toast" role="status" data-fisso={erroreFisso || undefined}>
          <span>{errore}</span>
          <button
            type="button"
            onClick={() => {
              erroreFissoRef.current = false
              setErrore(null)
            }}
            aria-label="Chiudi il messaggio"
            title="Chiudi"
          >
            ✕
          </button>
          {erroreFisso && <small>Lo trovi anche in Menu → Registro.</small>}
        </div>
      )}
    </div>
  )
}
