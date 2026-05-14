import { describe, it, expect } from "vitest";
import { checkProfanity, validateReviewComment } from "../profanity";

// ─── checkProfanity ─────────────────────────────────────────────

describe("checkProfanity", () => {
    it("passes clean text through unchanged", () => {
        const result = checkProfanity("This tutor explains concepts really well.");
        expect(result.clean).toBe(true);
        expect(result.matched).toHaveLength(0);
        expect(result.severity).toBe("NONE");
        expect(result.sanitized).toBe("This tutor explains concepts really well.");
    });

    it("detects standard English profanity", () => {
        const result = checkProfanity("This is bullshit");
        expect(result.clean).toBe(false);
        expect(result.matched).toContain("bullshit");
    });

    it("catches leet-speak number substitutions", () => {
        // a55hole is a common leet variant the library handles
        const result = checkProfanity("You are an a55hole");
        expect(result.clean).toBe(false);
        expect(result.matched.length).toBeGreaterThan(0);
    });

    it("catches Hindi Roman script profanity", () => {
        const result = checkProfanity("Ye ek chutiya teacher hai");
        expect(result.clean).toBe(false);
        expect(result.matched.length).toBeGreaterThan(0);
    });

    it("detects platform-specific blocked terms", () => {
        const scam = checkProfanity("This tutor is a total scam");
        expect(scam.clean).toBe(false);
        expect(scam.matched).toContain("scam");

        const fraud = checkProfanity("Complete fraud, avoid this tutor");
        expect(fraud.clean).toBe(false);
        expect(fraud.matched).toContain("fraud");
    });

    it("returns sanitized text with profane words masked", () => {
        const result = checkProfanity("This is bullshit");
        expect(result.sanitized).toContain("********");
        expect(result.sanitized).not.toMatch(/bullshit/);
    });

    it("assigns higher severity when multiple profane words are found", () => {
        // Single word → MILD
        const mild = checkProfanity("This is bullshit");
        expect(mild.severity).toBe("MILD");

        // Two words → MODERATE
        const moderate = checkProfanity("This is bullshit and a fraud");
        expect(moderate.severity).toBe("MODERATE");
    });

    it("does not flag common safe words as profanity", () => {
        const safeTexts = [
            "The class was really helpful",
            "I assume the next session is Tuesday",
            "Great teaching assistance provided",
        ];

        for (const text of safeTexts) {
            const result = checkProfanity(text);
            expect(result.clean).toBe(true);
        }
    });
});

// ─── validateReviewComment ──────────────────────────────────────

describe("validateReviewComment", () => {
    it("returns null for a clean review", () => {
        expect(
            validateReviewComment("Amazing tutor! Explains physics concepts clearly.")
        ).toBeNull();
    });

    it("rejects comments over 1000 characters", () => {
        const longComment = "a".repeat(1001);
        expect(validateReviewComment(longComment)).toBe(
            "Comment must be under 1000 characters."
        );
    });

    it("allows through reviews with only mild profanity (single word)", () => {
        // MILD severity should pass — keeps reviews honest without over-censoring
        const result = validateReviewComment("The homework was bullshit but I learned a lot");
        expect(result).toBeNull();
    });

    it("rejects reviews with moderate or worse profanity", () => {
        // Two profane words → MODERATE → blocked
        const error = validateReviewComment("This teacher is absolute bullshit and a fraud");
        expect(error).toBe(
            "Please keep your review respectful and constructive. Remove any inappropriate language and try again."
        );
    });
});
