import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Sora } from 'next/font/google'
import './globals.css'

// Sora: geometrico e pulito, per testi e titoli
const testo = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
})

// Plex Mono: etichette tecniche piccole
const mono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'J.A.R.V.I.S.',
  description: 'Assistente personale vocale con Claude.',
}

export const viewport: Viewport = {
  themeColor: '#02040b',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${testo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
