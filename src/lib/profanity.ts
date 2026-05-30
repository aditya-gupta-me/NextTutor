/**
 * Review content moderation layer using Google Perspective API.
 * 
 * Uses ML to detect toxic language, insults, and profanity in review comments.
 * It is highly effective at understanding context and catching subtle harassment,
 * as well as obvious obfuscations (leet-speak).
 */

const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

// ─── Severity thresholds ────────────────────────────────────────
// Any comment scoring above this toxicity threshold is blocked.
// 0.60 (60%) catches obvious insults and severe profanity while
// leaving room for mild, constructive criticism.
const TOXICITY_THRESHOLD = 0.60;

/**
 * Validate a review comment before submission using Google Perspective API.
 * Returns null if the comment is acceptable, or an error message string.
 *
 * Policy:
 * - Over 1000 chars → reject
 * - Toxicity > 60% → reject
 * - API Failure → fail open (allow through) or log error
 */
export async function validateReviewComment(comment: string): Promise<string | null> {
    if (!comment || !comment.trim()) return null;

    if (comment.length > 1000) {
        return "Comment must be under 1000 characters.";
    }

    const apiKey = process.env.GOOGLE_PERSPECTIVE_API_KEY;
    if (!apiKey) {
        console.warn("Perspective API key missing. Skipping profanity check.");
        return null;
    }

    try {
        const response = await fetch(`${DISCOVERY_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Optional: If running on server, we spoof Referer for restricted keys
                ...(typeof window === 'undefined' && {
                    'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000/'
                })
            },
            body: JSON.stringify({
                comment: { text: comment },
                // Let Google auto-detect language for better Hinglish support
                requestedAttributes: {
                    TOXICITY: {},
                }
            })
        });

        if (!response.ok) {
            console.error(`Perspective API failed: ${response.status}`);
            return null; // Fail open if the API goes down so we don't block core functionality
        }

        const data = await response.json();
        const toxicityScore = data.attributeScores?.TOXICITY?.summaryScore?.value || 0;

        if (toxicityScore > TOXICITY_THRESHOLD) {
            return "Please keep your review respectful and constructive. Remove any inappropriate language and try again.";
        }

        return null;

    } catch (error) {
        console.error("Error calling Perspective API:", error);
        return null; // Fail open
    }
}
