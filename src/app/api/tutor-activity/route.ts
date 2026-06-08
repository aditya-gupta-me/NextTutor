import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/tutor-activity?tutorProfileId=<uuid>
 *
 * Public endpoint — returns simplified daily view trend
 * for the student-facing activity graph.
 *
 * Returns relative activity data only (no exact counts are exposed).
 * The values are bucketed into low/medium/high ranges.
 */

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Missing Supabase config');
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function GET(request: NextRequest) {
    try {
        const tutorProfileId = request.nextUrl.searchParams.get('tutorProfileId');
        if (!tutorProfileId) {
            return NextResponse.json({ error: 'Missing tutorProfileId' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Check if tutor has analytics visibility enabled (future: settings table)
        // For now, all tutors show activity by default

        // Get last 30 days of aggregated stats
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: dailyStats } = await adminClient
            .from('daily_view_stats')
            .select('date, total_views')
            .eq('tutor_profile_id', tutorProfileId)
            .gte('date', startDateStr)
            .order('date', { ascending: true });

        // Also get today's live count
        const todayStr = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await adminClient
            .from('profile_views')
            .select('*', { count: 'exact', head: true })
            .eq('tutor_profile_id', tutorProfileId)
            .gte('created_at', `${todayStr}T00:00:00.000Z`);

        // Fill all 30 days with data
        const dailyMap = new Map<string, number>();
        for (const row of (dailyStats || [])) {
            dailyMap.set(row.date, row.total_views);
        }
        if (todayCount && todayCount > 0) {
            dailyMap.set(todayStr, (dailyMap.get(todayStr) || 0) + todayCount);
        }

        // Build the response — bucket views into relative ranges (1-5 scale)
        // to avoid exposing exact counts to students
        const daily: Array<{ date: string; views: number }> = [];
        const cursor = new Date(startDateStr);
        const today = new Date(todayStr);
        const rawValues: number[] = [];

        while (cursor <= today) {
            const dateStr = cursor.toISOString().split('T')[0];
            rawValues.push(dailyMap.get(dateStr) || 0);
            cursor.setDate(cursor.getDate() + 1);
        }

        // Normalize to 0-5 scale
        const maxVal = Math.max(...rawValues, 1);
        const cursorReset = new Date(startDateStr);
        let idx = 0;
        while (cursorReset <= today) {
            const dateStr = cursorReset.toISOString().split('T')[0];
            daily.push({
                date: dateStr,
                views: Math.round((rawValues[idx] / maxVal) * 5),
            });
            idx++;
            cursorReset.setDate(cursorReset.getDate() + 1);
        }

        return NextResponse.json({ daily });

    } catch (error) {
        console.error('[tutor-activity] Error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
    }
}
