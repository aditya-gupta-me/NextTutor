/**
 * Image moderation layer using Google Cloud Vision SafeSearch API.
 *
 * Analyses uploaded images for inappropriate content (nudity, violence,
 * explicit material) and returns a structured verdict. Mirrors the
 * pattern established in profanity.ts for text moderation.
 *
 * SafeSearch returns likelihood levels for five categories:
 *   adult, spoof, medical, violence, racy
 *
 * Each value is one of:
 *   VERY_UNLIKELY | UNLIKELY | POSSIBLE | LIKELY | VERY_LIKELY
 */

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// ─── Threshold configuration ────────────────────────────────────
// Categories and the minimum likelihood at which they trigger rejection.
// LIKELY = clear signal; VERY_LIKELY for racy to reduce false positives.
const REJECTION_THRESHOLDS: Record<string, string[]> = {
    adult: ['LIKELY', 'VERY_LIKELY'],
    violence: ['LIKELY', 'VERY_LIKELY'],
    racy: ['VERY_LIKELY'],  // Only reject the most explicit — avoids flagging swimwear etc.
};

export interface ModerationResult {
    safe: boolean;
    flaggedCategories: string[];
    scores: Record<string, string>;
    error?: string;
}

/**
 * Analyse a base64-encoded image for inappropriate content.
 *
 * @param base64Image - Raw base64 string (no data: prefix)
 * @returns ModerationResult with verdict, flagged categories, and raw scores
 */
export async function moderateImage(base64Image: string): Promise<ModerationResult> {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
        console.error('[image-moderation] GOOGLE_CLOUD_VISION_API_KEY not configured');
        return {
            safe: false,
            flaggedCategories: [],
            scores: {},
            error: 'Image moderation is temporarily unavailable. Please try again later.',
        };
    }

    try {
        const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Image },
                    features: [{ type: 'SAFE_SEARCH_DETECTION' }],
                }],
            }),
            signal: AbortSignal.timeout(10_000), // 10s timeout
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'unknown');
            console.error(`[image-moderation] Vision API failed: ${response.status} — ${errorBody}`);
            return {
                safe: false,
                flaggedCategories: [],
                scores: {},
                error: 'Unable to verify your photo right now. Please try again.',
            };
        }

        const data = await response.json();
        const annotation = data.responses?.[0]?.safeSearchAnnotation;

        if (!annotation) {
            console.error('[image-moderation] No safeSearchAnnotation in response:', JSON.stringify(data));
            return {
                safe: false,
                flaggedCategories: [],
                scores: {},
                error: 'Unable to verify your photo right now. Please try again.',
            };
        }

        // Check each category against its threshold
        const flaggedCategories: string[] = [];

        for (const [category, thresholds] of Object.entries(REJECTION_THRESHOLDS)) {
            const score = annotation[category];
            if (score && thresholds.includes(score)) {
                flaggedCategories.push(category);
            }
        }

        const scores: Record<string, string> = {
            adult: annotation.adult || 'UNKNOWN',
            violence: annotation.violence || 'UNKNOWN',
            racy: annotation.racy || 'UNKNOWN',
            spoof: annotation.spoof || 'UNKNOWN',
            medical: annotation.medical || 'UNKNOWN',
        };

        const safe = flaggedCategories.length === 0;

        if (!safe) {
            console.warn(
                `[image-moderation] FLAGGED categories=${flaggedCategories.join(',')} scores=${JSON.stringify(scores)}`
            );
        }

        return { safe, flaggedCategories, scores };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[image-moderation] Exception: ${message}`);
        return {
            safe: false,
            flaggedCategories: [],
            scores: {},
            error: 'Unable to verify your photo right now. Please try again.',
        };
    }
}
