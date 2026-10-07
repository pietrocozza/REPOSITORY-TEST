// La "pioggia digitale" di Matrix sullo sfondo della sezione Codice: segni verdi strani che scendono
// (katakana a mezza larghezza e simboli, come nel film: non lettere o numeri veri).
// Tre piani a velocità diverse danno profondità.

const CARATTERI = 'ｦｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝｰﾞﾟ¦╌∷⋮⌇⍿⎓⏁'
const COLORI = ['0,255,65', '0,255,65', '0,230,60', '40,255,110', '0,200,50', '120,255,150']

type Goccia = { x: number; y: number; velocita: number; piano: number; colore: string; testa: string; prossimoCambio: number }

export class Pioggia {
  private tela: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gocce: Goccia[] = []
  private larghezza = 0
  private altezza = 0
  private dpr = 1
  private ultimo = 0
  private animazione = 0
  private fermo: boolean
  private osservatore: ResizeObserver

  constructor(tela: HTMLCanvasElement) {
    this.tela = tela
    this.ctx = tela.getContext('2d')!
    this.fermo = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.osservatore = new ResizeObserver(() => this.adatta())
    this.osservatore.observe(tela)
    this.adatta()
    this.animazione = requestAnimationFrame(this.disegna)
  }

  private adatta() {
    const r = this.tela.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.larghezza = r.width
    this.altezza = r.height
    this.tela.width = Math.max(1, Math.round(r.width * this.dpr))
    this.tela.height = Math.max(1, Math.round(r.height * this.dpr))
    // una colonna ogni ~22px, divise fra tre piani
    const n = Math.round(r.width / 22)
    this.gocce = Array.from({ length: n }, (_, i) => this.nuova((i + Math.random()) * (r.width / n), Math.random() * r.height))
    // fondo pieno subito, così la scia parte da scuro
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.fillStyle = '#000300'
    this.ctx.fillRect(0, 0, this.larghezza, this.altezza)
  }

  private nuova(x: number, y = -20 - Math.random() * 300): Goccia {
    const piano = Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : 2
    return {
      x,
      y,
      piano,
      velocita: [28, 52, 90][piano] * (0.7 + Math.random() * 0.6),
      colore: COLORI[Math.floor(Math.random() * COLORI.length)],
      testa: this.carattere(),
      prossimoCambio: 0,
    }
  }

  private carattere() {
    return CARATTERI[Math.floor(Math.random() * CARATTERI.length)]
  }

  private disegna = (ora: number) => {
    this.animazione = requestAnimationFrame(this.disegna)
    const dt = Math.min(0.05, Math.max(0, (ora - (this.ultimo || ora)) / 1000))
    this.ultimo = ora
    if (this.fermo || document.hidden) return
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    // velo scuro: i caratteri già scritti sfumano lasciando una scia
    ctx.fillStyle = 'rgba(0, 3, 0, 0.085)'
    ctx.fillRect(0, 0, this.larghezza, this.altezza)

    for (const g of this.gocce) {
      const passo = [11, 14, 18][g.piano]
      const prima = Math.floor(g.y / passo)
      g.y += g.velocita * dt
      if (Math.floor(g.y / passo) === prima) continue
      // ogni volta che la goccia scende di un carattere ne scrive uno nuovo
      g.testa = this.carattere()
      ctx.font = `${passo - 2}px 'MS Gothic', 'Meiryo', 'Yu Gothic', ui-monospace, monospace`
      const alfa = [0.3, 0.5, 0.8][g.piano]
      ctx.shadowColor = `rgba(${g.colore}, ${alfa})`
      ctx.shadowBlur = g.piano === 2 ? 8 : 0
      ctx.fillStyle = `rgba(${g.colore}, ${alfa})`
      ctx.fillText(g.testa, g.x, g.y)
      // la testa è più chiara, come una scintilla
      if (g.piano > 0) {
        ctx.fillStyle = `rgba(210, 255, 220, ${alfa * 0.85})`
        ctx.fillText(g.testa, g.x, g.y)
      }
      ctx.shadowBlur = 0
      if (g.y > this.altezza + 40) Object.assign(g, this.nuova(g.x))
    }
  }

  distruggi() {
    cancelAnimationFrame(this.animazione)
    this.osservatore.disconnect()
  }
}
