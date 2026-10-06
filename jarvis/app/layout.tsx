import type { Metadata, Viewport } from 'next'
import { Orbitron, Rajdhani } from 'next/font/google'
import './globals.css'

// Orbitron: lettere geometriche "da HUD" per titoli e numeri
const display = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['500', '700', '900'],
})

const testo = Rajdhani({
  variable: '--font-rajdhani',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'J.A.R.V.I.S.',
  description: 'Assistente personale vocale con Claude.',
}

export const viewport: Viewport = {
  themeColor: '#02070d',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${display.variable} ${testo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
