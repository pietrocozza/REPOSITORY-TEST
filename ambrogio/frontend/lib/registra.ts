// Registra una frase dal microfono e si ferma da solo quando smetti di parlare.
// Serve al pulsante del microfono: l'audio va al backend, che lo fa trascrivere a Gemini.
// Se qualcosa non va, dice esattamente cosa (permesso, nessun microfono, microfono occupato, silenzio).

export type MotivoRegistrazione = 'ok' | 'permesso' | 'nessuno' | 'occupato' | 'silenzio' | 'annullata' | 'errore'

export type Esito = {
  audio: Blob | null
  motivo: MotivoRegistrazione
  /** il livello più alto sentito (0–1): se resta quasi a zero il microfono non capta nulla */
  livelloMax: number
  /** il nome del microfono usato da Windows */
  microfono: string
}

type Registrazione = {
  promessa: Promise<Esito>
  /** ferma subito e usa quello che è stato registrato */
  ferma: () => void
  /** butta via tutto */
  annulla: () => void
}

type Opzioni = {
  onLivello?: (livello: number) => void
  /** appena il microfono è aperto (con il suo nome) */
  onAperto?: (microfono: string) => void
  /** il microfono non si apre: probabilmente Edge sta chiedendo il permesso */
  onAttesaPermesso?: () => void
  /** dopo quanto silenzio la frase è finita */
  silenzioMs?: number
  /** se non parli entro questo tempo, si rinuncia */
  attesaMaxMs?: number
  maxMs?: number
}

const motivoErrore = (err: unknown): MotivoRegistrazione => {
  const nome = (err as { name?: string })?.name ?? ''
  if (nome === 'NotAllowedError' || nome === 'SecurityError') return 'permesso'
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') return 'nessuno'
  if (nome === 'NotReadableError' || nome === 'AbortError') return 'occupato'
  return 'errore'
}

export function registraFrase({ onLivello, onAperto, onAttesaPermesso, silenzioMs = 2500, attesaMaxMs = 7000, maxMs = 120000 }: Opzioni = {}): Registrazione {
  let fermaOra: (usa: boolean) => void = () => {}
  let annullata = false

  const promessa = new Promise<Esito>((risolvi) => {
    if (!navigator.mediaDevices?.getUserMedia) return risolvi({ audio: null, motivo: 'nessuno', livelloMax: 0, microfono: '' })
    const attesa = setTimeout(() => onAttesaPermesso?.(), 2500)
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .finally(() => clearTimeout(attesa))
      .then((flusso) => {
        const microfono = flusso.getAudioTracks()[0]?.label ?? ''
        if (annullata) {
          flusso.getTracks().forEach((t) => t.stop())
          return risolvi({ audio: null, motivo: 'annullata', livelloMax: 0, microfono })
        }
        onAperto?.(microfono)
        const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t))
        const registratore = new MediaRecorder(flusso, tipo ? { mimeType: tipo } : undefined)
        const pezzi: Blob[] = []
        registratore.ondataavailable = (e) => e.data.size && pezzi.push(e.data)

        const ctx = new AudioContext()
        ctx.resume().catch(() => {})
        const analisi = ctx.createAnalyser()
        analisi.fftSize = 1024
        ctx.createMediaStreamSource(flusso).connect(analisi)
        const campioni = new Float32Array(analisi.fftSize)

        const inizio = Date.now()
        let fondo = Infinity // rumore di fondo: il livello più basso sentito finora (anche se parli subito)
        let livelloMax = 0
        let parlato = false
        let ultimoSuono = Date.now()
        let motivo: MotivoRegistrazione = 'ok'
        let chiusa = false

        const chiudi = (usa: boolean) => {
          if (chiusa) return
          chiusa = true
          if (annullata) motivo = 'annullata'
          else if (!usa || !parlato) motivo = 'silenzio'
          clearInterval(controllo)
          if (registratore.state !== 'inactive') registratore.stop()
          else fine()
        }
        const fine = () => {
          flusso.getTracks().forEach((t) => t.stop())
          ctx.close().catch(() => {})
          onLivello?.(0)
          const audio = motivo === 'ok' ? new Blob(pezzi, { type: registratore.mimeType || tipo || 'audio/webm' }) : null
          risolvi({ audio, motivo, livelloMax, microfono })
        }
        registratore.onstop = fine
        fermaOra = chiudi

        const controllo = setInterval(() => {
          analisi.getFloatTimeDomainData(campioni)
          let somma = 0
          for (const c of campioni) somma += c * c
          const rms = Math.sqrt(somma / campioni.length)
          livelloMax = Math.max(livelloMax, rms)
          onLivello?.(Math.min(1, rms * 8))
          const trascorso = Date.now() - inizio
          fondo = Math.min(fondo, rms)
          const soglia = Math.min(0.06, Math.max(0.012, fondo * 3))
          if (rms > soglia) {
            parlato = true
            ultimoSuono = Date.now()
          }
          if (parlato && Date.now() - ultimoSuono > silenzioMs) chiudi(true)
          else if (!parlato && trascorso > attesaMaxMs) chiudi(false)
          else if (trascorso > maxMs) chiudi(true)
        }, 50)
        registratore.start(250)
      })
      .catch((err) => risolvi({ audio: null, motivo: annullata ? 'annullata' : motivoErrore(err), livelloMax: 0, microfono: '' }))
  })

  return {
    promessa,
    ferma: () => fermaOra(true),
    annulla: () => {
      annullata = true
      fermaOra(false)
    },
  }
}

/** Cosa dire a Pietro quando la registrazione non va, con il rimedio */
export function spiegaRegistrazione(e: Esito): string | null {
  switch (e.motivo) {
    case 'ok':
    case 'annullata':
      return null
    case 'permesso':
      return 'Il microfono è bloccato. In alto nella finestra di Ambrogio clicca sull’icona del microfono (o del lucchetto) e scegli «Consenti». Se non basta: Impostazioni di Windows → Privacy e sicurezza → Microfono, e attiva «Consenti alle app desktop di accedere al microfono».'
    case 'nessuno':
      return 'Windows non trova nessun microfono. Collegalo (o accendi quello delle cuffie) e riprova.'
    case 'occupato':
      return 'Il microfono è occupato da un altro programma (Teams, Zoom, Discord…) oppure Windows lo blocca. Chiudi gli altri programmi e riprova.'
    case 'silenzio':
      return e.livelloMax < 0.004
        ? `Il microfono${e.microfono ? ` «${e.microfono}»` : ''} non capta nessun suono: forse è spento (tasto muto) o Windows sta usando il microfono sbagliato. Controlla in Impostazioni di Windows → Sistema → Audio → Input.`
        : 'Non ho sentito parole. Parla subito dopo il suono, un po’ più forte e vicino al microfono.'
    default:
      return 'Non riesco ad aprire il microfono. Riprova; se continua, riavvia Ambrogio.'
  }
}

export const MESSAGGIO_PERMESSO =
  'Edge sta chiedendo il permesso per il microfono: guarda in alto nella finestra di Ambrogio (icona del microfono o del lucchetto) e premi «Consenti».'
