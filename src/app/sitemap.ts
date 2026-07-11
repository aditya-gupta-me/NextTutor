import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  
  const { data: tutors } = await supabase
    .from('tutor_profiles')
    .select('slug, users!inner(updated_at)')

  const tutorUrls = (tutors ?? []).map((t) => {
    // Determine last modified date from the profile if available, otherwise fallback
    let lastModified = new Date();
    const user = t.users as unknown as { updated_at: string | null };
    if (user?.updated_at) {
        lastModified = new Date(user.updated_at);
    }
    
    return {
      url: `https://nexttutor.in/tutors/${t.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }
  })

  return [
    { url: 'https://nexttutor.in', lastModified: new Date(), priority: 1.0 },
    { url: 'https://nexttutor.in/tutors', lastModified: new Date(), priority: 0.9 },
    { url: 'https://nexttutor.in/about', lastModified: new Date(), priority: 0.5 },
    { url: 'https://nexttutor.in/faqs', lastModified: new Date(), priority: 0.5 },
    ...tutorUrls,
  ]
}
