import Link from 'next/link'
import type { ReactNode } from 'react'
import Magnete from './Magnete'

type Variante = 'pieno' | 'corallo' | 'contorno' | 'chiaro' | 'vetro'

const STILI: Record<Variante, string> = {
  pieno: 'bg-inchiostro text-crema',
  corallo: 'bg-corallo text-white shadow-[0_12px_30px_-10px_rgba(217,72,31,0.8)]',
  contorno: 'border-2 border-current text-current',
  chiaro: 'bg-white text-inchiostro',
  vetro: 'bg-white/15 text-white backdrop-blur-md border border-white/30',
}
const RIEMPIMENTO: Record<Variante, string> = {
  pieno: 'bg-corallo',
  corallo: 'bg-inchiostro',
  contorno: 'bg-inchiostro',
  chiaro: 'bg-sole',
  vetro: 'bg-white/25',
}

/** Pulsante a pillola: al passaggio un fondo colorato sale dal basso e il testo scorre */
export default function Pulsante({
  href,
  children,
  variante = 'pieno',
  esterno = false,
  className = '',
}: {
  href: string
  children: ReactNode
  variante?: Variante
  esterno?: boolean
  className?: string
}) {
  const classi = `group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-4 text-sm font-semibold tracking-wide transition-colors duration-500 ${STILI[variante]} ${
    variante === 'contorno' ? 'hover:text-crema hover:border-inchiostro' : ''
  } ${className}`

  const interno = (
    <>
      <span
        aria-hidden="true"
        className={`absolute inset-0 translate-y-[101%] rounded-full transition-transform duration-500 ease-lusso group-hover:translate-y-0 ${RIEMPIMENTO[variante]}`}
      />
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-lusso group-hover:-translate-y-full">{children}</span>
        <span aria-hidden="true" className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-lusso group-hover:translate-y-0">
          {children}
        </span>
      </span>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="relative size-4 transition-transform duration-500 ease-lusso group-hover:rotate-[-45deg]">
        <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  )

  return (
    <Magnete>
      {esterno ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classi}>
          {interno}
        </a>
      ) : (
        <Link href={href} className={classi}>
          {interno}
        </Link>
      )}
    </Magnete>
  )
}
