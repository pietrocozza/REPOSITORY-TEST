'use client'

import { useEffect, useState } from 'react'

const CHIAVE = 'caricamento-visto'
const DURATA_MINIMA = 1100
const DURATA_MASSIMA = 2600

/** Gattino romano che spinge la barra: disegno originale, zampe animate con CSS */
function Gattino() {
  return (
    <svg viewBox="0 0 64 48" className="h-16 w-[5.3rem]" aria-hidden="true">
      <g className="caricamento-zampe-dietro" fill="#1d2236">
        <rect x="14" y="34" width="5" height="10" rx="2.5" />
        <rect x="24" y="34" width="5" height="10" rx="2.5" />
      </g>
      <path d="M8 26c-6-2-8-10-3-14" fill="none" stroke="#1d2236" strokeWidth="4" strokeLinecap="round" className="caricamento-coda" />
      <ellipse cx="26" cy="28" rx="18" ry="11" fill="#f7b538" />
      <path d="M18 20c2 3 2 8 0 12M26 18c2 4 2 10 0 15" fill="none" stroke="#e09a1f" strokeWidth="2.5" strokeLinecap="round" />
      <g className="caricamento-zampe-avanti" fill="#1d2236">
        <rect x="36" y="34" width="5" height="10" rx="2.5" />
      </g>
      <circle cx="44" cy="20" r="11" fill="#f7b538" />
      <path d="M36 13l2-9 6 6zM50 10l4-7 1 10z" fill="#f7b538" />
      <path d="M38 10l1-4 3 3zM51 8l2-3 0 5z" fill="#d9481f" />
      <rect x="53" y="22" width="9" height="5" rx="2.5" fill="#1d2236" />
      <circle cx="47" cy="18" r="1.8" fill="#1d2236" />
      <circle cx="41" cy="18" r="1.8" fill="#1d2236" />
      <path d="M43 23q1 1.5 2 0" fill="none" stroke="#1d2236" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="38.5" cy="22" r="1.6" fill="#d9481f" opacity=".5" />
    </svg>
  )
}

/** Schermata di caricamento al primo ingresso: una barra che arriva al 100% spinta dal gattino */
export default function Caricamento() {
  const [percento, setPercento] = useState(0)
  const [visibile, setVisibile] = useState(true)

  useEffect(() => {
    let gia = false
    try {
      gia = sessionStorage.getItem(CHIAVE) === '1'
    } catch {}
    // nascosta già dal CSS (classe senza-caricamento): non serve animarla
    if (gia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const inizio = performance.now()
    let caricato = document.readyState === 'complete'
    const onLoad = () => (caricato = true)
    window.addEventListener('load', onLoad)
    let frame = 0
    const passo = (ora: number) => {
      const t = ora - inizio
      // sale veloce fino al 90%, poi aspetta che la pagina sia pronta
      const obiettivo = caricato && t > DURATA_MINIMA ? 100 : Math.min(90, (t / DURATA_MINIMA) * 90)
      setPercento((p) => Math.max(p, Math.min(100, p + (obiettivo - p) * 0.12 + 0.4)))
      if (t > DURATA_MASSIMA) caricato = true
      frame = requestAnimationFrame(passo)
    }
    frame = requestAnimationFrame(passo)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  useEffect(() => {
    if (percento < 100) return
    try {
      sessionStorage.setItem(CHIAVE, '1')
    } catch {}
    const t = setTimeout(() => setVisibile(false), 350)
    return () => clearTimeout(t)
  }, [percento])

  if (!visibile) return null
  const p = Math.round(percento)

  return (
    <div
      id="caricamento"
      role="progressbar"
      aria-label="Caricamento del sito"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-crema px-6 transition-opacity duration-300 ${p >= 100 ? 'opacity-0' : 'opacity-100'}`}
    >
      <p className="font-display text-2xl font-bold tracking-tight text-inchiostro md:text-3xl">Soluzione Affitto</p>
      <p className="mt-1 text-sm text-pietra">Stiamo aprendo le porte di casa…</p>
      <div className="relative mt-16 w-full max-w-sm">
        <div className="absolute bottom-full mb-1" style={{ left: `calc(${p}% - 4.6rem)` }}>
          <Gattino />
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-sabbia">
          <div className="h-full rounded-full bg-corallo" style={{ width: `${p}%` }} />
        </div>
        <p className="mt-3 text-right font-display text-lg font-bold text-corallo tabular-nums">{p}%</p>
      </div>
    </div>
  )
}
