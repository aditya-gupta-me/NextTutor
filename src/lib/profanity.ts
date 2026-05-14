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

import hinglishBadWords from "./hinglish-bad-words.json";

// Platform-specific terms and Hindi Roman variations the library might miss.
const CUSTOM_BLOCKED = [
    "scam", "fraud", "cheat", "liar", "fake",
    "ghatiya", "nalayak", "badtameez", "bewakoof",
    ...hinglishBadWords
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
 * - ANY profanity → reject (The library's severity is based on word count, so even 1 severe slur is rated "MILD". We must block all.)
 */
export function validateReviewComment(comment: string): string | null {
    if (comment.length > 1000) {
        return "Comment must be under 1000 characters.";
    }

    const result = checkProfanity(comment);

    if (!result.clean) {
        return "Please keep your review respectful and constructive. Remove any inappropriate language and try again.";
    }

    return null;
}
