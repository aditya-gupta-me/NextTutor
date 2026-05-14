/**
 * Review content moderation layer.
 *
 * Uses `allprofanity` for detection — handles leet-speak (f#ck, a55),
 * Hindi Roman script (chutiya), and native Devanagari. Falls back to
 * a custom blocklist for platform-specific terms the library might miss.
 *
 * Detection runs on both client (instant feedback) and server (actions.ts)
 * so bypassing the UI doesn't skip validation.
 */

import { AllProfanity, ProfanitySeverity } from "allprofanity";

// ─── Filter setup ───────────────────────────────────────────────
// Trie mode gives us fast prefix-tree matching (~27K ops/sec) with
// context analysis to reduce false positives like "assume" or "class".
// We avoid hybrid/Aho-Corasick because those pre-build their automaton
// during construction and don't reliably pick up runtime .add() calls.

// Platform-specific terms that users have tried in reviews but
// aren't in standard profanity dictionaries. Update as needed.
const CUSTOM_BLOCKED = [
    "scam", "fraud", "cheat", "liar", "fake",
    "ghatiya", "nalayak", "badtameez", "bewakoof",
];

const filter = new AllProfanity({
    languages: ["english", "hindi", "bengali", "tamil", "telugu"],
    enableLeetSpeak: true,
    caseSensitive: false,
    strictMode: false,
    silent: true,
    performance: {
        enableCaching: true,
        cacheSize: 500,
    },
});

filter.add(CUSTOM_BLOCKED);

// ─── Severity thresholds ────────────────────────────────────────
// We don't treat every flagged word the same way:
// - MILD (e.g. "damn", "crap") → allow but sanitize with ***
// - MODERATE and above → block submission entirely
//
// This keeps reviews honest without over-censoring casual language.

const BLOCK_THRESHOLD = ProfanitySeverity.MODERATE;

// ─── Public API ─────────────────────────────────────────────────

export interface ProfanityResult {
    clean: boolean;
    matched: string[];
    sanitized: string;
    severity: "NONE" | "MILD" | "MODERATE" | "SEVERE" | "EXTREME";
}

/** Check text for profanity. Returns detection details and a sanitized version. */
export function checkProfanity(text: string): ProfanityResult {
    const result = filter.detect(text);

    if (!result.hasProfanity) {
        return {
            clean: true,
            matched: [],
            sanitized: text,
            severity: "NONE",
        };
    }

    return {
        clean: false,
        matched: result.detectedWords,
        sanitized: result.cleanedText,
        severity: ProfanitySeverity[result.severity] as ProfanityResult["severity"],
    };
}

/**
 * Validate a review comment before submission.
 * Returns null if the comment is acceptable, or an error message string.
 *
 * Policy:
 * - Over 1000 chars → reject
 * - MODERATE+ profanity → reject (slurs, explicit language)
 * - MILD profanity → allowed (gets sanitized on display if needed)
 */
export function validateReviewComment(comment: string): string | null {
    if (comment.length > 1000) {
        return "Comment must be under 1000 characters.";
    }

    const result = checkProfanity(comment);

    if (!result.clean && result.severity !== "MILD") {
        return "Please keep your review respectful and constructive. Remove any inappropriate language and try again.";
    }

    return null;
}
