import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateReviewComment } from "../profanity";

describe("validateReviewComment (Perspective API)", () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        process.env.GOOGLE_PERSPECTIVE_API_KEY = "test-key";
    });

    it("returns null for empty comments", async () => {
        expect(await validateReviewComment("")).toBeNull();
        expect(await validateReviewComment("   ")).toBeNull();
    });

    it("rejects comments over 1000 characters", async () => {
        const longComment = "a".repeat(1001);
        expect(await validateReviewComment(longComment)).toBe(
            "Comment must be under 1000 characters."
        );
    });

    it("fails open (allows comment) if API key is missing", async () => {
        delete process.env.GOOGLE_PERSPECTIVE_API_KEY;
        // Mock fetch just in case, though it shouldn't be called
        vi.stubGlobal("fetch", vi.fn());
        
        expect(await validateReviewComment("This is a test comment")).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("allows comments with toxicity <= 60%", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                attributeScores: {
                    TOXICITY: { summaryScore: { value: 0.59 } }
                }
            })
        }));

        expect(await validateReviewComment("This class was okay, but could be better.")).toBeNull();
    });

    it("rejects comments with toxicity > 60%", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                attributeScores: {
                    TOXICITY: { summaryScore: { value: 0.85 } }
                }
            })
        }));

        const result = await validateReviewComment("This teacher is absolute garbage.");
        expect(result).toBe(
            "Please keep your review respectful and constructive. Remove any inappropriate language and try again."
        );
    });

    it("fails open (allows comment) if the API returns an error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: false,
            status: 500
        }));

        // Should not block user if Google is down
        expect(await validateReviewComment("This is a test comment")).toBeNull();
    });
});
