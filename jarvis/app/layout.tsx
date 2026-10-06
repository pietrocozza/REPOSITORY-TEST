import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'J.A.R.V.I.S. — Neural Interface',
  description: 'Assistente personale vocale con Claude.',
}

export const viewport: Viewport = {
  themeColor: '#03090f',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
