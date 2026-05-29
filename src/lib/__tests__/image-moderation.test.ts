import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { moderateImage } from "../image-moderation";

// ─── Mock fetch globally ────────────────────────────────────────

const originalFetch = global.fetch;

beforeEach(() => {
    vi.stubEnv("GOOGLE_CLOUD_VISION_API_KEY", "test-vision-key");
});

afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
});

/** Helper to mock a SafeSearch API response */
function mockVisionResponse(annotations: Record<string, string>) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            responses: [{
                safeSearchAnnotation: annotations,
            }],
        }),
    });
}

describe("moderateImage", () => {
    // ── Safe images ─────────────────────────────────────────────

    it("returns safe=true for a clean image", async () => {
        mockVisionResponse({
            adult: "VERY_UNLIKELY",
            violence: "VERY_UNLIKELY",
            racy: "VERY_UNLIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(true);
        expect(result.flaggedCategories).toHaveLength(0);
        expect(result.error).toBeUndefined();
    });

    it("allows racy=POSSIBLE (below threshold)", async () => {
        mockVisionResponse({
            adult: "VERY_UNLIKELY",
            violence: "VERY_UNLIKELY",
            racy: "POSSIBLE",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(true);
        expect(result.flaggedCategories).toHaveLength(0);
    });

    it("allows racy=LIKELY (only VERY_LIKELY triggers for racy)", async () => {
        mockVisionResponse({
            adult: "VERY_UNLIKELY",
            violence: "VERY_UNLIKELY",
            racy: "LIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(true);
    });

    // ── Flagged images ──────────────────────────────────────────

    it("flags adult=LIKELY", async () => {
        mockVisionResponse({
            adult: "LIKELY",
            violence: "VERY_UNLIKELY",
            racy: "UNLIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("adult");
    });

    it("flags adult=VERY_LIKELY", async () => {
        mockVisionResponse({
            adult: "VERY_LIKELY",
            violence: "VERY_UNLIKELY",
            racy: "UNLIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("adult");
    });

    it("flags violence=LIKELY", async () => {
        mockVisionResponse({
            adult: "VERY_UNLIKELY",
            violence: "LIKELY",
            racy: "UNLIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("violence");
    });

    it("flags racy=VERY_LIKELY", async () => {
        mockVisionResponse({
            adult: "VERY_UNLIKELY",
            violence: "VERY_UNLIKELY",
            racy: "VERY_LIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("racy");
    });

    it("flags multiple categories at once", async () => {
        mockVisionResponse({
            adult: "VERY_LIKELY",
            violence: "LIKELY",
            racy: "VERY_LIKELY",
            spoof: "UNLIKELY",
            medical: "UNLIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("adult");
        expect(result.flaggedCategories).toContain("violence");
        expect(result.flaggedCategories).toContain("racy");
    });

    // ── Error handling ──────────────────────────────────────────

    it("returns safe=false with error when API key is missing", async () => {
        vi.stubEnv("GOOGLE_CLOUD_VISION_API_KEY", "");

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("returns safe=false with error when API returns non-200", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            text: () => Promise.resolve("Forbidden"),
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("returns safe=false with error when API response is malformed", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ responses: [{}] }),
        });

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("returns safe=false with error on network failure", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.error).toBeDefined();
    });

    // ── Score passthrough ───────────────────────────────────────

    it("returns raw scores from the API", async () => {
        mockVisionResponse({
            adult: "UNLIKELY",
            violence: "VERY_UNLIKELY",
            racy: "POSSIBLE",
            spoof: "LIKELY",
            medical: "VERY_LIKELY",
        });

        const result = await moderateImage("base64data");

        expect(result.scores.adult).toBe("UNLIKELY");
        expect(result.scores.violence).toBe("VERY_UNLIKELY");
        expect(result.scores.racy).toBe("POSSIBLE");
        expect(result.scores.spoof).toBe("LIKELY");
        expect(result.scores.medical).toBe("VERY_LIKELY");
    });
});
