import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/analytics?range=7d|30d|90d
 *
 * Returns profile view analytics for the authenticated tutor.
 * Queries pre-aggregated daily_view_stats and profile_update_events.
 */

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Missing Supabase config');
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

const RANGE_DAYS: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
};

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.slice(7);
        const adminClient = getAdminClient();
        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get tutor profile
        const { data: tutorProfile } = await adminClient
            .from('tutor_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!tutorProfile) {
            return NextResponse.json({ error: 'Not a tutor' }, { status: 403 });
        }

        // Parse range
        const range = request.nextUrl.searchParams.get('range') || '30d';
        const days = RANGE_DAYS[range] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        // Also compute previous period for growth calculation
        const prevStartDate = new Date();
        prevStartDate.setDate(prevStartDate.getDate() - days * 2);
        const prevStartDateStr = prevStartDate.toISOString().split('T')[0];

        // Fetch daily stats for current period
        const { data: dailyStats } = await adminClient
            .from('daily_view_stats')
            .select('date, total_views, unique_visitors')
            .eq('tutor_profile_id', tutorProfile.id)
            .gte('date', startDateStr)
            .order('date', { ascending: true });

        // Fetch daily stats for previous period (for growth %)
        const { data: prevStats } = await adminClient
            .from('daily_view_stats')
            .select('total_views')
            .eq('tutor_profile_id', tutorProfile.id)
            .gte('date', prevStartDateStr)
            .lt('date', startDateStr);

        // Fetch profile update events for markers
        const { data: events } = await adminClient
            .from('profile_update_events')
            .select('created_at, event_type, description')
            .eq('tutor_profile_id', tutorProfile.id)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        // Also get today's live count from raw profile_views (not yet aggregated)
        const todayStr = new Date().toISOString().split('T')[0];
        const { count: todayViews } = await adminClient
            .from('profile_views')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_profile_id', tutorProfile.id)
            .gte('created_at', `${todayStr}T00:00:00`);

        const { data: todayUniqueRaw } = await adminClient
            .from('profile_views')
            .select('viewer_id, viewer_fingerprint')
            .eq('tutor_profile_id', tutorProfile.id)
            .gte('created_at', `${todayStr}T00:00:00`);

        const todayUnique = new Set(
            (todayUniqueRaw || []).map(r => r.viewer_id || r.viewer_fingerprint)
        ).size;

        // Build daily array (fill gaps with zeros)
        const dailyMap = new Map<string, { views: number; unique: number }>();
        for (const row of (dailyStats || [])) {
            dailyMap.set(row.date, {
                views: row.total_views,
                unique: row.unique_visitors,
            });
        }

        // Add today's live data
        if (todayViews && todayViews > 0) {
            dailyMap.set(todayStr, {
                views: todayViews,
                unique: todayUnique,
            });
        }

        // Fill all dates in range
        const daily: Array<{ date: string; views: number; unique: number }> = [];
        const cursor = new Date(startDateStr);
        const today = new Date(todayStr);
        while (cursor <= today) {
            const dateStr = cursor.toISOString().split('T')[0];
            const entry = dailyMap.get(dateStr);
            daily.push({
                date: dateStr,
                views: entry?.views || 0,
                unique: entry?.unique || 0,
            });
            cursor.setDate(cursor.getDate() + 1);
        }

        // Calculate totals
        const totalViews = daily.reduce((sum, d) => sum + d.views, 0);
        const uniqueVisitors = daily.reduce((sum, d) => sum + d.unique, 0);
        const prevTotalViews = (prevStats || []).reduce((sum, d) => sum + d.total_views, 0);

        let growthPercent = 0;
        if (prevTotalViews > 0) {
            growthPercent = Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100);
        }

        const periodLabels: Record<string, string> = {
            '7d': 'Last 7 days',
            '30d': 'Last 30 days',
            '90d': 'Last 90 days',
        };

        return NextResponse.json({
            summary: {
                totalViews,
                uniqueVisitors,
                growthPercent,
                periodLabel: periodLabels[range] || 'Last 30 days',
            },
            daily,
            events: (events || []).map(e => ({
                date: e.created_at,
                type: e.event_type,
                description: e.description,
            })),
        });

    } catch (error) {
        console.error('[analytics] Error:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'Failed to load analytics' },
            { status: 500 }
        );
    }
}
