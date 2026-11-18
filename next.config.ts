import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 90 per le foto a tutto schermo della hero
  images: { qualities: [75, 90] },
  // Zone tolte dal simulatore (periferiche o senza metro): le vecchie pagine portano alla pagina di Roma
  async redirects() {
    return ['ostia-e-acilia', 'monte-mario', 'monteverde', 'portuense-e-magliana'].map((zona) => ({
      source: `/gestione-affitti-brevi-roma/${zona}`,
      destination: '/gestione-affitti-brevi-roma',
      permanent: true,
    }))
  },
}

export default nextConfig
