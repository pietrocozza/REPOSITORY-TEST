import type { MetadataRoute } from 'next'
import { NAV, SITO } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const pagine = [...NAV.map((n) => n.href), '/calcola-guadagno']
  return pagine.map((p) => ({ url: `${SITO.url}${p === '/' ? '' : p}`, changeFrequency: 'monthly', priority: p === '/' ? 1 : 0.7 }))
}
