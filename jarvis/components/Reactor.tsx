'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { Stato } from '@/lib/stato'

// Il "nucleo" olografico al centro: anelli che ruotano e barre che seguono la voce.
// Le barre si aggiornano a 60fps direttamente nel DOM (niente re-render di React).

const C = 300 // centro del disegno (viewBox 600×600)
const BARRE = 96
const R_BARRE = 196

function punto(r: number, gradi: number) {
  const a = ((gradi - 90) * Math.PI) / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}

function arco(r: number, da: number, a: number) {
  const p1 = punto(r, da)
  const p2 = punto(r, a)
  const grande = a - da > 180 ? 1 : 0
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${grande} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
}

// Geometria fissa, calcolata una volta sola
const TACCHE = Array.from({ length: 120 }, (_, i) => {
  const lunga = i % 10 === 0
  const p1 = punto(292, i * 3)
  const p2 = punto(lunga ? 270 : 282, i * 3)
  return { ...p1, x2: p2.x, y2: p2.y, lunga }
})
const SEGMENTI = Array.from({ length: 12 }, (_, i) => arco(178, i * 30 + 3, i * 30 + 27))
const ANGOLI_BARRE = Array.from({ length: BARRE }, (_, i) => (i * 360) / BARRE)

const ETICHETTE: Record<Stato, string> = {
  spento: 'IN ATTESA',
  pronto: 'IN LINEA',
  ascolto: 'ASCOLTO',
  elaborazione: 'ELABORAZIONE',
  risposta: 'RISPOSTA',
}

export default function Reactor({
  stato,
  livelloRef,
  errore,
  onClick,
}: {
  stato: Stato
  livelloRef: RefObject<number>
  errore: boolean
  onClick: () => void
}) {
  const radice = useRef<HTMLButtonElement>(null)
  const barre = useRef<(SVGLineElement | null)[]>([])
  const statoRef = useRef(stato)

  useEffect(() => {
    statoRef.current = stato
  }, [stato])

  useEffect(() => {
    const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let liscio = 0
    let raf = 0
    const ciclo = (t: number) => {
      const s = statoRef.current
      // livello "vero" (microfono / voce) + un respiro di fondo quando è a riposo
      let obiettivo = livelloRef.current ?? 0
      if (s === 'pronto') obiettivo = Math.max(obiettivo, 0.08 + 0.05 * Math.sin(t / 900))
      if (s === 'elaborazione') obiettivo = Math.max(obiettivo, 0.25 + 0.15 * Math.sin(t / 160))
      liscio += (obiettivo - liscio) * 0.18
      radice.current?.style.setProperty('--l', liscio.toFixed(3))

      for (let i = 0; i < BARRE; i++) {
        const el = barre.current[i]
        if (!el) continue
        let rumore = 0.5 + 0.5 * Math.sin(i * 0.9 + t / 140) * Math.cos(i * 0.37 - t / 230)
        if (s === 'elaborazione') {
          // un'onda che gira intorno al nucleo
          const fase = ((t / 4) % 360) - ANGOLI_BARRE[i]
          rumore = Math.max(0, Math.cos((fase * Math.PI) / 180)) ** 6
        }
        const lung = 3 + liscio * 46 * (0.25 + 0.75 * rumore)
        const p = punto(R_BARRE + lung, ANGOLI_BARRE[i])
        el.setAttribute('x2', p.x.toFixed(1))
        el.setAttribute('y2', p.y.toFixed(1))
      }
      if (!ridotto) raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    return () => cancelAnimationFrame(raf)
  }, [livelloRef])

  return (
    <button
      ref={radice}
      type="button"
      className="reactor"
      data-stato={stato}
      data-errore={errore || undefined}
      onClick={onClick}
      aria-label={stato === 'ascolto' ? 'Smetti di ascoltare' : 'Parla con Jarvis'}
    >
      <svg viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <radialGradient id="nucleo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--bianco-ciano)" stopOpacity="0.95" />
            <stop offset="35%" stopColor="var(--ciano)" stopOpacity="0.55" />
            <stop offset="75%" stopColor="var(--ciano-scuro)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--ciano-scuro)" stopOpacity="0" />
          </radialGradient>
          <filter id="bagliore" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#bagliore)" className="tratto">
          {/* tacche esterne */}
          <g className="gira lento">
            {TACCHE.map((t, i) => (
              <line key={i} x1={t.x} y1={t.y} x2={t.x2} y2={t.y2} strokeWidth={t.lunga ? 2.4 : 1} opacity={t.lunga ? 0.9 : 0.45} />
            ))}
          </g>

          {/* anello sottile con archi spessi */}
          <g className="gira inverso medio">
            <circle cx={C} cy={C} r={258} fill="none" strokeWidth={1} opacity={0.35} />
            <path d={arco(258, 10, 70)} fill="none" strokeWidth={6} opacity={0.85} />
            <path d={arco(258, 130, 160)} fill="none" strokeWidth={6} opacity={0.6} />
            <path d={arco(258, 220, 320)} fill="none" strokeWidth={3} opacity={0.75} />
          </g>

          {/* barre audio */}
          <g className="barre">
            {ANGOLI_BARRE.map((a, i) => {
              const p = punto(R_BARRE, a)
              return (
                <line
                  key={i}
                  ref={(el) => {
                    barre.current[i] = el
                  }}
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={p.y}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              )
            })}
          </g>

          {/* anello a segmenti */}
          <g className="gira lento-2">
            {SEGMENTI.map((d, i) => (
              <path key={i} d={d} fill="none" strokeWidth={12} opacity={i % 3 === 0 ? 0.85 : 0.35} />
            ))}
          </g>

          {/* anello tratteggiato veloce */}
          <g className="gira inverso veloce">
            <circle cx={C} cy={C} r={150} fill="none" strokeWidth={2} strokeDasharray="2 10" opacity={0.8} />
            <path d={arco(140, 0, 90)} fill="none" strokeWidth={2} opacity={0.9} />
            <path d={arco(140, 180, 270)} fill="none" strokeWidth={2} opacity={0.9} />
          </g>
        </g>

        {/* nucleo luminoso */}
        <g className="nucleo">
          <circle cx={C} cy={C} r={125} fill="url(#nucleo)" />
          <circle cx={C} cy={C} r={96} fill="none" className="tratto" strokeWidth={1.5} opacity={0.7} />
          <polygon
            points={[0, 120, 240].map((g) => { const p = punto(78, g); return `${p.x},${p.y}` }).join(' ')}
            fill="none"
            className="tratto"
            strokeWidth={3}
            opacity={0.55}
          />
        </g>

        <text x={C} y={C - 4} className="sigla" textAnchor="middle">
          J.A.R.V.I.S.
        </text>
        <text x={C} y={C + 26} className="etichetta-stato" textAnchor="middle">
          {errore ? 'ANOMALIA' : ETICHETTE[stato]}
        </text>
      </svg>
    </button>
  )
}
