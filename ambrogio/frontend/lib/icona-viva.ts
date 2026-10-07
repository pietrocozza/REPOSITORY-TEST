// L'icona della finestra che si muove: una piccola copia della rete neurale, aggiornata più volte al secondo.
// Le icone del desktop di Windows non possono muoversi, ma quella della finestra sì.

const LATO = 64
let tela: HTMLCanvasElement | null = null
let collegamento: HTMLLinkElement | null = null
let ultimo = 0

/** Da chiamare subito dopo aver disegnato la rete (nello stesso fotogramma) */
export function aggiornaIconaViva(rete: HTMLCanvasElement, colore: string, ogniMs = 250) {
  const ora = performance.now()
  if (ora - ultimo < ogniMs || document.hidden || !rete.width) return
  ultimo = ora
  try {
    tela ??= Object.assign(document.createElement('canvas'), { width: LATO, height: LATO })
    const ctx = tela.getContext('2d')
    if (!ctx) return
    // fondo scuro con gli angoli arrotondati, come l'icona del desktop
    ctx.clearRect(0, 0, LATO, LATO)
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, LATO, LATO, 14)
    ctx.clip()
    ctx.fillStyle = '#03090f'
    ctx.fillRect(0, 0, LATO, LATO)
    // la parte centrale della rete, più luminosa (due passate sommate)
    const lato = Math.min(rete.width, rete.height) * 0.62
    const x = rete.width / 2 - lato / 2
    const y = rete.height * 0.45 - lato / 2
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(rete, x, y, lato, lato, 0, 0, LATO, LATO)
    ctx.drawImage(rete, x, y, lato, lato, 0, 0, LATO, LATO)
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()
    // bordo del colore dello stato (azzurro a riposo, verde quando ascolta, viola quando parla…)
    ctx.strokeStyle = colore
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(1.5, 1.5, LATO - 3, LATO - 3, 13)
    ctx.stroke()

    if (!collegamento?.isConnected) {
      collegamento = Object.assign(document.createElement('link'), { rel: 'icon', type: 'image/png' })
      document.head.appendChild(collegamento)
    }
    // anche le icone fisse messe da Next.js diventano quella viva: il browser può scegliere qualunque
    const immagine = tela.toDataURL('image/png')
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => (l.href = immagine))
  } catch {
    // icona viva non disponibile: resta quella fissa
  }
}
