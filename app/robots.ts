import type { MetadataRoute } from 'next'
import { SITO } from '@/lib/site'

// Strumenti di intelligenza artificiale che leggono i siti per addestrarsi o per rifarli su richiesta.
// Google (ricerca normale) resta libero: Google-Extended riguarda solo l'addestramento di Gemini
const BOT_AI = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'PerplexityBot',
  'Perplexity-User',
  'Bytespider',
  'meta-externalagent',
  'cohere-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: BOT_AI, disallow: '/' },
    ],
    sitemap: `${SITO.url}/sitemap.xml`,
  }
}
