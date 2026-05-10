/**
 * Simple client + server profanity filter for review comments.
 * Uses a word-boundary approach so partial word matches don't flag.
 */

const BLOCKED_WORDS = [
    // English profanity
    "fuck", "shit", "ass", "bitch", "damn", "crap", "dick", "bastard",
    "asshole", "bullshit", "piss", "slut", "whore", "cunt", "fag",
    "retard", "idiot", "stupid", "dumb", "moron", "loser", "suck",
    "hate", "ugly", "disgusting", "pathetic", "useless", "worthless",
    "terrible", "horrible", "worst", "scam", "fraud", "cheat", "liar",
    // Hindi profanity
    "chutiya", "madarchod", "bhenchod", "bhosdike", "gaandu", "harami",
    "kamina", "saala", "kutta", "gadha", "bevakoof", "bakwas",
    "ghatiya", "nalayak", "badtameez",
];

// Build regex patterns from word list
const patterns = BLOCKED_WORDS.map(
    (w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
);

/**
 * Check if text contains profanity.
 * @returns Object with `clean` boolean, `matched` words found, and `sanitized` text with *** replacements
 */
export function checkProfanity(text: string): {
    clean: boolean;
    matched: string[];
    sanitized: string;
} {
    const matched: string[] = [];
    let sanitized = text;

    for (let i = 0; i < patterns.length; i++) {
        const regex = patterns[i];
        regex.lastIndex = 0; // reset
        if (regex.test(text)) {
            matched.push(BLOCKED_WORDS[i]);
            regex.lastIndex = 0;
            sanitized = sanitized.replace(regex, (m) => "*".repeat(m.length));
        }
    }

    return {
        clean: matched.length === 0,
        matched: [...new Set(matched)],
        sanitized,
    };
}

/**
 * Validate a review comment for submission.
 * Returns null if OK, or an error message string.
 */
export function validateReviewComment(comment: string): string | null {
    if (comment.length > 1000) {
        return "Comment must be under 1000 characters.";
    }

    const { clean } = checkProfanity(comment);
    if (!clean) {
        return "Please keep your review respectful and constructive. Remove any inappropriate language and try again.";
    }

    return null;
}
