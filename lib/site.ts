// Dati di contatto e struttura del sito. Tutto ripreso da soluzioneaffitto.com.

export const SITO = {
  nome: 'Soluzione Affitto',
  url: 'https://www.soluzioneaffitto.com',
  descrizione:
    'Gestione di affitti brevi a Roma e Milano. Ottieni il massimo rendimento dal tuo appartamento: ci occupiamo noi di tutto, tu ricevi solo i profitti.',
  piva: '02492970567',
  email: 'info.soluzioneaffitto@gmail.com',
  telefono: { numero: '+39 371 489 7435', href: 'tel:+393714897435', referente: 'Francesco Ignoti' },
  whatsapp: { numero: '+39 333 612 1597', href: 'https://wa.me/393336121597', referente: 'Pietro Cozza' },
  sedi: [
    {
      citta: 'Roma',
      indirizzo: 'Via Leonina 21, 00184 Roma RM',
      mappa: 'https://www.google.com/maps/search/?api=1&query=Via+Leonina+21+00184+Roma',
    },
    {
      citta: 'Milano',
      indirizzo: 'Via Macedonio Melloni 17, 20129 Milano MI',
      mappa: 'https://www.google.com/maps/search/?api=1&query=Via+Macedonio+Melloni+17+20129+Milano',
    },
  ],
} as const

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/gestione', label: 'Gestione' },
  { href: '/ristruttura-gratis', label: 'Ristruttura gratis' },
  { href: '/operazioni-immobiliari', label: 'Operazioni immobiliari' },
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/domande-e-risposte', label: 'Domande e risposte' },
  { href: '/blog', label: 'Blog' },
  { href: '/contatti', label: 'Contatti' },
] as const

/** Link WhatsApp con messaggio già scritto */
export const linkWhatsApp = (testo: string) => `${SITO.whatsapp.href}?text=${encodeURIComponent(testo)}`
