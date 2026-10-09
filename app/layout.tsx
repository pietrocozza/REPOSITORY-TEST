import type { Metadata, Viewport } from 'next'
import { Instrument_Serif, Manrope } from 'next/font/google'
import Providers from '@/components/Providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppFisso from '@/components/layout/WhatsAppFisso'
import Cursore from '@/components/layout/Cursore'
import Grana from '@/components/layout/Grana'
import { SITO } from '@/lib/site'
import './globals.css'

// Instrument Serif: serif da rivista, elegante, per i titoli
const display = Instrument_Serif({
  variable: '--font-instrument',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
})

const testo = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? SITO.url),
  title: {
    default: 'Soluzione Affitto — Gestione affitti brevi a Roma e Milano',
    template: '%s · Soluzione Affitto',
  },
  description: SITO.descrizione,
  keywords: ['gestione affitti brevi Roma', 'property manager Roma', 'affitti turistici Roma', 'gestione Airbnb Roma', 'affitti brevi Milano', 'ristrutturazione gratuita'],
  openGraph: {
    title: 'Soluzione Affitto — Gestione affitti brevi a Roma e Milano',
    description: SITO.descrizione,
    locale: 'it_IT',
    type: 'website',
    siteName: SITO.nome,
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#f4eee4',
}

// Dati strutturati per Google: attività locale con le due sedi
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: SITO.nome,
  url: SITO.url,
  email: SITO.email,
  telephone: SITO.telefono.numero.replaceAll(' ', ''),
  vatID: SITO.piva,
  areaServed: ['Roma', 'Milano'],
  address: [
    { '@type': 'PostalAddress', streetAddress: 'Via Leonina 21', postalCode: '00184', addressLocality: 'Roma', addressRegion: 'RM', addressCountry: 'IT' },
    { '@type': 'PostalAddress', streetAddress: 'Via Macedonio Melloni 17', postalCode: '20129', addressLocality: 'Milano', addressRegion: 'MI', addressCountry: 'IT' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${display.variable} ${testo.variable} antialiased`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <a href="#contenuto" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-inchiostro focus:px-5 focus:py-3 focus:text-avorio">
          Vai al contenuto
        </a>
        <Providers>
          <Header />
          <main id="contenuto">{children}</main>
          <Footer />
          <WhatsAppFisso />
          <Cursore />
          <Grana />
        </Providers>
      </body>
    </html>
  )
}
