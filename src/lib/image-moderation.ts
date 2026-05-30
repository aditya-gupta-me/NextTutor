/**
 * Image moderation layer using Azure AI Content Safety.
 *
 * Analyses uploaded images for inappropriate content (nudity, violence,
 * hate content, self-harm) and returns a structured verdict. Mirrors the
 * pattern established in profanity.ts for text moderation.
 *
 * Azure Content Safety returns severity scores (0, 2, 4, 6) across
 * four categories: Sexual, Violence, Hate, SelfHarm.
 *
 * Severity levels:
 *   0 = Safe
 *   2 = Low severity
 *   4 = Medium severity
 *   6 = High severity
 */

// ─── Threshold configuration ────────────────────────────────────
// The minimum severity score (inclusive) that triggers rejection.
// Severity 2 catches clear violations while avoiding false positives.
const SEVERITY_THRESHOLD = 2;

// Categories to check and their user-facing labels
const MODERATION_CATEGORIES = ['Sexual', 'Violence', 'Hate', 'SelfHarm'] as const;

export interface ModerationResult {
    safe: boolean;
    flaggedCategories: string[];
    scores: Record<string, number>;
    error?: string;
}

/**
 * Analyse a base64-encoded image for inappropriate content
 * using Azure AI Content Safety REST API.
 *
 * @param base64Image - Raw base64 string (no data: prefix)
 * @returns ModerationResult with verdict, flagged categories, and raw scores
 */
export async function moderateImage(base64Image: string): Promise<ModerationResult> {
    const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
    const key = process.env.AZURE_CONTENT_SAFETY_KEY;

    if (!endpoint || !key) {
        console.error('[image-moderation] AZURE_CONTENT_SAFETY_ENDPOINT or AZURE_CONTENT_SAFETY_KEY not configured');
        return {
            safe: false,
            flaggedCategories: [],
            scores: {},
            error: 'Image moderation is temporarily unavailable. Please try again later.',
        };
    }

    const url = `${endpoint.replace(/\/$/, '')}/contentsafety/image:analyze?api-version=2024-09-01`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': key,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: { content: base64Image },
            }),
            signal: AbortSignal.timeout(10_000), // 10s timeout
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'unknown');
            console.error(`[image-moderation] Azure Content Safety failed: ${response.status} — ${errorBody}`);
            return {
                safe: false,
                flaggedCategories: [],
                scores: {},
                error: 'Unable to verify your photo right now. Please try again.',
            };
        }

        const data = await response.json();
        const categories = data.categoriesAnalysis;

        if (!categories || !Array.isArray(categories)) {
            console.error('[image-moderation] No categoriesAnalysis in response:', JSON.stringify(data));
            return {
                safe: false,
                flaggedCategories: [],
                scores: {},
                error: 'Unable to verify your photo right now. Please try again.',
            };
        }

        // Build scores map and check against thresholds
        const flaggedCategories: string[] = [];
        const scores: Record<string, number> = {};

        for (const cat of categories) {
            const name = cat.category as string;
            const severity = cat.severity as number;
            scores[name] = severity;

            if (MODERATION_CATEGORIES.includes(name as typeof MODERATION_CATEGORIES[number]) && severity >= SEVERITY_THRESHOLD) {
                flaggedCategories.push(name);
            }
        }

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
