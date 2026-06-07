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

const RATE_LIMIT = 30;
const RATE_WINDOW_SECONDS = 60;

// Cooldown: same viewer can only count once per 24 hours per tutor
const COOLDOWN_HOURS = 24;

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Missing Supabase config');
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Extract client IP from trusted request headers.
 * Trust assumption: We rely on platform-provided headers (cf-connecting-ip, x-real-ip)
 * which are set by the reverse proxy/CDN. x-forwarded-for is used as a fallback but
 * can be spoofed by clients, so it's less reliable for rate limiting.
 */
function getClientIp(request: NextRequest): string {
    // Cloudflare provides cf-connecting-ip (most trusted)
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // Vercel and some other platforms set x-real-ip
    const realIp = request.headers.get('x-real-ip');
    if (realIp) return realIp;

    // Fallback to x-forwarded-for (can be spoofed)
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0]?.trim();
    }

    return 'unknown';
}

function generateFingerprint(request: NextRequest): string {
    const ip = getClientIp(request);
    const ua = request.headers.get('user-agent') || 'unknown';
    return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16);
}

/**
 * Rate limiting using Redis (distributed) or in-memory fallback (dev only).
 * Uses INCR + EXPIRE pattern for reliable rate limiting in serverless.
 */
async function checkRateLimit(ip: string): Promise<boolean> {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    // If Redis is configured, use distributed rate limiting
    if (redisUrl && redisToken) {
        try {
            const key = `rate_limit:track_view:${ip}`;

            // Increment counter
            const incrResponse = await fetch(`${redisUrl}/incr/${key}`, {
                headers: { Authorization: `Bearer ${redisToken}` },
            });
            const incrData = await incrResponse.json();
            const count = incrData.result as number;

            // Set expiry on first increment
            if (count === 1) {
                await fetch(`${redisUrl}/expire/${key}/${RATE_WINDOW_SECONDS}`, {
                    headers: { Authorization: `Bearer ${redisToken}` },
                });
            }

            return count <= RATE_LIMIT;
        } catch (error) {
            console.error('[track-view] Redis rate limit error:', error);
            // On Redis error, allow the request (fail open)
            return true;
        }
    }

    // Fallback: in-memory rate limiting (dev only, not reliable in production)
    if (process.env.NODE_ENV === 'development') {
        // Simple in-memory map for local dev
        if (!global.__rateLimitMap) {
            global.__rateLimitMap = new Map<string, { count: number; resetAt: number }>();
        }
        const rateLimitMap = global.__rateLimitMap as Map<string, { count: number; resetAt: number }>;

        const now = Date.now();
        const entry = rateLimitMap.get(ip);

        if (!entry || now > entry.resetAt) {
            rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_SECONDS * 1000 });
            return true;
        }

        if (entry.count >= RATE_LIMIT) return false;
        entry.count++;
        return true;
    }

    // No Redis in production: log warning and allow (fail open)
    console.warn('[track-view] No Redis configured for rate limiting in production');
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
        if (!(await checkRateLimit(ip))) {
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
            const { data: tutorProfile, error: profileError } = await adminClient
                .from('tutor_profiles')
                .select('user_id')
                .eq('id', tutorProfileId)
                .single();

            if (profileError) {
                console.error('[track-view] Failed to fetch tutor profile:', {
                    tutorProfileId,
                    error: profileError,
                });
                return NextResponse.json(
                    { error: 'Invalid tutor profile' },
                    { status: 500 }
                );
            }

            if (!tutorProfile) {
                console.error('[track-view] Tutor profile not found:', tutorProfileId);
                return NextResponse.json(
                    { error: 'Tutor profile not found' },
                    { status: 404 }
                );
            }

            if (tutorProfile.user_id === viewerId) {
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

        // Insert valid view (with conflict handling for TOCTOU race conditions)
        // The DB unique constraint ensures no duplicate views within 24h window
        const { error: insertError } = await adminClient.from('profile_views').insert({
            tutor_profile_id: tutorProfileId,
            viewer_id: viewerId,
            viewer_fingerprint: fingerprint,
        });

        // Handle unique constraint violation (race condition: view already counted)
        if (insertError) {
            // PostgreSQL unique violation error code is '23505'
            if (insertError.code === '23505') {
                // Already counted - return success silently
                return new NextResponse(null, { status: 202 });
            }
            // Other errors: log but don't fail visibly (fire-and-forget)
            console.error('[track-view] Insert error:', insertError);
        }

        return new NextResponse(null, { status: 202 });

    } catch (error) {
        console.error('[track-view] Error:', error instanceof Error ? error.message : error);
        // Never fail visibly — this is fire-and-forget
        return new NextResponse(null, { status: 202 });
    }
}
