import type { MetadataRoute } from 'next'
import { NAV, SITO } from '@/lib/site'
import { ARTICOLI } from '@/lib/articoli'
import { ZONE_ROMA } from '@/lib/zone'

export default function sitemap(): MetadataRoute.Sitemap {
  const principali = ['/', '/gestione-affitti-brevi-roma', '/calcola-guadagno']
  const pagine = [
    ...new Set([
      ...principali,
      ...NAV.map((n) => n.href),
      ...ZONE_ROMA.map((z) => `/gestione-affitti-brevi-roma/${z.slug}`),
      '/gestione-affitti-brevi-milano',
      ...ARTICOLI.map((a) => `/blog/${a.slug}`),
      '/privacy',
      '/cookie',
    ]),
  ]
  return pagine.map((p) => ({
    url: `${SITO.url}${p === '/' ? '' : p}`,
    changeFrequency: 'monthly',
    priority: p === '/' ? 1 : principali.includes(p) ? 0.9 : 0.6,
  }))
}
