import Link from 'next/link'
import type { ReactNode } from 'react'
import Magnete from './Magnete'

type Variante = 'pieno' | 'contorno' | 'chiaro'

const STILI: Record<Variante, string> = {
  pieno: 'bg-inchiostro text-avorio',
  contorno: 'border border-current text-current',
  chiaro: 'bg-avorio text-inchiostro',
}
const RIEMPIMENTO: Record<Variante, string> = {
  pieno: 'bg-terracotta',
  contorno: 'bg-inchiostro',
  chiaro: 'bg-terracotta',
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
    variante === 'contorno' ? 'hover:text-avorio hover:border-inchiostro' : ''
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
