// Musica di sottofondo generata nel codice con la Web Audio API:
// un giro lounge / soul lento e caldo (piano elettrico, basso morbido, spazzole).
// Se esiste public/audio/tema.mp3, viene usato quello al posto del brano generato.

type Stato = { enabled: boolean; playing: boolean }

const PREF_KEY = 'bp-audio' // "on" / "off": ricorda la scelta per le visite successive
const MASTER_VOLUME = 0.11
const BPM = 76
const STEP = 60 / BPM / 2 // durata di un ottavo
const SWING = 0.14 // gli ottavi "in levare" arrivano un po' in ritardo

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

// Giro di 4 battute: Rem9 – Sol13 – Domaj9 – Lam9 (note MIDI degli accordi e del basso)
const ACCORDI = [
  [53, 57, 60, 64],
  [53, 59, 64, 69],
  [52, 55, 59, 62],
  [55, 60, 64, 71],
]
const BASSO = [38, 43, 36, 45]

class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musica: GainNode | null = null
  private noise: AudioBuffer | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private step = 0
  private nextTime = 0
  private mp3: HTMLAudioElement | null = null
  private started = false
  private initialized = false
  private listeners = new Set<() => void>()
  private stato: Stato = { enabled: true, playing: false }

  // ───────── stato per l'interfaccia (icona audio) ─────────
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  getSnapshot = () => this.stato
  private set(patch: Partial<Stato>) {
    this.stato = { ...this.stato, ...patch }
    this.listeners.forEach((fn) => fn())
  }

  /** Da chiamare una volta all'apertura della pagina */
  init() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true
    let pref: string | null = null
    try {
      pref = localStorage.getItem(PREF_KEY)
    } catch {}
    this.set({ enabled: pref !== 'off' })

    document.addEventListener('visibilitychange', this.onVisibility)
    if (!this.stato.enabled) return

    // 1° tentativo: avvio automatico (quasi sempre bloccato dai browser)
    this.start().catch(() => {})
    // 2° tentativo: al primo clic, tocco o tasto in qualsiasi punto della pagina
    const unlock = () => {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
      window.removeEventListener('touchstart', unlock, true)
      if (this.stato.enabled && !this.stato.playing) this.start().catch(() => {})
    }
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
    window.addEventListener('touchstart', unlock, true)
  }

  private ensureContext() {
    if (this.ctx) return this.ctx
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)
    this.musica = ctx.createGain()
    this.musica.gain.value = 1
    const caldo = ctx.createBiquadFilter()
    caldo.type = 'lowpass'
    caldo.frequency.value = 3200
    this.musica.connect(caldo).connect(this.master)
    // rumore bianco per le percussioni
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    this.noise = buf
    this.ctx = ctx
    return ctx
  }

  /** Avvia (o riprende) la musica con dissolvenza in entrata di 1 secondo */
  async start() {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') await ctx.resume()
    if (ctx.state !== 'running') throw new Error('bloccato dal browser')

    if (!this.started) {
      this.started = true
      const haMp3 = await this.checkMp3()
      if (haMp3) this.playMp3()
      else this.startSequencer()
    } else if (this.mp3) {
      this.mp3.play().catch(() => {})
    }
    const g = this.master!.gain
    g.cancelScheduledValues(ctx.currentTime)
    g.setValueAtTime(g.value, ctx.currentTime)
    g.linearRampToValueAtTime(MASTER_VOLUME, ctx.currentTime + 1)
    this.set({ playing: true })
  }

  /** Spegne con una breve dissolvenza */
  stop() {
    const ctx = this.ctx
    this.set({ playing: false })
    if (!ctx || !this.master) return
    const g = this.master.gain
    g.cancelScheduledValues(ctx.currentTime)
    g.setValueAtTime(g.value, ctx.currentTime)
    g.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
    setTimeout(() => {
      if (!this.stato.playing) {
        this.mp3?.pause()
        ctx.suspend().catch(() => {})
      }
    }, 350)
  }

  /** Interruttore dell'icona audio */
  toggle() {
    // Se l'utente aveva la musica "accesa" ma il browser l'ha bloccata,
    // il clic sull'icona la avvia invece di spegnerla.
    if (this.stato.enabled && !this.stato.playing) {
      this.start().catch(() => {})
      return
    }
    const enabled = !this.stato.enabled
    this.set({ enabled })
    try {
      localStorage.setItem(PREF_KEY, enabled ? 'on' : 'off')
    } catch {}
    if (enabled) this.start().catch(() => {})
    else this.stop()
  }

  private onVisibility = () => {
    if (!this.ctx || !this.stato.enabled || !this.started) return
    if (document.hidden) {
      this.mp3?.pause()
      this.ctx.suspend().catch(() => {})
    } else if (this.stato.playing) {
      this.ctx.resume().catch(() => {})
      this.mp3?.play().catch(() => {})
    }
  }

  // ───────── file mp3 opzionale ─────────
  private async checkMp3() {
    try {
      const r = await fetch('/audio/tema.mp3', { method: 'HEAD' })
      return r.ok && (r.headers.get('content-type') ?? '').includes('audio')
    } catch {
      return false
    }
  }
  private playMp3() {
    const el = new Audio('/audio/tema.mp3')
    el.loop = true
    el.crossOrigin = 'anonymous'
    this.ctx!.createMediaElementSource(el).connect(this.musica!)
    el.play().catch(() => {})
    this.mp3 = el
  }

  // ───────── brano generato ─────────
  private startSequencer() {
    const ctx = this.ctx!
    this.step = 0
    this.nextTime = ctx.currentTime + 0.05
    this.timer = setInterval(() => {
      // le note vengono programmate con un piccolo anticipo: niente scatti
      while (this.nextTime < ctx.currentTime + 0.15) {
        const t = this.nextTime + (this.step % 2 ? STEP * SWING : 0)
        this.scheduleStep(this.step, t)
        this.nextTime += STEP
        this.step = (this.step + 1) % 32
      }
    }, 30)
  }

  private scheduleStep(step: number, t: number) {
    const battuta = Math.floor(step / 8)
    const pos = step % 8
    const accordo = ACCORDI[battuta]
    // piano elettrico: accordo pieno sul primo tempo, ripresa leggera in levare
    if (pos === 0) accordo.forEach((n, k) => this.piano(midi(n), t + k * 0.012, 2.6, 0.055))
    if (pos === 3 || pos === 6) accordo.forEach((n) => this.piano(midi(n), t, 0.9, 0.028))
    // basso morbido
    if (pos === 0) this.basso(midi(BASSO[battuta]), t, STEP * 3.6)
    if (pos === 4) this.basso(midi(BASSO[battuta] + 7), t, STEP * 2.4)
    // batteria discreta: cassa piano, rullante con spazzola, piatto leggero
    if (pos === 0 || pos === 5) this.kick(t)
    if (pos === 2 || pos === 6) this.noiseHit(t, 1400, 0.16, 0.035)
    this.noiseHit(t, 7500, 0.05, pos % 2 ? 0.012 : 0.02)
  }

  /** suono di piano elettrico: fondamentale + armonica "a campanella" + tremolo */
  private piano(freq: number, t: number, dur: number, vol: number) {
    const ctx = this.ctx!
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    const trem = ctx.createGain()
    trem.gain.value = 1
    const lfo = ctx.createOscillator()
    const lfoG = ctx.createGain()
    lfo.frequency.value = 4.5
    lfoG.gain.value = 0.12
    lfo.connect(lfoG).connect(trem.gain)
    const o1 = ctx.createOscillator()
    o1.type = 'sine'
    o1.frequency.value = freq
    const o2 = ctx.createOscillator()
    o2.type = 'sine'
    o2.frequency.value = freq * 4
    const g2 = ctx.createGain()
    g2.gain.setValueAtTime(0.18, t)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    o1.connect(g)
    o2.connect(g2).connect(g)
    g.connect(trem).connect(this.musica!)
    ;[o1, o2, lfo].forEach((o) => {
      o.start(t)
      o.stop(t + dur + 0.05)
    })
  }

  private basso(freq: number, t: number, dur: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const f = ctx.createBiquadFilter()
    const g = ctx.createGain()
    o.type = 'triangle'
    o.frequency.value = freq
    f.type = 'lowpass'
    f.frequency.value = 420
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(f).connect(g).connect(this.musica!)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  private kick(t: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(90, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.15)
    g.gain.setValueAtTime(0.2, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
    o.connect(g).connect(this.musica!)
    o.start(t)
    o.stop(t + 0.3)
  }

  private noiseHit(t: number, freq: number, dur: number, vol: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const f = ctx.createBiquadFilter()
    f.type = freq > 4000 ? 'highpass' : 'bandpass'
    f.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(this.musica!)
    src.start(t)
    src.stop(t + dur + 0.02)
  }
}

export const audio = new AudioEngine()
