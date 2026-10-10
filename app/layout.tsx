import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Serif, Manrope } from 'next/font/google'
import Providers from '@/components/Providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppFisso from '@/components/layout/WhatsAppFisso'
import Cursore from '@/components/layout/Cursore'
import Grana from '@/components/layout/Grana'
import BannerCookie from '@/components/layout/BannerCookie'
import { Analytics } from '@vercel/analytics/next'
import { SITO } from '@/lib/site'
import './globals.css'

// Bricolage Grotesque: sans moderno e con carattere, per i titoli
const display = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
})

// Instrument Serif in corsivo: le parole d'accento nei titoli
const accento = Instrument_Serif({
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
    default: 'Gestione affitti brevi a Roma e Milano | Soluzione Affitto',
    template: '%s · Soluzione Affitto',
  },
  description: SITO.descrizione,
    openGraph: {
    title: 'Gestione affitti brevi a Roma e Milano | Soluzione Affitto',
    description: SITO.descrizione,
    locale: 'it_IT',
    type: 'website',
    siteName: SITO.nome,
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#fff9f1',
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
  areaServed: [
    { '@type': 'City', name: 'Roma' },
    { '@type': 'City', name: 'Milano' },
  ],
  image: `${SITO.url}/opengraph-image.jpg`,
  logo: `${SITO.url}/icon.png`,
  description: SITO.descrizione,
  address: [
    { '@type': 'PostalAddress', streetAddress: 'Via Leonina 21', postalCode: '00184', addressLocality: 'Roma', addressRegion: 'RM', addressCountry: 'IT' },
    { '@type': 'PostalAddress', streetAddress: 'Via Macedonio Melloni 17', postalCode: '20129', addressLocality: 'Milano', addressRegion: 'MI', addressCountry: 'IT' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${display.variable} ${accento.variable} ${testo.variable} antialiased`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <a href="#contenuto" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-full focus:bg-inchiostro focus:px-5 focus:py-3 focus:text-crema">
          Vai al contenuto
        </a>
        <Providers>
          <Header />
          <main id="contenuto">{children}</main>
          <Footer />
          <WhatsAppFisso />
          <Cursore />
          <Grana />
          <BannerCookie />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
