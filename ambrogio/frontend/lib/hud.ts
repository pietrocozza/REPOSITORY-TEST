import { PALETTES, type Fotogramma } from '@/lib/nucleo-neurale'

// Anelli e tacche intorno alla rete, e l'onda del "canale vocale" (dall'interfaccia originale)

function fitCanvas(canvas: HTMLCanvasElement) {
  const box = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.round(box.width * dpr)
  const h = Math.round(box.height * dpr)
  if (w !== canvas.width || h !== canvas.height) {
    canvas.width = w
    canvas.height = h
  }
  return { w: box.width, h: box.height, dpr }
}

export function disegnaHud(
  hud: HTMLCanvasElement,
  onda: HTMLCanvasElement | null,
  frame: Fotogramma,
  fit: number,
  bande: Uint8Array | null,
) {
  const hctx = hud.getContext('2d')
  if (!hctx) return
  const { w, h, dpr } = fitCanvas(hud)
  if (!w || !h) return

  hctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  hctx.clearRect(0, 0, w, h)

  const cx = w * 0.5
  const cy = h * 0.45
  const radius = h * 0.323 * fit
  const color = PALETTES[frame.mode].css
  const time = frame.time

  hctx.strokeStyle = '#538192'
  hctx.lineWidth = 0.5
  hctx.globalAlpha = 0.25
  hctx.beginPath()
  hctx.moveTo(cx, h * 0.08)
  hctx.lineTo(cx, h * 0.08 + 12)
  hctx.moveTo(cx - radius - 40, cy)
  hctx.lineTo(cx - radius - 27, cy)
  hctx.moveTo(cx + radius + 27, cy)
  hctx.lineTo(cx + radius + 40, cy)
  hctx.stroke()

  hctx.save()
  hctx.translate(cx, cy)
  hctx.rotate(-0.16)
  hctx.globalAlpha = 0.2
  hctx.strokeStyle = color
  for (const [da, a] of [
    [0.3, 2.18],
    [2.44, 4.23],
    [4.6, 6.3],
  ]) {
    hctx.beginPath()
    hctx.ellipse(0, 0, radius * 1.23, radius * 0.92, 0, da, a)
    hctx.stroke()
  }

  hctx.globalAlpha = 0.15
  hctx.setLineDash([1, 8])
  hctx.beginPath()
  hctx.ellipse(0, 0, radius * 1.28, radius * 0.96, 0, 0, Math.PI * 2)
  hctx.stroke()
  hctx.setLineDash([])

  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * Math.PI * 2
    const r = radius * 1.3
    const length = i % 6 === 0 ? 5 : 2
    hctx.globalAlpha = i % 6 === 0 ? 0.28 : 0.12
    hctx.beginPath()
    hctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r * 0.75)
    hctx.lineTo(Math.cos(angle) * (r + length), Math.sin(angle) * (r + length) * 0.75)
    hctx.stroke()
  }

  hctx.globalAlpha = 0.75
  for (let i = 0; i < 3; i++) {
    const angle = time * 0.1 + i * 2.094
    hctx.fillStyle = color
    hctx.beginPath()
    hctx.arc(Math.cos(angle) * radius * 1.23, Math.sin(angle) * radius * 0.92, 1.3, 0, Math.PI * 2)
    hctx.fill()
  }
  hctx.restore()

  hctx.globalAlpha = 0.12
  hctx.strokeStyle = color
  hctx.beginPath()
  hctx.ellipse(cx, cy + radius * 0.88, radius * 0.9, radius * 0.135, 0, 0, Math.PI * 2)
  hctx.stroke()
  hctx.globalAlpha = 0.07
  hctx.beginPath()
  hctx.ellipse(cx, cy + radius * 0.88, radius * 0.96, radius * 0.16, 0, 0, Math.PI * 2)
  hctx.stroke()
  hctx.globalAlpha = 1

  if (!onda) return
  const wctx = onda.getContext('2d')
  if (!wctx) return
  const wf = fitCanvas(onda)
  if (wf.w <= 0) return
  wctx.setTransform(wf.dpr, 0, 0, wf.dpr, 0, 0)
  wctx.clearRect(0, 0, wf.w, wf.h)
  const center = wf.w / 2
  wctx.strokeStyle = color
  wctx.lineWidth = 1
  wctx.globalAlpha = 0.8
  for (let i = 0; i < 44; i++) {
    const x = (i * wf.w) / 44
    const envelope = Math.exp(-(((x - center) / center) ** 2) * 2.7)
    const amplitude = bande
      ? (bande[Math.floor((i / 44) * bande.length * 0.4)] / 255) * envelope
      : (0.16 + Math.abs(Math.sin(i * 0.53 + time * 3) * Math.cos(i * 0.17 - time * 2))) * frame.energy * envelope
    const height = 1 + amplitude * (wf.h - 6)
    wctx.beginPath()
    wctx.moveTo(x, (wf.h - height) / 2)
    wctx.lineTo(x, (wf.h + height) / 2)
    wctx.stroke()
  }
  wctx.globalAlpha = 1
}
