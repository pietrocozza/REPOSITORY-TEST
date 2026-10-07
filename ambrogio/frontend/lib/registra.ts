// Registra una frase dal microfono e si ferma da solo quando smetti di parlare.
// Serve al pulsante del microfono: l'audio va al backend, che lo fa trascrivere a Gemini.

type Registrazione = {
  /** l'audio della frase, oppure null se non hai detto niente */
  promessa: Promise<Blob | null>
  /** ferma subito e usa quello che è stato registrato */
  ferma: () => void
  /** butta via tutto */
  annulla: () => void
}

type Opzioni = {
  onLivello?: (livello: number) => void
  /** dopo quanto silenzio la frase è finita */
  silenzioMs?: number
  /** se non parli entro questo tempo, si rinuncia */
  attesaMaxMs?: number
  maxMs?: number
}

export function registraFrase({ onLivello, silenzioMs = 1300, attesaMaxMs = 7000, maxMs = 20000 }: Opzioni = {}): Registrazione {
  let fermaOra: (usa: boolean) => void = () => {}
  let annullata = false

  const promessa = new Promise<Blob | null>((risolvi) => {
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then((flusso) => {
        if (annullata) {
          flusso.getTracks().forEach((t) => t.stop())
          return risolvi(null)
        }
        const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t))
        const registratore = new MediaRecorder(flusso, tipo ? { mimeType: tipo } : undefined)
        const pezzi: Blob[] = []
        registratore.ondataavailable = (e) => e.data.size && pezzi.push(e.data)

        const ctx = new AudioContext()
        const analisi = ctx.createAnalyser()
        analisi.fftSize = 1024
        ctx.createMediaStreamSource(flusso).connect(analisi)
        const campioni = new Float32Array(analisi.fftSize)

        const inizio = Date.now()
        let fondo = Infinity // rumore di fondo: il livello più basso sentito finora (anche se parli subito)
        let parlato = false
        let ultimoSuono = Date.now()
        let usare = true
        let chiusa = false

        const chiudi = (usa: boolean) => {
          if (chiusa) return
          chiusa = true
          usare = usa && parlato && !annullata
          clearInterval(controllo)
          if (registratore.state !== 'inactive') registratore.stop()
          else fine()
        }
        const fine = () => {
          flusso.getTracks().forEach((t) => t.stop())
          ctx.close().catch(() => {})
          onLivello?.(0)
          risolvi(usare ? new Blob(pezzi, { type: registratore.mimeType || tipo || 'audio/webm' }) : null)
        }
        registratore.onstop = fine
        fermaOra = chiudi

        const controllo = setInterval(() => {
          analisi.getFloatTimeDomainData(campioni)
          let somma = 0
          for (const c of campioni) somma += c * c
          const rms = Math.sqrt(somma / campioni.length)
          onLivello?.(Math.min(1, rms * 8))
          const trascorso = Date.now() - inizio
          fondo = Math.min(fondo, rms)
          const soglia = Math.min(0.06, Math.max(0.015, fondo * 3))
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
      .catch(() => risolvi(null))
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
