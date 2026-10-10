/** Fascia con parole che scorrono all'infinito */
export default function Nastro({ voci, className = '', durata = 32 }: { voci: readonly string[]; className?: string; durata?: number }) {
  return (
    <div className={`overflow-hidden py-4 ${className}`} aria-label={voci.join(', ')}>
      <div aria-hidden="true" className="flex w-max motion-safe:nastro" style={{ '--durata': `${durata}s` } as React.CSSProperties}>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0">
            {[...voci, ...voci].map((v, i) => (
              <span key={i} className="flex items-center gap-6 pr-6 font-display text-lg font-semibold tracking-tight whitespace-nowrap md:text-xl">
                {v}
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path fill="currentColor" d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0Z" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
