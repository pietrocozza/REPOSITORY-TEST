// Disegni della "Sala macchine": l'anello degli eventi di Ambrogio e i piccoli grafici, su canvas.
// Stile da laboratorio: fondo nero, filamenti luminosi, scritte piccole in monospazio.

export const COLORI_TIPO: Record<string, string> = {
  messaggio: '#4aa3ff',
  azione: '#ff9a3c',
  telefono: '#3dff9a',
  errore: '#ff4d5e',
  sistema: '#e8f1f5',
  voce: '#b48cff',
  autorizzazione: '#f5d547',
  memoria: '#2ad1c9',
  problema: '#ff4d5e',
}
export const coloreTipo = (tipo: string) => COLORI_TIPO[tipo] ?? '#8fa6b2'

export type Evento = { quando: string; tipo: string }

/** prepara il canvas alla sua misura reale (schermi ad alta densità compresi) */
export function adatta(tela: HTMLCanvasElement) {
  const r = tela.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const l = Math.max(1, Math.round(r.width * dpr))
  const a = Math.max(1, Math.round(r.height * dpr))
  if (tela.width !== l || tela.height !== a) {
    tela.width = l
    tela.height = a
  }
  const ctx = tela.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w: r.width, h: r.height }
}

// numeri pseudo-casuali stabili (ogni evento ha sempre la stessa forma)
const caso = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * L'anello: ogni evento del registro è un filamento che attraversa un toro inclinato, colorato per tipo.
 * Fuori, una frangia di raggi: più lunghi dove Ambrogio ha lavorato di più. I più recenti brillano.
 */
export function disegnaAnello(tela: HTMLCanvasElement, eventi: Evento[], tempo: number, energia: number) {
  const { ctx, w, h } = adatta(tela)
  ctx.clearRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.52
  const R = Math.min(w, h * 1.25) * 0.36
  const inclina = 0.82
  const rot = tempo * 0.00004
  const n = Math.max(eventi.length, 1)
  const ultimo = eventi.length ? new Date(eventi[eventi.length - 1].quando).getTime() : 0

  const punto = (ang: number, raggio: number, z = 0) => {
    const a = ang + rot
    return [cx + Math.cos(a) * raggio * (1 + z * 0.08), cy + Math.sin(a) * raggio * inclina + z * R * 0.06] as const
  }

  // anelli guida
  ctx.lineWidth = 1
  for (const k of [0.45, 0.62, 1.0]) {
    ctx.strokeStyle = `rgba(120,170,190,${k === 1 ? 0.12 : 0.18})`
    ctx.beginPath()
    ctx.ellipse(cx, cy, R * k, R * k * inclina, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'lighter'
  // frangia di raggi (attività): 360 raggi, la lunghezza segue gli eventi in quella zona dell'anello
  const densita = new Array(360).fill(0)
  eventi.forEach((_, i) => {
    const g = Math.floor((i / n) * 360)
    for (let d = -3; d <= 3; d++) densita[(g + d + 360) % 360] += 1 - Math.abs(d) / 4
  })
  const max = Math.max(1, ...densita)
  for (let g = 0; g < 360; g++) {
    const ang = (g / 360) * Math.PI * 2
    const lung = R * (0.06 + 0.22 * (densita[g] / max) * (0.7 + 0.3 * caso(g)) + 0.03 * energia * caso(g + tempo * 0.001))
    const [x1, y1] = punto(ang, R * 1.02)
    const [x2, y2] = punto(ang, R * 1.02 + lung)
    const caldo = g / 360 > 0.55
    ctx.strokeStyle = caldo ? `rgba(255,154,60,${0.25 + 0.35 * caso(g * 3)})` : `rgba(230,240,245,${0.18 + 0.3 * caso(g * 5)})`
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // filamenti: uno per evento, dalla parte esterna a quella interna dell'anello, più avanti nel giro
  eventi.forEach((e, i) => {
    const base = (i / n) * Math.PI * 2
    const giro = 0.6 + caso(i) * 1.4
    const a1 = base
    const a2 = base + giro
    const [x1, y1] = punto(a1, R * (0.95 + caso(i + 1) * 0.06))
    const [x2, y2] = punto(a2, R * (0.48 + caso(i + 2) * 0.12), 1)
    const [cx1, cy1] = punto(a1 + giro * 0.35, R * (1.05 + caso(i + 3) * 0.15), -1)
    const [cx2, cy2] = punto(a1 + giro * 0.75, R * (0.6 + caso(i + 4) * 0.2), 1)
    const eta = (ultimo - new Date(e.quando).getTime()) / 60_000 // minuti fa rispetto all'ultimo
    const fresco = Math.max(0, 1 - eta / 30)
    const respiro = 0.5 + 0.5 * Math.sin(tempo * 0.002 + i)
    ctx.strokeStyle = coloreTipo(e.tipo)
    ctx.globalAlpha = 0.16 + 0.5 * fresco * respiro + 0.12 * energia
    ctx.lineWidth = fresco > 0.5 ? 1.4 : 0.8
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2)
    ctx.stroke()
  })
  ctx.globalAlpha = 1

  // gli ultimi eventi: puntini rossi che pulsano
  eventi.slice(-6).forEach((e, k) => {
    const i = eventi.length - 6 + k
    const [x, y] = punto((Math.max(i, 0) / n) * Math.PI * 2, R * 0.97)
    ctx.fillStyle = `rgba(255,77,94,${0.5 + 0.5 * Math.sin(tempo * 0.006 + k)})`
    ctx.beginPath()
    ctx.arc(x, y, 2.4, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalCompositeOperation = 'source-over'

  // mirino sull'ultimo evento (lo indica il riquadro giallo)
  if (eventi.length) {
    const [x, y] = punto(((eventi.length - 1) / n) * Math.PI * 2, R * 0.97)
    return { x, y }
  }
  return null
}

/** onda quadra a gradini (attività) */
export function disegnaGradini(tela: HTMLCanvasElement, valori: number[], colore = '#e8f1f5') {
  const { ctx, w, h } = adatta(tela)
  ctx.clearRect(0, 0, w, h)
  const max = Math.max(1, ...valori)
  const passo = w / valori.length
  ctx.strokeStyle = colore
  ctx.lineWidth = 1.2
  ctx.beginPath()
  valori.forEach((v, i) => {
    const y = h - 2 - (v / max) * (h - 6)
    if (i === 0) ctx.moveTo(0, y)
    else ctx.lineTo(i * passo, y)
    ctx.lineTo((i + 1) * passo, y)
  })
  ctx.stroke()
  ctx.fillStyle = 'rgba(232,241,245,0.06)'
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.fill()
}

/** istogramma pieno (tempi di risposta) */
export function disegnaIstogramma(tela: HTMLCanvasElement, valori: number[], classi = 16) {
  const { ctx, w, h } = adatta(tela)
  ctx.clearRect(0, 0, w, h)
  if (!valori.length) return
  const max = Math.max(...valori, 1)
  const conta = new Array(classi).fill(0)
  for (const v of valori) conta[Math.min(classi - 1, Math.floor((v / max) * classi))]++
  const top = Math.max(1, ...conta)
  const passo = w / classi
  ctx.fillStyle = 'rgba(200,215,222,0.55)'
  conta.forEach((c, i) => {
    const alt = (c / top) * (h - 4)
    ctx.fillRect(i * passo + 1, h - alt, passo - 2, alt)
  })
}

/** barre verticali bicolori (strumenti, giorni) e linea opzionale sopra */
export function disegnaBarre(tela: HTMLCanvasElement, valori: number[], opz: { linea?: number[]; colori?: string[] } = {}) {
  const { ctx, w, h } = adatta(tela)
  ctx.clearRect(0, 0, w, h)
  const max = Math.max(1, ...valori, ...(opz.linea ?? []))
  const passo = w / Math.max(valori.length, 1)
  valori.forEach((v, i) => {
    const alt = (v / max) * (h - 8)
    ctx.fillStyle = opz.colori?.[i % opz.colori.length] ?? (i % 3 === 0 ? '#ff9a3c' : '#4aa3ff')
    ctx.fillRect(i * passo + passo * 0.18, h - alt, passo * 0.64, alt)
  })
  if (opz.linea) {
    ctx.strokeStyle = '#e8f1f5'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    opz.linea.forEach((v, i) => {
      const x = i * passo + passo / 2
      const y = h - 4 - (v / max) * (h - 8)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.fillStyle = '#e8f1f5'
    opz.linea.forEach((v, i) => {
      ctx.beginPath()
      ctx.arc(i * passo + passo / 2, h - 4 - (v / max) * (h - 8), 2, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

/** rosa a 24 petali: a che ora del giorno lavora Ambrogio */
export function disegnaRosa(tela: HTMLCanvasElement, perOra: number[], tempo: number) {
  const { ctx, w, h } = adatta(tela)
  ctx.clearRect(0, 0, w, h)
  const cx = w / 2
  const cy = h / 2
  const R = Math.min(w, h) * 0.4
  const max = Math.max(1, ...perOra)
  const adesso = new Date().getHours()
  ctx.strokeStyle = 'rgba(120,170,190,0.25)'
  for (const k of [0.33, 0.66, 1]) {
    ctx.beginPath()
    ctx.arc(cx, cy, R * k, 0, Math.PI * 2)
    ctx.stroke()
  }
  perOra.forEach((v, ora) => {
    const a0 = (ora / 24) * Math.PI * 2 - Math.PI / 2
    const a1 = a0 + (Math.PI * 2) / 24 - 0.03
    const r = R * (0.12 + 0.88 * (v / max))
    ctx.fillStyle = ora === adesso ? `rgba(255,154,60,${0.7 + 0.3 * Math.sin(tempo * 0.005)})` : ora >= 7 && ora < 20 ? 'rgba(74,163,255,0.75)' : 'rgba(74,163,255,0.35)'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1)
    ctx.closePath()
    ctx.fill()
  })
  ctx.fillStyle = '#05080c'
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#e8f1f5'
  ctx.stroke()
  ctx.fillStyle = '#e8f1f5'
  ctx.font = '9px ui-monospace, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`${String(adesso).padStart(2, '0')}h`, cx, cy)
  ctx.fillStyle = '#8fa6b2'
  for (const [testo, ora] of [['0', 0], ['6', 6], ['12', 12], ['18', 18]] as const) {
    const a = (ora / 24) * Math.PI * 2 - Math.PI / 2
    ctx.fillText(testo, cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8))
  }
}
