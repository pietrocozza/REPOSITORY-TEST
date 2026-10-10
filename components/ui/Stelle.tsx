/** Cinque stelle piene (tutte le recensioni pubblicate sono a 5 stelle) */
export default function Stelle({ className = 'text-sole' }: { className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label="5 stelle su 5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
          <path fill="currentColor" d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7z" />
        </svg>
      ))}
    </span>
  )
}
