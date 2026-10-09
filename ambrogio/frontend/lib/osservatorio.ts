// L'Osservatorio della Sala macchine: una scena 3D in cui ogni cosa è un dato vero di Ambrogio.
//  - al centro il NUCLEO (Ambrogio): una sfera di particelle che respira, cambia colore con lo stato
//    e vibra con la sua voce (bande di frequenza) o con il microfono quando ascolta;
//  - sul pavimento il QUADRANTE DELLE 24 ORE: 48 torri, una per mezz'ora, alte quanto il lavoro fatto
//    in quella mezz'ora (dal registro), e la lancetta radar che indica l'ora di adesso;
//  - in orbita gli 8 MODULI: più sono usati più sono grandi; quello al lavoro manda un fascio al nucleo;
//  - le COMETE: ogni evento del registro parte dal suo modulo e vola verso il nucleo.
// Disegnato su canvas 2D con luce additiva: funziona anche dove la grafica 3D della scheda video non c'è.

import type { Modo } from '@/lib/nucleo-neurale'

export const MODULI = ['Linguaggio', 'Memoria', 'Ricerca', 'Email', 'Telefono', 'Voce', 'Pratiche', 'Affitti'] as const

export type EventoOsservatorio = { quando: string; tipo: string; descrizione: string }
export type DatiOsservatorio = {
  /** 48 mezz'ore: l'ultima è quella in corso */
  attivita: number[]
  /** quanto è usato ogni modulo (stesso ordine di MODULI) */
  uso: number[]
  disponibili: boolean[]
  eventi: EventoOsservatorio[]
}
export type IngressiOsservatorio = {
  modo: Modo
  livelloIn: number
  livelloOut: number
  bande: number[]
  settore: number
  selezione: number
  dati: DatiOsservatorio | null
}

const TAU = Math.PI * 2
const caso = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// colore del nucleo per stato [r, g, b]
const COLORE_STATO: Record<Modo, [number, number, number]> = {
  idle: [90, 200, 255],
  listening: [80, 255, 170],
  thinking: [255, 184, 77],
  working: [255, 140, 60],
  waiting: [245, 213, 71],
  speaking: [210, 236, 255],
  success: [90, 255, 150],
  error: [255, 77, 94],
}
const STATI: Record<Modo, { vel: number; luce: number; respiro: number }> = {
  idle: { vel: 0.18, luce: 0.6, respiro: 0.025 },
  listening: { vel: 0.3, luce: 0.85, respiro: 0.03 },
  thinking: { vel: 0.9, luce: 0.85, respiro: 0.035 },
  working: { vel: 1.1, luce: 0.95, respiro: 0.035 },
  waiting: { vel: 0.35, luce: 0.75, respiro: 0.03 },
  speaking: { vel: 0.55, luce: 1, respiro: 0.04 },
  success: { vel: 0.5, luce: 1, respiro: 0.03 },
  error: { vel: 0.25, luce: 0.7, respiro: 0.02 },
}
const COLORI_TIPO: Record<string, string> = {
  messaggio: '#4aa3ff',
  azione: '#ff9a3c',
  telefono: '#3dff9a',
  errore: '#ff4d5e',
  problema: '#ff4d5e',
  sistema: '#e8f1f5',
  voce: '#b48cff',
  autorizzazione: '#f5d547',
  memoria: '#2ad1c9',
  airbnb: '#ff6f91',
}
const COLORI_MODULO = ['#4aa3ff', '#2ad1c9', '#ff9a3c', '#f5d547', '#3dff9a', '#b48cff', '#7fe0ff', '#ff6f91']

/** da quale modulo arriva un evento del registro */
export function moduloEvento(e: EventoOsservatorio) {
  const d = e.descrizione.toLowerCase()
  if (/airbnb|prenotaz|ospit|casa|spes|guadagn|rendiment/.test(d) || e.tipo === 'airbnb') return 7
  if (/mail|posta|bozza|gmail/.test(d)) return 3
  if (/cerc|web|ricerca|pagina|search|fetch/.test(d)) return 2
  if (/pratic/.test(d)) return 6
  if (e.tipo === 'memoria' || /memoria|ricord/.test(d)) return 1
  if (e.tipo === 'telefono' || /telefon|chiamat/.test(d)) return 4
  if (e.tipo === 'voce' || /voce|ascolto/.test(d)) return 5
  if (e.tipo === 'messaggio' || e.tipo === 'autorizzazione') return 0
  return -1 // sistema ed errori generici: arrivano dal bordo del quadrante
}

type V3 = [number, number, number]
type Cometa = { da: number; nasce: number; colore: string; seme: number; durata: number; arrivata?: boolean }

// misure della scena (unità del mondo)
const R_NUCLEO = 0.36
const Y_NUCLEO = 0.62
const R_ORBITA = 1.02
const R_TORRI = 1.5
const R_QUADRANTE = 1.92

export class Osservatorio {
  private tela: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private leggi: () => IngressiOsservatorio
  private ridotto: boolean
  private raf = 0
  private ultimo = performance.now()
  private tempo = 0
  private w = 1
  private h = 1
  private dpr = 1
  // camera
  private az = 0.6
  private el = 0.5
  private dist = 4.3
  private fuoco = 1
  private cx = 0
  private cy = 0
  private mouse = { x: 0, y: 0 }
  private parallasse = { x: 0, y: 0 }
  // valori addolciti
  private s = { vel: 0.18, luce: 0.6, respiro: 0.025, audio: 0, ondeIn: 0, lampo: 0, colore: [90, 200, 255] as [number, number, number] }
  private giroNucleo = 0
  private giroOrbita = 0
  private altezze = new Array(48).fill(0)
  private onda = -1
  private modoPrima: Modo = 'idle'
  private comete: Cometa[] = []
  private visti = new Set<string>()
  private primaVolta = true
  private stelle: V3[]
  private puntiNucleo: { lat: number; lon: number; seme: number }[]
  private sprite = new Map<string, HTMLCanvasElement>()
  private nodi: { x: number; y: number; z: number; davanti: boolean }[] = []
  hover = -1
  fps = 60
  qualita: 'piena' | 'media' | 'leggera' = 'piena'
  private tempiFotogramma: number[] = []

  constructor(tela: HTMLCanvasElement, leggi: () => IngressiOsservatorio, opz: { ridotto?: boolean } = {}) {
    const ctx = tela.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas non disponibile')
    this.tela = tela
    this.ctx = ctx
    this.leggi = leggi
    this.ridotto = Boolean(opz.ridotto)
    // stelle lontane (fisse nel mondo: girano con la camera e danno profondità)
    this.stelle = Array.from({ length: this.ridotto ? 140 : 260 }, (_, i) => {
      const u = caso(i * 3.1) * TAU
      const v = Math.acos(2 * caso(i * 7.3) - 1)
      const r = 7 + caso(i * 1.7) * 4
      return [r * Math.sin(v) * Math.cos(u), r * Math.cos(v) * 0.7 + 1.5, r * Math.sin(v) * Math.sin(u)]
    })
    // il nucleo: punti distribuiti in modo uniforme sulla sfera (spirale di Fibonacci)
    const n = this.ridotto ? 420 : 760
    this.puntiNucleo = Array.from({ length: n }, (_, i) => {
      const y = 1 - (2 * (i + 0.5)) / n
      return { lat: Math.asin(y), lon: i * 2.39996323, seme: caso(i * 5.7) }
    })
    tela.addEventListener('pointermove', this.muovi)
    tela.addEventListener('pointerleave', this.esci)
    this.raf = requestAnimationFrame(this.disegna)
  }

  // ───────── proiezione ─────────

  private proietta(p: V3) {
    const ca = Math.cos(this.az)
    const sa = Math.sin(this.az)
    // giro attorno all'asse verticale, poi inclinazione della camera
    const x1 = p[0] * ca - p[2] * sa
    const z1 = p[0] * sa + p[2] * ca
    const y0 = p[1] - 0.45
    const ce = Math.cos(this.el)
    const se = Math.sin(this.el)
    const y2 = y0 * ce - z1 * se
    const z2 = y0 * se + z1 * ce
    const k = this.fuoco / (this.dist - z2)
    return { x: this.cx + x1 * k, y: this.cy - y2 * k, z: z2, k }
  }

  posizioniNodi() {
    return this.nodi.map((n, i) => ({ nome: MODULI[i], indice: i, x: n.x, y: n.y, davanti: n.davanti }))
  }

  private posizioneModulo(i: number): V3 {
    const a = (i / MODULI.length) * TAU + this.giroOrbita
    // orbita leggermente inclinata: i moduli salgono e scendono un poco
    return [Math.cos(a) * R_ORBITA, Y_NUCLEO + Math.sin(a + 0.8) * 0.16, Math.sin(a) * R_ORBITA]
  }

  private muovi = (e: PointerEvent) => {
    const b = this.tela.getBoundingClientRect()
    this.mouse.x = ((e.clientX - b.left) / b.width) * 2 - 1
    this.mouse.y = ((e.clientY - b.top) / b.height) * 2 - 1
    const px = e.clientX - b.left
    const py = e.clientY - b.top
    let migliore = -1
    let dMin = 20
    this.nodi.forEach((n, i) => {
      const d = Math.hypot(n.x - px, n.y - py)
      if (d < dMin) {
        dMin = d
        migliore = i
      }
    })
    this.hover = migliore
    this.tela.style.cursor = migliore >= 0 ? 'pointer' : 'default'
  }

  private esci = () => {
    this.mouse.x = 0
    this.mouse.y = 0
    this.hover = -1
  }

  /** onda di completamento */
  completa() {
    this.onda = 0
  }

  // un alone morbido, preparato una volta per colore e poi solo copiato (veloce)
  private alone(colore: string) {
    // i colori che cambiano piano (il nucleo tra due stati) si arrotondano: pochi aloni in memoria
    colore = colore.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, (_, r, g, b) => `rgb(${[r, g, b].map((x) => Math.min(255, Math.round(Number(x) / 16) * 16)).join(',')})`)
    let s = this.sprite.get(colore)
    if (s) return s
    s = document.createElement('canvas')
    s.width = s.height = 64
    const c = s.getContext('2d')!
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, colore)
    g.addColorStop(0.25, colore.replace(/rgb\(([^)]+)\)/, 'rgba($1,0.55)'))
    g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g
    c.fillRect(0, 0, 64, 64)
    this.sprite.set(colore, s)
    return s
  }

  private adatta() {
    const b = this.tela.getBoundingClientRect()
    const limite = this.qualita === 'piena' ? 2 : this.qualita === 'media' ? 1.5 : 1
    this.dpr = Math.min(window.devicePixelRatio || 1, limite)
    const w = Math.max(1, Math.round(b.width * this.dpr))
    const h = Math.max(1, Math.round(b.height * this.dpr))
    if (this.tela.width !== w || this.tela.height !== h) {
      this.tela.width = w
      this.tela.height = h
    }
    this.w = b.width
    this.h = b.height
    this.cx = b.width / 2
    this.cy = b.height * 0.48
    this.fuoco = Math.min(b.width * 0.86, b.height * 1.0)
  }

  private regolaQualita(dt: number) {
    this.tempiFotogramma.push(dt)
    if (this.tempiFotogramma.length < 60) return
    const medio = this.tempiFotogramma.reduce((a, b) => a + b, 0) / this.tempiFotogramma.length
    this.tempiFotogramma = []
    this.fps = Math.round(1000 / medio)
    if (medio > 26 && this.qualita !== 'leggera') this.qualita = this.qualita === 'piena' ? 'media' : 'leggera'
    else if (medio < 16 && this.qualita !== 'piena') this.qualita = this.qualita === 'leggera' ? 'media' : 'piena'
  }

  // nuovi eventi del registro → comete (la prima volta si rivedono gli ultimi, uno dopo l'altro)
  private nuoveComete(dati: DatiOsservatorio | null) {
    if (!dati) return
    const nuovi = dati.eventi.filter((e) => !this.visti.has(`${e.quando}|${e.descrizione}`))
    nuovi.forEach((e) => this.visti.add(`${e.quando}|${e.descrizione}`))
    const scelti = this.primaVolta ? nuovi.slice(-12) : nuovi.slice(-20)
    scelti.forEach((e, i) => {
      this.comete.push({
        da: moduloEvento(e),
        nasce: this.tempo + (this.primaVolta ? i * 0.55 : i * 0.12),
        colore: COLORI_TIPO[e.tipo] ?? '#8fa6b2',
        seme: caso(this.comete.length + i * 3.3 + this.tempo),
        durata: 1.5 + caso(i * 9.1) * 0.6,
      })
    })
    if (dati.eventi.length) this.primaVolta = false
  }

  private disegna = (ora: number) => {
    this.raf = requestAnimationFrame(this.disegna)
    if (document.hidden) return
    const dt = Math.min(100, ora - this.ultimo)
    this.ultimo = ora
    this.regolaQualita(dt)
    const sec = dt / 1000
    const lento = this.ridotto ? 0.35 : 1
    this.tempo += sec
    const ing = this.leggi()
    const dati = ing.dati
    const ob = STATI[ing.modo] ?? STATI.idle
    const k = 1 - Math.exp(-sec / 0.25)
    const s = this.s
    s.vel += (ob.vel * lento - s.vel) * k
    s.luce += (ob.luce - s.luce) * k
    s.respiro += (ob.respiro - s.respiro) * k
    const col = COLORE_STATO[ing.modo] ?? COLORE_STATO.idle
    s.colore = s.colore.map((c, i) => c + (col[i] - c) * k) as [number, number, number]
    const audio = ing.modo === 'speaking' ? Math.max(0, ing.livelloOut) : 0
    s.audio += (audio - s.audio) * (audio > s.audio ? 1 - Math.exp(-sec / 0.05) : 1 - Math.exp(-sec / 0.25))
    s.ondeIn += ((ing.modo === 'listening' ? ing.livelloIn : 0) - s.ondeIn) * (1 - Math.exp(-sec / 0.12))
    s.lampo *= Math.exp(-sec / 0.35)
    if (ing.modo === 'success' && this.modoPrima !== 'success') this.completa()
    this.modoPrima = ing.modo
    if (this.onda >= 0) {
      this.onda += sec / 1.6
      if (this.onda > 1) this.onda = -1
    }
    this.giroNucleo += sec * s.vel * 0.9
    this.giroOrbita += sec * (0.05 + s.vel * 0.04) * lento
    this.nuoveComete(dati)

    // camera: gira piano attorno alla scena, il cursore la sposta un poco
    const p = this.parallasse
    p.x += (this.mouse.x - p.x) * (1 - Math.exp(-sec / 0.4))
    p.y += (this.mouse.y - p.y) * (1 - Math.exp(-sec / 0.4))
    this.az = 0.6 + this.tempo * 0.035 * lento + p.x * 0.25
    this.el = 0.5 + p.y * 0.08 + Math.sin(this.tempo * 0.06) * 0.03 * lento
    this.adatta()

    const c = this.ctx
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    c.globalCompositeOperation = 'source-over'
    c.globalAlpha = 1
    c.fillStyle = '#04070c'
    c.fillRect(0, 0, this.w, this.h)
    // bagliore di fondo del colore dello stato
    const [r, g, b] = s.colore.map(Math.round)
    const centro = this.proietta([0, Y_NUCLEO, 0])
    const fondo = c.createRadialGradient(centro.x, centro.y, 0, centro.x, centro.y, Math.max(this.w, this.h) * 0.6)
    fondo.addColorStop(0, `rgba(${r},${g},${b},${0.1 + s.lampo * 0.15})`)
    fondo.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = fondo
    c.fillRect(0, 0, this.w, this.h)
    c.globalCompositeOperation = 'lighter'

    this.disegnaStelle()
    this.disegnaQuadrante(dati, ing)
    this.disegnaModuli(dati, ing, centro)
    this.disegnaComete(centro)
    this.disegnaNucleo(ing)
    c.globalCompositeOperation = 'source-over'
  }

  private disegnaStelle() {
    const c = this.ctx
    c.fillStyle = 'rgb(160,200,230)'
    const passo = this.qualita === 'leggera' ? 2 : 1
    for (let i = 0; i < this.stelle.length; i += passo) {
      const q = this.proietta(this.stelle[i])
      if (q.z > this.dist - 0.5) continue
      c.globalAlpha = 0.18 + 0.35 * caso(i * 4.1) * (0.6 + 0.4 * Math.sin(this.tempo * (0.5 + caso(i)) + i))
      const d = 0.6 + caso(i * 2.2) * 0.9
      c.fillRect(q.x, q.y, d, d)
    }
    c.globalAlpha = 1
  }

  private anello(raggio: number, y: number, colore: string, alpha: number, larghezza = 1) {
    const c = this.ctx
    c.beginPath()
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * TAU
      const q = this.proietta([Math.cos(a) * raggio, y, Math.sin(a) * raggio])
      if (i) c.lineTo(q.x, q.y)
      else c.moveTo(q.x, q.y)
    }
    c.strokeStyle = colore
    c.globalAlpha = alpha
    c.lineWidth = larghezza
    c.stroke()
    c.globalAlpha = 1
  }

  /** angolo sul quadrante di un'ora del giorno (le 0 in alto, in senso orario visto dall'alto) */
  private angoloOra(oreDelGiorno: number) {
    return (oreDelGiorno / 24) * TAU - Math.PI / 2
  }

  private disegnaQuadrante(dati: DatiOsservatorio | null, ing: IngressiOsservatorio) {
    const c = this.ctx
    const adesso = new Date()
    const oreAdesso = adesso.getHours() + adesso.getMinutes() / 60 + adesso.getSeconds() / 3600
    // anelli del pavimento
    this.anello(R_TORRI - 0.22, 0, 'rgb(70,140,190)', 0.25)
    this.anello(R_TORRI, 0, 'rgb(90,180,230)', 0.35)
    this.anello(R_QUADRANTE, 0, 'rgb(90,180,230)', 0.45, 1.2)
    this.anello(R_ORBITA * 0.55, 0, 'rgb(70,140,190)', 0.18)
    // tacche delle ore e le ore principali
    c.font = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    for (let o = 0; o < 24; o++) {
      const a = this.angoloOra(o)
      const lungo = o % 6 === 0
      const q1 = this.proietta([Math.cos(a) * R_QUADRANTE, 0, Math.sin(a) * R_QUADRANTE])
      const q2 = this.proietta([Math.cos(a) * (R_QUADRANTE + (lungo ? 0.14 : 0.06)), 0, Math.sin(a) * (R_QUADRANTE + (lungo ? 0.14 : 0.06))])
      c.strokeStyle = 'rgb(150,210,255)'
      c.globalAlpha = lungo ? 0.7 : 0.35
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(q1.x, q1.y)
      c.lineTo(q2.x, q2.y)
      c.stroke()
      if (lungo) {
        const qt = this.proietta([Math.cos(a) * (R_QUADRANTE + 0.3), 0, Math.sin(a) * (R_QUADRANTE + 0.3)])
        c.fillStyle = 'rgb(170,215,245)'
        c.globalAlpha = 0.75
        c.fillText(String(o).padStart(2, '0'), qt.x, qt.y)
      }
    }
    c.globalAlpha = 1

    // radar: la lancetta dell'ora di adesso e la scia che lascia
    const aOra = this.angoloOra(oreAdesso)
    for (let i = 0; i < 26; i++) {
      const a0 = aOra - (i / 26) * 0.9
      const a1 = aOra - ((i + 1) / 26) * 0.9
      const p0 = this.proietta([0, 0, 0])
      const p1 = this.proietta([Math.cos(a0) * R_QUADRANTE, 0, Math.sin(a0) * R_QUADRANTE])
      const p2 = this.proietta([Math.cos(a1) * R_QUADRANTE, 0, Math.sin(a1) * R_QUADRANTE])
      c.fillStyle = 'rgb(90,200,255)'
      c.globalAlpha = 0.07 * (1 - i / 26)
      c.beginPath()
      c.moveTo(p0.x, p0.y)
      c.lineTo(p1.x, p1.y)
      c.lineTo(p2.x, p2.y)
      c.closePath()
      c.fill()
    }
    const pc = this.proietta([0, 0, 0])
    const pl = this.proietta([Math.cos(aOra) * (R_QUADRANTE + 0.1), 0, Math.sin(aOra) * (R_QUADRANTE + 0.1)])
    c.strokeStyle = 'rgb(200,240,255)'
    c.globalAlpha = 0.8
    c.lineWidth = 1.3
    c.beginPath()
    c.moveTo(pc.x, pc.y)
    c.lineTo(pl.x, pl.y)
    c.stroke()
    c.globalAlpha = 1
    c.drawImage(this.alone('rgb(200,240,255)'), pl.x - 8, pl.y - 8, 16, 16)

    // onda di completamento sul pavimento
    if (this.onda >= 0) this.anello(this.onda * R_QUADRANTE * 1.1, 0, 'rgb(120,255,170)', (1 - this.onda) * 0.9, 2.5)

    // le torri: una per mezz'ora, nella posizione della sua ora sul quadrante
    const att = dati?.attivita ?? new Array(48).fill(0)
    const max = Math.max(1, ...att)
    const k = 1 - Math.exp(-0.05)
    for (let i = 0; i < 48; i++) {
      this.altezze[i] += ((att[i] ?? 0) / max - this.altezze[i]) * k
      const oreFa = (47 - i) * 0.5
      const centroSlot = oreAdesso - oreFa - 0.25
      const a = this.angoloOra(((centroSlot % 24) + 24) % 24)
      const v = this.altezze[i]
      const recente = i / 47
      const scintilla = 0.5 + 0.5 * Math.sin(this.tempo * 2 - i * 0.35)
      const alt = 0.03 + v * 0.95
      // colore: dalle mezz'ore vecchie (blu) a quelle recenti (ambra), la mezz'ora in corso bianca
      const col = i === 47 ? [230, 245, 255] : [Math.round(60 + recente * 195), Math.round(150 + recente * 30), Math.round(255 - recente * 175)]
      const base = this.proietta([Math.cos(a) * R_TORRI, 0, Math.sin(a) * R_TORRI])
      const cima = this.proietta([Math.cos(a) * R_TORRI, alt, Math.sin(a) * R_TORRI])
      const gr = c.createLinearGradient(base.x, base.y, cima.x, cima.y)
      gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.08)`)
      gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},${0.45 + v * 0.5})`)
      c.strokeStyle = gr
      c.lineWidth = Math.max(2, base.k * 0.035)
      c.beginPath()
      c.moveTo(base.x, base.y)
      c.lineTo(cima.x, cima.y)
      c.stroke()
      if (v > 0.02 || i === 47) {
        const d = 6 + v * 14 + (i === 47 ? 4 + scintilla * 4 : scintilla * 2)
        c.globalAlpha = 0.5 + v * 0.5
        c.drawImage(this.alone(`rgb(${col[0]},${col[1]},${col[2]})`), cima.x - d / 2, cima.y - d / 2, d, d)
        c.globalAlpha = 1
      }
    }
    void ing
  }

  private disegnaModuli(dati: DatiOsservatorio | null, ing: IngressiOsservatorio, centro: { x: number; y: number }) {
    const c = this.ctx
    const uso = dati?.uso ?? new Array(MODULI.length).fill(0)
    const maxUso = Math.max(1, ...uso)
    // l'orbita
    c.beginPath()
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * TAU
      const q = this.proietta([Math.cos(a) * R_ORBITA, Y_NUCLEO + Math.sin(a + 0.8) * 0.16, Math.sin(a) * R_ORBITA])
      if (i) c.lineTo(q.x, q.y)
      else c.moveTo(q.x, q.y)
    }
    c.strokeStyle = 'rgb(120,190,240)'
    c.globalAlpha = 0.22
    c.lineWidth = 1
    c.stroke()
    c.globalAlpha = 1

    const zNucleo = this.proietta([0, Y_NUCLEO, 0]).z
    this.nodi = MODULI.map((_, i) => {
      const pos = this.posizioneModulo(i)
      const q = this.proietta(pos)
      const acceso = i === ing.settore
      const scelto = i === ing.selezione || i === this.hover
      const disponibile = dati?.disponibili[i] ?? true
      const colore = disponibile ? COLORI_MODULO[i] : '#56656e'
      const rgb = hexRgb(colore)
      // filo verso il nucleo (e la sua ombra sul pavimento)
      const ombra = this.proietta([pos[0], 0, pos[2]])
      c.strokeStyle = colore
      c.globalAlpha = 0.08
      c.lineWidth = 1
      c.beginPath()
      c.moveTo(q.x, q.y)
      c.lineTo(ombra.x, ombra.y)
      c.stroke()
      c.globalAlpha = acceso ? 0.75 : scelto ? 0.45 : 0.14
      c.lineWidth = acceso ? 1.6 : 1
      c.beginPath()
      c.moveTo(q.x, q.y)
      c.lineTo(centro.x, centro.y)
      c.stroke()
      c.globalAlpha = 1
      // il modulo al lavoro: un fascio di particelle che va al nucleo
      if (acceso) {
        for (let j = 0; j < 14; j++) {
          const t = (this.tempo * 0.9 + j / 14) % 1
          const x = q.x + (centro.x - q.x) * t
          const y = q.y + (centro.y - q.y) * t - Math.sin(t * Math.PI) * 6
          const d = 5 + 5 * Math.sin(t * Math.PI)
          c.drawImage(this.alone(`rgb(${rgb})`), x - d / 2, y - d / 2, d, d)
        }
      }
      // il modulo: grande quanto è usato
      const misura = (disponibile ? 7 + 15 * Math.sqrt(uso[i] / maxUso) : 5) * (q.k / (this.fuoco / this.dist)) * (acceso ? 1.25 + 0.15 * Math.sin(this.tempo * 6) : 1)
      c.globalAlpha = disponibile ? 0.95 : 0.5
      c.drawImage(this.alone(`rgb(${rgb})`), q.x - misura, q.y - misura, misura * 2, misura * 2)
      c.fillStyle = '#ffffff'
      c.globalAlpha = disponibile ? 0.9 : 0.4
      c.beginPath()
      c.arc(q.x, q.y, Math.max(1.5, misura * 0.16), 0, TAU)
      c.fill()
      if (scelto || acceso) {
        c.strokeStyle = acceso ? '#ffd27a' : '#eaf5ff'
        c.globalAlpha = 0.85
        c.lineWidth = 1
        c.beginPath()
        c.arc(q.x, q.y, misura * 0.75 + 3, 0, TAU)
        c.stroke()
      }
      c.globalAlpha = 1
      return { x: q.x, y: q.y, z: q.z, davanti: q.z >= zNucleo }
    })
  }

  private disegnaComete(centro: { x: number; y: number }) {
    const c = this.ctx
    this.comete = this.comete.filter((m) => this.tempo - m.nasce < m.durata + 0.1)
    for (const m of this.comete) {
      const t = (this.tempo - m.nasce) / m.durata
      if (t < 0) continue
      // partenza: il modulo; per gli eventi di sistema un punto sul bordo del quadrante
      const a0 = m.seme * TAU
      const da = m.da >= 0 ? this.posizioneModulo(m.da) : ([Math.cos(a0) * R_QUADRANTE, 0.05, Math.sin(a0) * R_QUADRANTE] as V3)
      const arco = 0.35 + m.seme * 0.3
      const punto = (u: number): V3 => {
        const e = u * u * (3 - 2 * u)
        return [da[0] * (1 - e), da[1] + (Y_NUCLEO - da[1]) * e + Math.sin(u * Math.PI) * arco, da[2] * (1 - e)]
      }
      const rgb = hexRgb(m.colore)
      for (let j = 0; j < 12; j++) {
        const u = Math.max(0, Math.min(1, t - j * 0.025))
        const q = this.proietta(punto(u))
        const d = (j === 0 ? 14 : 9 - j * 0.6) * (q.k / (this.fuoco / this.dist))
        c.globalAlpha = (1 - j / 12) * (t > 0.92 ? (1 - t) / 0.08 : 1)
        c.drawImage(this.alone(`rgb(${rgb})`), q.x - d / 2, q.y - d / 2, d, d)
      }
      c.globalAlpha = 1
      // arrivo: il nucleo si illumina
      if (t >= 0.97 && !m.arrivata) {
        m.arrivata = true
        this.s.lampo = Math.min(1, this.s.lampo + 0.25)
      }
    }
    void centro
  }

  private disegnaNucleo(ing: IngressiOsservatorio) {
    const c = this.ctx
    const s = this.s
    const [r, g, b] = s.colore.map(Math.round)
    const bande = ing.modo === 'speaking' ? ing.bande : []
    const centro = this.proietta([0, Y_NUCLEO, 0])
    // alone del nucleo
    const raggioAlone = (R_NUCLEO * 3.2 + s.audio * 0.3 + s.lampo * 0.2) * centro.k
    c.globalAlpha = 0.35 + s.luce * 0.25 + s.lampo * 0.3
    c.drawImage(this.alone(`rgb(${r},${g},${b})`), centro.x - raggioAlone, centro.y - raggioAlone, raggioAlone * 2, raggioAlone * 2)
    c.globalAlpha = 1
    const passo = this.qualita === 'leggera' ? 2 : 1
    const respiro = 1 + Math.sin(this.tempo * 1.6) * s.respiro * 2
    for (let i = 0; i < this.puntiNucleo.length; i += passo) {
      const pt = this.puntiNucleo[i]
      const banda = bande.length ? (bande[Math.min(7, Math.floor(((pt.lat / Math.PI + 0.5) * 8) % 8))] ?? 0) : 0
      const onde = s.ondeIn * Math.sin(pt.lat * 10 - this.tempo * 9) * 0.1
      const rr = R_NUCLEO * respiro * (1 + banda * 0.45 * (0.6 + 0.4 * pt.seme) + onde + s.lampo * 0.06)
      const lon = pt.lon + this.giroNucleo * (1 + (pt.seme - 0.5) * 0.3)
      const cl = Math.cos(pt.lat)
      const q = this.proietta([Math.cos(lon) * cl * rr, Y_NUCLEO + Math.sin(pt.lat) * rr, Math.sin(lon) * cl * rr])
      const davanti = q.z > centro.z
      const lum = (davanti ? 0.85 : 0.3) * s.luce
      const d = (davanti ? 1.9 : 1.2) * (q.k / (this.fuoco / this.dist)) * (1 + banda)
      c.globalAlpha = Math.min(1, lum)
      c.fillStyle = pt.seme > 0.93 ? '#ffffff' : `rgb(${r},${g},${b})`
      c.fillRect(q.x - d / 2, q.y - d / 2, d, d)
    }
    // cuore luminoso
    const cuore = (R_NUCLEO * 0.9) * centro.k
    c.globalAlpha = 0.5 + s.lampo * 0.5 + s.audio * 0.3
    c.drawImage(this.alone('rgb(255,255,255)'), centro.x - cuore / 2, centro.y - cuore / 2, cuore, cuore)
    c.globalAlpha = 1
  }

  distruggi() {
    cancelAnimationFrame(this.raf)
    this.tela.removeEventListener('pointermove', this.muovi)
    this.tela.removeEventListener('pointerleave', this.esci)
  }
}

function hexRgb(h: string) {
  const n = Number.parseInt(h.slice(1), 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}
