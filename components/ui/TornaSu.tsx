'use client'

/** In fondo alla pagina, solo da computer: riporta in cima */
export default function TornaSu() {
  return (
    <div className="hidden bg-crema lg:block">
      <div className="contenitore flex justify-end pb-10">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group inline-flex items-center gap-3 rounded-full border-2 border-inchiostro px-6 py-3 text-sm font-bold tracking-[0.14em] uppercase transition-colors duration-300 hover:bg-inchiostro hover:text-crema"
        >
          Torna su
          <svg viewBox="0 0 24 24" className="size-4 transition-transform duration-300 group-hover:-translate-y-1" aria-hidden="true">
            <path d="M12 20V5m-6 6 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
