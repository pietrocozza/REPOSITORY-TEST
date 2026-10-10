import type { MetadataRoute } from 'next'
import { NAV, SITO } from '@/lib/site'
import { ARTICOLI } from '@/lib/articoli'

export default function sitemap(): MetadataRoute.Sitemap {
  const pagine = [...NAV.map((n) => n.href), '/calcola-guadagno', ...ARTICOLI.map((a) => `/blog/${a.slug}`)]
  return pagine.map((p) => ({ url: `${SITO.url}${p === '/' ? '' : p}`, changeFrequency: 'monthly', priority: p === '/' ? 1 : 0.7 }))
}
