import Link from 'next/link'

/** Due strade in piccolo, in cima alla pagina della gestione: chi ha una casa da sistemare va a Ristruttura gratis */
export default function DaDovePartiamo() {
  return (
    <nav aria-label="Da dove partiamo" className="flex flex-wrap gap-2 text-sm">
      <a href="#formula" className="rounded-full bg-pesca px-4 py-2 font-semibold transition-colors hover:bg-corallo hover:text-white">
        Affitti brevi? La formula è qui sotto ↓
      </a>
      <Link href="/ristruttura-gratis" className="rounded-full bg-salvia px-4 py-2 font-semibold transition-colors hover:bg-inchiostro hover:text-crema">
        Casa da sistemare? Ristruttura gratis →
      </Link>
    </nav>
  )
}
