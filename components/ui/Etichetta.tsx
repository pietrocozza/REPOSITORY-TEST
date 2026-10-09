/** Piccola etichetta numerata sopra i titoli di sezione: "01 — Servizi" */
export default function Etichetta({ numero, children, className = '' }: { numero?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`etichetta flex items-center gap-3 ${className}`}>
      {numero && <span className="font-display text-base tracking-normal normal-case italic">{numero}</span>}
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-50" />
      <span>{children}</span>
    </p>
  )
}
