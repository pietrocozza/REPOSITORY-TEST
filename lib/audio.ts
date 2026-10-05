// Musica ed effetti sonori generati nel codice con la Web Audio API.
// Nessun file audio necessario: se però esiste public/audio/tema.mp3,
// viene usato quello al posto del motivetto generato.

type Stato = { enabled: boolean; playing: boolean }

const PREF_KEY = 'bp-audio' // "on" / "off": ricorda la scelta per le visite successive
const MASTER_VOLUME = 0.13
const BPM = 140
const STEP = 60 / BPM / 2 // durata di un ottavo

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

// Melodia stile diner / videogioco anni '80: 4 battute da 8 ottavi (C – Am – F – G).
// I numeri sono note MIDI, null è una pausa.
const MELODIA: (number | null)[] = [
  76, 79, 84, 79, 76, 79, 81, 79,
  76, null, 72, 76, 81, null, 79, 76,
  77, 81, 84, 81, 77, 81, 84, 86,
  83, null, 79, null, 74, 79, 83, null,
]
const BASSO = [48, 45, 41, 43] // una nota fondamentale per battuta

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
    this.musica.connect(this.master)
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

  // ───────── motivetto generato ─────────
  private startSequencer() {
    const ctx = this.ctx!
    this.step = 0
    this.nextTime = ctx.currentTime + 0.05
    this.timer = setInterval(() => {
      // programma le note con un piccolo anticipo: niente scatti anche se la pagina è impegnata
      while (this.nextTime < ctx.currentTime + 0.12) {
        this.scheduleStep(this.step, this.nextTime)
        this.nextTime += STEP
        this.step = (this.step + 1) % 32
      }
    }, 25)
  }

  private scheduleStep(step: number, t: number) {
    const battuta = Math.floor(step / 8)
    const pos = step % 8
    const nota = MELODIA[step]
    if (nota !== null) this.tone(midi(nota), t, STEP * 0.9, 'square', 0.07)
    // basso: fondamentale e ottava, alternati
    this.tone(midi(BASSO[battuta] + (pos % 2 ? 12 : 0)), t, STEP * 0.8, 'triangle', 0.22)
    // percussioni leggere
    if (pos === 0 || pos === 4) this.kick(t)
    if (pos === 2 || pos === 6) this.noiseHit(t, 1800, 0.12, 0.09)
    if (pos % 2 === 1) this.noiseHit(t, 7000, 0.035, 0.04)
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(dest ?? this.musica!)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  private kick(t: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.setValueAtTime(140, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
    g.gain.setValueAtTime(0.35, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    o.connect(g).connect(this.musica!)
    o.start(t)
    o.stop(t + 0.16)
  }

  private noiseHit(t: number, freq: number, dur: number, vol: number, dest?: AudioNode) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const f = ctx.createBiquadFilter()
    f.type = freq > 4000 ? 'highpass' : 'bandpass'
    f.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(dest ?? this.musica!)
    src.start(t)
    src.stop(t + dur + 0.02)
  }

  // ───────── effetti sonori (seguono lo stesso interruttore) ─────────
  private canPlaySfx() {
    return !!this.ctx && this.stato.enabled && this.ctx.state === 'running'
  }

  /** "pop": uno strato del panino si stacca */
  pop() {
    if (!this.canPlaySfx()) return
    const ctx = this.ctx!
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(700 + Math.random() * 200, t)
    o.frequency.exponentialRampToValueAtTime(160, t + 0.09)
    g.gain.setValueAtTime(0.5, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o.connect(g).connect(this.master!)
    o.start(t)
    o.stop(t + 0.14)
    this.noiseHit(t, 3000, 0.03, 0.15, this.master!)
  }

  /** "ding": un panino entra nel carrello */
  ding() {
    if (!this.canPlaySfx()) return
    const t = this.ctx!.currentTime
    this.tone(1318.5, t, 0.7, 'sine', 0.35, this.master!)
    this.tone(1975.5, t + 0.08, 0.6, 'sine', 0.2, this.master!)
  }
}

export const audio = new AudioEngine()
