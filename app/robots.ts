import type { MetadataRoute } from 'next'
import { SITO } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${SITO.url}/sitemap.xml` }
}
