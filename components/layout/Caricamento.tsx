'use client'

import { useEffect, useState } from 'react'

const CHIAVE = 'caricamento-visto'
const DURATA_MINIMA = 1100
const DURATA_MASSIMA = 2600

/** Gabbiano romano che spinge la barra col becco: disegno originale, zampe e ala animate con CSS */
function Gabbiano() {
  return (
    <svg viewBox="0 0 80 64" className="h-[4.5rem] w-[5.6rem]" aria-hidden="true">
      <g stroke="#e8892b" strokeWidth="3" strokeLinecap="round" fill="none">
        <path className="caricamento-zampe-dietro" d="M28 50l-3 12h-4" />
        <path className="caricamento-zampe-avanti" d="M40 50l3 12h4" />
      </g>
      <path d="M14 34L1 30l4 9 11 3z" fill="#1d2236" />
      <ellipse cx="33" cy="39" rx="21" ry="13" fill="#fff" stroke="#1d2236" strokeWidth="2" />
      <path className="caricamento-ala" d="M18 34c6-6 18-7 26-2-6 6-16 9-26 7z" fill="#b7bed3" stroke="#1d2236" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 34l-6 3 7 1z" fill="#1d2236" />
      <circle cx="55" cy="24" r="11" fill="#fff" stroke="#1d2236" strokeWidth="2" />
      <path d="M64 23l15 4-15 5z" fill="#f7b538" stroke="#1d2236" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="71" cy="28.5" r="1.6" fill="#d9481f" />
      <circle cx="58" cy="21" r="2.4" fill="#1d2236" />
      <circle cx="58.8" cy="20.2" r=".8" fill="#fff" />
      <path d="M54 16.5l7 2" stroke="#1d2236" strokeWidth="1.8" strokeLinecap="round" />
      <path className="caricamento-goccia" d="M47 12c-2 3-2 5 0 6 2-1 2-3 0-6z" fill="#7fb5e8" />
    </svg>
  )
}

/** Schermata di caricamento al primo ingresso: una barra che arriva al 100% spinta dal gabbiano */
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
        <div className="absolute bottom-full mb-1" style={{ left: `max(0px, calc(${p}% - 5.2rem))` }}>
          <Gabbiano />
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-sabbia">
          <div className="h-full rounded-full bg-corallo" style={{ width: `${p}%` }} />
        </div>
        <p className="mt-3 text-right font-display text-lg font-bold text-corallo tabular-nums">{p}%</p>
      </div>
    </div>
  )
}
