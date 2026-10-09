import Link from 'next/link'

/**
 * Logo: il capitello corinzio del sito attuale (ripulito, colorabile) + nome in serif.
 * Il capitello usa una maschera CSS, così prende il colore del testo intorno.
 */
export function Capitello({ className = 'size-9' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: 'url(/img/brand/capitello-scuro.png)',
        WebkitMaskImage: 'url(/img/brand/capitello-scuro.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  )
}

export default function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="group flex items-center gap-3" aria-label="Soluzione Affitto, torna alla home">
      <Capitello className="size-9 transition-transform duration-700 ease-lusso group-hover:-translate-y-0.5" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] tracking-tight">Soluzione Affitto</span>
        <span className="mt-1 text-[0.58rem] font-semibold tracking-[0.32em] uppercase opacity-70">Roma · Milano</span>
      </span>
    </Link>
  )
}
