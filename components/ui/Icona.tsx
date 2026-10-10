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
  grafico: <><path d="M3 20h18M6 16v-3M10.5 16V9M15 16v-5M19.5 16V5" /><path d="m5 9 5-4 4 3 6-5" /></>,
  scudo: <><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6z" /><path d="m9 12 2 2 4-4.5" /></>,
  carta: <><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19M6.5 15h4" /></>,
  chiave: <><circle cx="8" cy="15" r="4" /><path d="M11 12.5 20 4M16 8l2.5 2.5M18.5 5.5 21 8" /></>,
  valigia: <><rect x="3.5" y="7" width="17" height="12.5" rx="2" /><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M8 7v12.5M16 7v12.5" /></>,
  casa: <><path d="M3.5 11 12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" /></>,
  divano: <><path d="M4 11V8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5V11" /><path d="M2.5 12.5a1.5 1.5 0 0 1 3 0V15h13v-2.5a1.5 1.5 0 0 1 3 0V18h-19zM5 18v2M19 18v2" /></>,
  occhio: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  'chiave-inglese': <><path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3L15 12l-3-3z" /></>,
  stretta: <><path d="m2.5 11 4-4 3 1.5L12 7l5.5 4.5M21.5 11l-4-4-3 1" /><path d="m7 13.5 3 3a1.4 1.4 0 0 0 2-2M9.5 12l3.5 3.5a1.4 1.4 0 0 0 2-2L12 10.5" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,
  bagno: <><path d="M4 12h16v2.5A4.5 4.5 0 0 1 15.5 19h-7A4.5 4.5 0 0 1 4 14.5zM7 12V6a2 2 0 0 1 3.7-1M8 19l-1 2M16 19l1 2" /></>,
  pennello: <><rect x="4" y="3" width="13" height="6" rx="1.5" /><path d="M17 6h2.5v5H11v3M10 14h2v7h-2z" /></>,
  neve: <><path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4 12 6.5 14.5 4M9.5 20l2.5-2.5 2.5 2.5" /></>,
  euro: <><path d="M17.5 6.5A7 7 0 1 0 17.5 17.5M4 10h9M4 14h9" /></>,
  calendario: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  documento: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 15h7M9 18h4" /></>,
  matita: <><path d="M4 20l1-4.5L16 4.5 19.5 8 8.5 19z M14 7l3 3" /></>,
  gru: <><path d="M5 21V4h2v17M4 21h8M7 5h13M15 5v5M13.5 10h3v2.5h-3zM7 9l5-4" /></>,
}

export default function Icona({ nome, className = 'size-8' }: { nome: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PERCORSI[nome]}
    </svg>
  )
}
