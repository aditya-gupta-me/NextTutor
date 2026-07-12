import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select('subjects, city, avg_rating, review_count, users!inner(full_name, avatar_url)')
    .eq('slug', slug)
    .single()

  if (!tutor) {
    return new Response('Tutor not found', { status: 404 })
  }

  const user = (tutor as unknown as { users: { full_name: string; avatar_url: string | null } }).users;
  const subjectsStr = (tutor.subjects as string[] || []).join(' · ');

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '1200px', height: '630px', background: '#fff', padding: '60px', gap: '40px', alignItems: 'center' }}>
        {user.avatar_url ? (
            <img src={user.avatar_url} width={200} height={200} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
             <div style={{ display: 'flex', width: '200px', height: '200px', borderRadius: '50%', background: '#f3f4f6', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: '#9ca3af' }}>
                 {user.full_name.charAt(0)}
             </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: 52, fontWeight: 700 }}>{user.full_name}</div>
          <div style={{ fontSize: 28, color: '#555' }}>{subjectsStr} Tutor · {tutor.city}</div>
          <div style={{ fontSize: 24, color: '#f59e0b' }}>
              {tutor.avg_rating > 0 ? `${'★'.repeat(Math.round(tutor.avg_rating))} ${tutor.avg_rating.toFixed(1)} (${tutor.review_count} reviews)` : 'New Tutor'}
          </div>
          <div style={{ fontSize: 20, color: '#888' }}>www.nexttutor.app</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
