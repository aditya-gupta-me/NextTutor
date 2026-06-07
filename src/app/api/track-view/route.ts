import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * POST /api/track-view
 *
 * Records a profile view event with anti-abuse protection.
 *
 * Rules:
 *   - Self-views ignored (tutor viewing own profile)
 *   - 24-hour cooldown per viewer per tutor (authenticated or fingerprinted)
 *   - Rate-limited: max 30 requests per IP per minute
 *   - Returns 202 immediately (fire-and-forget)
 */

// Simple in-memory rate limiter (per-IP, resets every minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

// Cooldown: same viewer can only count once per 24 hours per tutor
const COOLDOWN_HOURS = 24;

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Missing Supabase config');
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function generateFingerprint(request: NextRequest): string {
    const ip = getClientIp(request);
    const ua = request.headers.get('user-agent') || 'unknown';
    return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const tutorProfileId = body?.tutorProfileId;

        if (!tutorProfileId || typeof tutorProfileId !== 'string') {
            return new NextResponse(null, { status: 400 });
        }

        // Rate limit check
        const ip = getClientIp(request);
        if (!checkRateLimit(ip)) {
            return new NextResponse(null, { status: 429 });
        }

        const adminClient = getAdminClient();
        const fingerprint = generateFingerprint(request);

        // Try to get authenticated viewer
        let viewerId: string | null = null;
        const authHeader = request.headers.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const { data: { user } } = await adminClient.auth.getUser(token);
            if (user) viewerId = user.id;
        }

        // Self-view check: is the viewer the tutor who owns this profile?
        if (viewerId) {
            const { data: tutorProfile } = await adminClient
                .from('tutor_profiles')
                .select('user_id')
                .eq('id', tutorProfileId)
                .single();

            if (tutorProfile?.user_id === viewerId) {
                // Self-view — discard silently
                return new NextResponse(null, { status: 202 });
            }
        }

        // Cooldown check — has this viewer already been counted recently?
        const cooldownCutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();

        if (viewerId) {
            const { data: recent } = await adminClient
                .from('profile_views')
                .select('id')
                .eq('tutor_profile_id', tutorProfileId)
                .eq('viewer_id', viewerId)
                .gte('created_at', cooldownCutoff)
                .limit(1);

            if (recent && recent.length > 0) {
                return new NextResponse(null, { status: 202 });
            }
        } else {
            const { data: recent } = await adminClient
                .from('profile_views')
                .select('id')
                .eq('tutor_profile_id', tutorProfileId)
                .eq('viewer_fingerprint', fingerprint)
                .gte('created_at', cooldownCutoff)
                .limit(1);

            if (recent && recent.length > 0) {
                return new NextResponse(null, { status: 202 });
            }
        }

        // Insert valid view
        await adminClient.from('profile_views').insert({
            tutor_profile_id: tutorProfileId,
            viewer_id: viewerId,
            viewer_fingerprint: fingerprint,
        });

        return new NextResponse(null, { status: 202 });

    } catch (error) {
        console.error('[track-view] Error:', error instanceof Error ? error.message : error);
        // Never fail visibly — this is fire-and-forget
        return new NextResponse(null, { status: 202 });
    }
}
