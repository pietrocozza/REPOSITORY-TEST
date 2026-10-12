import Link from 'next/link'

/** Due strade in cima alla pagina della gestione: chi ha una casa da sistemare va a Ristruttura gratis, ben in evidenza */
export default function DaDovePartiamo() {
  return (
    <nav aria-label="Da dove partiamo" className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <Link
        href="/ristruttura-gratis"
        className="group luce relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#1f7a4d] py-2.5 pr-5 pl-2.5 font-semibold text-white shadow-[0_12px_30px_-10px_rgba(31,122,77,0.8)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <span className="relative flex size-9 items-center justify-center rounded-full bg-white/20">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/25 motion-reduce:hidden" aria-hidden="true" />
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
          </svg>
        </span>
        <span>
          Casa da sistemare? <span className="underline decoration-white/50 underline-offset-4">Te la ristrutturiamo gratis</span>
        </span>
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
      <a href="#formula" className="text-sm font-semibold text-pietra underline underline-offset-4 hover:text-corallo">
        Oppure scopri la gestione completa ↓
      </a>
    </nav>
  )
}
