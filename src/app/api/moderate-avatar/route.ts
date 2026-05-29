import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { moderateImage } from '@/lib/image-moderation';

/**
 * POST /api/moderate-avatar
 *
 * Server-side endpoint that moderates a pending avatar image.
 *
 * Flow:
 *   1. Validate auth (session cookie → Supabase user)
 *   2. Download the pending image from Supabase Storage
 *   3. Send to Cloud Vision SafeSearch for analysis
 *   4. If safe → copy to live path, delete pending
 *   5. If flagged → delete pending, return rejection reason
 *
 * Uses the service_role key to bypass Storage RLS for file operations.
 */

// Service-role client for storage operations (server-side only)
function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(url, serviceKey, {
        auth: { persistSession: false },
    });
}

// User-facing rejection messages (no internal details leaked)
const REJECTION_MESSAGES: Record<string, string> = {
    adult: 'Your photo appears to contain adult or explicit content.',
    violence: 'Your photo appears to contain violent imagery.',
    racy: 'Your photo appears to contain inappropriate content.',
};

function buildRejectionMessage(flaggedCategories: string[]): string {
    const specific = flaggedCategories
        .map(cat => REJECTION_MESSAGES[cat])
        .filter(Boolean);

    if (specific.length > 0) {
        return `${specific[0]} Please upload a different photo.`;
    }

    return 'Your photo was flagged as potentially inappropriate. Please upload a different photo.';
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // ─── 1. Parse body ───
        const body = await request.json().catch(() => null);
        const userId = body?.userId;

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json(
                { status: 'error', reason: 'Missing userId.' },
                { status: 400 }
            );
        }

        // ─── 2. Verify auth ───
        // Extract the Supabase auth token from the Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { status: 'error', reason: 'Unauthorized.' },
                { status: 401 }
            );
        }

        const token = authHeader.slice(7);
        const adminClient = getAdminClient();

        const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

        if (authError || !user || user.id !== userId) {
            return NextResponse.json(
                { status: 'error', reason: 'Unauthorized.' },
                { status: 401 }
            );
        }

        // ─── 3. Download the pending image from storage ───
        const pendingPath = `${userId}/pending`;

        const { data: fileData, error: downloadError } = await adminClient.storage
            .from('avatars')
            .download(pendingPath);

        if (downloadError || !fileData) {
            console.error(`[moderate-avatar] Download failed for ${pendingPath}:`, downloadError);
            return NextResponse.json(
                { status: 'error', reason: 'No pending image found. Please upload first.' },
                { status: 404 }
            );
        }

        // ─── 4. Convert to base64 and moderate ───
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const result = await moderateImage(base64);
        const duration = Date.now() - startTime;

        // ─── 5. Act on result ───
        if (result.error) {
            // Vision API failed — clean up pending and fail-closed
            await adminClient.storage.from('avatars').remove([pendingPath]);
            console.error(`[moderate-avatar] userId=${userId} error="${result.error}" duration=${duration}ms`);

            return NextResponse.json(
                { status: 'rejected', reason: result.error },
                { status: 200 }
            );
        }

        if (!result.safe) {
            // Image flagged — delete pending, return reason
            await adminClient.storage.from('avatars').remove([pendingPath]);
            const reason = buildRejectionMessage(result.flaggedCategories);

            console.warn(
                `[moderate-avatar] REJECTED userId=${userId} categories=${result.flaggedCategories.join(',')} duration=${duration}ms`
            );

            return NextResponse.json(
                { status: 'rejected', reason },
                { status: 200 }
            );
        }

        // ─── 6. Approved — move pending → live ───
        const livePath = `${userId}/avatar`;

        // Re-read the pending file as a File/Blob for upload
        const { data: pendingBlob, error: redownloadError } = await adminClient.storage
            .from('avatars')
            .download(pendingPath);

        if (redownloadError || !pendingBlob) {
            console.error(`[moderate-avatar] Re-download failed:`, redownloadError);
            return NextResponse.json(
                { status: 'error', reason: 'Failed to finalise upload. Please try again.' },
                { status: 500 }
            );
        }

        // Upload to the live path (upsert = overwrite existing)
        const { error: copyError } = await adminClient.storage
            .from('avatars')
            .upload(livePath, pendingBlob, {
                upsert: true,
                contentType: fileData.type || 'image/jpeg',
            });

        if (copyError) {
            console.error(`[moderate-avatar] Copy to live failed:`, copyError);
            return NextResponse.json(
                { status: 'error', reason: 'Failed to finalise upload. Please try again.' },
                { status: 500 }
            );
        }

        // Clean up pending file
        await adminClient.storage.from('avatars').remove([pendingPath]);

        // Build the public URL with cache-buster
        const { data: { publicUrl } } = adminClient.storage
            .from('avatars')
            .getPublicUrl(livePath);

        const freshUrl = `${publicUrl}?t=${Date.now()}`;

        console.log(`[moderate-avatar] APPROVED userId=${userId} duration=${duration}ms`);

        return NextResponse.json({
            status: 'approved',
            url: freshUrl,
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[moderate-avatar] Unhandled error: ${message}`);

        return NextResponse.json(
            { status: 'error', reason: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
