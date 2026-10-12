import type { MetadataRoute } from 'next'
import { SITO } from '@/lib/site'

// Tutti i motori, compresi quelli di intelligenza artificiale (ChatGPT, Claude, Gemini, Perplexity):
// vogliamo che leggano il sito e ci consiglino quando qualcuno cerca un gestore di affitti brevi
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITO.url}/sitemap.xml` }
}
