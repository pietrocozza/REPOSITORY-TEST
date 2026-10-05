'use client'

import { createContext, useContext, type ReactNode } from 'react'
import Image from 'next/image'

// Sa quali foto esistono davvero in public/images (lo legge il server).
const FotoContext = createContext<Set<string>>(new Set())

export function FotoProvider({ disponibili, children }: { disponibili: string[]; children: ReactNode }) {
  return <FotoContext.Provider value={new Set(disponibili)}>{children}</FotoContext.Provider>
}

export const useFotoEsiste = (foto: string) => useContext(FotoContext).has(foto)

export type FormaSegnaposto = 'burger' | 'patatine' | 'anelli' | 'cupola' | 'base' | 'disco' | 'foglia' | 'fetta'

/**
 * La foto del cibo (next/image, dimensioni fisse: niente salti di layout)
 * oppure, finché il file non esiste, un segnaposto neutro con il nome del file.
 */
export default function Foto({
  foto,
  alt,
  larghezza,
  altezza,
  forma,
  tinta,
  spessore,
  priority,
  sizes,
  mostraNome = true,
}: {
  foto: string
  alt: string
  larghezza: number
  altezza: number
  forma: FormaSegnaposto
  tinta?: [string, string]
  spessore?: number
  priority?: boolean
  sizes?: string
  /** mostra il nome del file nel segnaposto (utile per sapere quale foto manca) */
  mostraNome?: boolean
}) {
  const esiste = useFotoEsiste(foto)
  if (esiste) {
    return (
      <Image
        src={`/images/${foto}`}
        alt={alt}
        width={larghezza}
        height={altezza}
        priority={priority}
        sizes={sizes ?? '(max-width: 768px) 80vw, 40vw'}
        className="pointer-events-none block h-auto w-full select-none"
        draggable={false}
      />
    )
  }
  return (
    <div role="img" aria-label={`${alt} (foto in arrivo: ${foto})`} className="relative w-full" style={{ aspectRatio: `${larghezza} / ${altezza}` }}>
      <Segnaposto forma={forma} tinta={tinta} spessore={spessore} />
      {mostraNome && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-crema/25">{foto}</span>}
    </div>
  )
}

/** Forme sfumate e neutre: tengono il posto della foto con le giuste proporzioni */
function Segnaposto({ forma, tinta = ['#d18a3a', '#6d3d12'], spessore = 0.1 }: { forma: FormaSegnaposto; tinta?: [string, string]; spessore?: number }) {
  const g = (a: string, b: string) => `radial-gradient(120% 140% at 30% 20%, ${a}, ${b})`
  const pezzo = (w: string, h: string, raggio: string, a: string, b: string, extra = '') => (
    <div className={`mx-auto ${extra}`} style={{ width: w, height: h, borderRadius: raggio, background: g(a, b) }} />
  )

  if (forma === 'burger')
    return (
      <div className="absolute inset-[8%_6%] flex flex-col justify-center gap-[1.5%]">
        {pezzo('86%', '34%', '50% 50% 14% 14% / 90% 90% 14% 14%', '#e0a253', '#7a4517')}
        {pezzo('92%', '5%', '999px', '#9bc46a', '#3f6b25')}
        {pezzo('90%', '6%', '6px', '#ffc95a', '#c47a0c')}
        {pezzo('88%', '15%', '999px', '#6b3a22', '#2a140b')}
        {pezzo('84%', '14%', '10% 10% 45% 45% / 20% 20% 80% 80%', '#c9812e', '#6d3d12')}
      </div>
    )
  if (forma === 'patatine')
    return (
      <div className="absolute inset-[10%_18%] flex items-end justify-center gap-[3%]">
        {[70, 88, 78, 95, 74, 84].map((h, i) => (
          <div key={i} className="w-[10%] rounded-[4px]" style={{ height: `${h}%`, background: g('#ffd36b', '#c8861c'), transform: `rotate(${(i - 2.5) * 5}deg)` }} />
        ))}
      </div>
    )
  if (forma === 'anelli')
    return (
      <div className="absolute inset-[18%_10%]">
        {[
          [8, 10],
          [40, 0],
          [26, 36],
        ].map(([l, t], i) => (
          <div
            key={i}
            className="absolute aspect-[1.3] w-[46%] rounded-full"
            style={{ left: `${l}%`, top: `${t}%`, background: `radial-gradient(closest-side, transparent 45%, #e7b06a 50%, #9a5d22 100%)` }}
          />
        ))}
      </div>
    )

  // strati del panino: la forma occupa la fascia centrale della foto (larga il doppio dell'altezza)
  const altezzaPct = `${(spessore / 0.5) * 100}%`
  const raggi: Record<string, string> = {
    cupola: '50% 50% 14% 14% / 90% 90% 14% 14%',
    base: '8% 8% 45% 45% / 20% 20% 80% 80%',
    disco: '999px',
    foglia: '40% 40% 48% 48% / 60% 60% 90% 90%',
    fetta: '999px',
  }
  const larghezze: Record<string, string> = { cupola: '86%', base: '84%', disco: '88%', foglia: '94%', fetta: '84%' }
  return (
    <div className="absolute inset-0 flex items-center">
      {pezzo(larghezze[forma], altezzaPct, raggi[forma], tinta[0], tinta[1])}
    </div>
  )
}
