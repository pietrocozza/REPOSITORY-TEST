import type { MetadataRoute } from 'next'

// Fa di Ambrogio un'app vera agli occhi di Edge: una volta installata ha la sua icona nella barra delle applicazioni
// (invece di quella di Edge) e una finestra tutta sua.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Ambrogio',
    short_name: 'Ambrogio',
    description: 'Il maggiordomo personale',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#03090f',
    theme_color: '#03090f',
    icons: [
      { src: '/icona-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icona-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icona-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
