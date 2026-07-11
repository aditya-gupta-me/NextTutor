import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Standard search engines
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },

      // OpenAI — allow search & live fetches; allow training
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },

      // Anthropic
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Claude-SearchBot', allow: '/' },
      { userAgent: 'Claude-User', allow: '/' },

      // Perplexity
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },

      // Google AI training (does NOT affect Google Search rankings)
      { userAgent: 'Google-Extended', allow: '/' },

      // Apple Intelligence
      { userAgent: 'Applebot-Extended', allow: '/' },

      // Common Crawl (bulk scraper used by many LLMs)
      { userAgent: 'CCBot', disallow: '/' },

      // Block all crawlers from authenticated/internal routes
      {
        userAgent: '*',
        allow: ['/api/og/'],
        disallow: ['/dashboard', '/profile/edit', '/settings', '/api/'],
      },
    ],
    sitemap: 'https://nexttutor.in/sitemap.xml',
  }
}
