import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

// Fraunces: serif variabile con un tocco "morbido" e un po' eccentrico
const display = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  style: ['normal', 'italic'],
})

const testo = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
})

const TITOLO = 'Brace & Peperino — Smash burger nel cuore della Tuscia'
const DESCRIZIONE =
  'Hamburgeria artigianale nel quartiere medievale di San Pellegrino, Viterbo. Manzo maremmano, pecorino della Tuscia, nocciole dei Cimini. Ordina a domicilio.'

export const metadata: Metadata = {
  // PLACEHOLDER: sostituisci con il dominio reale quando il sito va online
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: TITOLO,
  description: DESCRIZIONE,
  keywords: ['hamburgeria Viterbo', 'smash burger', 'San Pellegrino', 'Tuscia', 'consegna a domicilio Viterbo'],
  openGraph: {
    title: TITOLO,
    description: DESCRIZIONE,
    locale: 'it_IT',
    type: 'website',
    siteName: 'Brace & Peperino',
  },
  twitter: { card: 'summary_large_image', title: TITOLO, description: DESCRIZIONE },
}

export const viewport: Viewport = {
  themeColor: '#FFF4E0',
}

// Eseguito prima del primo disegno: se la schermata di caricamento è già stata vista
// in questa sessione, la nasconde subito (niente "lampo").
const SCRIPT_INTRO = `try{if(sessionStorage.getItem('bp-intro'))document.documentElement.classList.add('intro-seen')}catch(e){}`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${display.variable} ${testo.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_INTRO }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
