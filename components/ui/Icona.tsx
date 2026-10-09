// Icone a linea sottile, disegnate a mano per i servizi
const PERCORSI: Record<string, React.ReactNode> = {
  Valorizzazione: <><rect x="3" y="7" width="18" height="13" rx="1.5" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8.5 7l1.5-3h4l1.5 3" /></>,
  'Gestione annuncio': <><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M3 9h18M7 13h6M7 16h10" /></>,
  Selezione: <><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5 20 20M8 10.5l1.5 1.5L12.5 9" /></>,
  Accoglienza: <><circle cx="8" cy="15" r="4" /><path d="M11 12.5 20 4M16 8l2.5 2.5M18.5 5.5 21 8" /></>,
  Manutenzione: <><path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3L15 12l-3-3z" /></>,
  Pulizia: <><path d="M12 3c3 4 6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 3-6 6-10z" /><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" /></>,
  Burocrazia: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 15h7M9 18h4" /></>,
  Monitoraggio: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M10 18.5h4M9.5 9l2 2 3-3.5" /></>,
}

export default function Icona({ nome, className = 'size-8' }: { nome: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PERCORSI[nome]}
    </svg>
  )
}
