import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { moderateImage } from "../image-moderation";

// ─── Mock fetch globally ────────────────────────────────────────

const originalFetch = global.fetch;

beforeEach(() => {
    vi.stubEnv("AZURE_CONTENT_SAFETY_ENDPOINT", "https://test.cognitiveservices.azure.com");
    vi.stubEnv("AZURE_CONTENT_SAFETY_KEY", "test-key");
});

afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
});

/** Helper to mock an Azure Content Safety response */
function mockAzureResponse(categories: Array<{ category: string; severity: number }>) {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
            categoriesAnalysis: categories,
        }),
    });
}

/** Default safe response — all categories at severity 0 */
function safeCategories() {
    return [
        { category: "Hate", severity: 0 },
        { category: "SelfHarm", severity: 0 },
        { category: "Sexual", severity: 0 },
        { category: "Violence", severity: 0 },
    ];
}

describe("moderateImage", () => {
    // ── Safe images ─────────────────────────────────────────────

    it("returns safe=true when all categories are severity 0", async () => {
        mockAzureResponse(safeCategories());

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(true);
        expect(result.flaggedCategories).toHaveLength(0);
        expect(result.error).toBeUndefined();
    });

    // ── Flagged images ──────────────────────────────────────────

    it("flags Sexual at severity 2", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 0 },
            { category: "SelfHarm", severity: 0 },
            { category: "Sexual", severity: 2 },
            { category: "Violence", severity: 0 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("Sexual");
    });

    it("flags Sexual at severity 6 (high)", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 0 },
            { category: "SelfHarm", severity: 0 },
            { category: "Sexual", severity: 6 },
            { category: "Violence", severity: 0 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("Sexual");
    });

    it("flags Violence at severity 4", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 0 },
            { category: "SelfHarm", severity: 0 },
            { category: "Sexual", severity: 0 },
            { category: "Violence", severity: 4 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("Violence");
    });

    it("flags Hate at severity 2", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 2 },
            { category: "SelfHarm", severity: 0 },
            { category: "Sexual", severity: 0 },
            { category: "Violence", severity: 0 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("Hate");
    });

    it("flags SelfHarm at severity 2", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 0 },
            { category: "SelfHarm", severity: 2 },
            { category: "Sexual", severity: 0 },
            { category: "Violence", severity: 0 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("SelfHarm");
    });

    it("flags multiple categories at once", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 4 },
            { category: "SelfHarm", severity: 0 },
            { category: "Sexual", severity: 6 },
            { category: "Violence", severity: 2 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.flaggedCategories).toContain("Hate");
        expect(result.flaggedCategories).toContain("Sexual");
        expect(result.flaggedCategories).toContain("Violence");
        expect(result.flaggedCategories).not.toContain("SelfHarm");
    });

    // ── Error handling ──────────────────────────────────────────

    it("returns safe=false with error when endpoint is missing", async () => {
        vi.stubEnv("AZURE_CONTENT_SAFETY_ENDPOINT", "");

        const result = await moderateImage("base64data");

        expect(result.safe).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("returns safe=false with error when key is missing", async () => {
        vi.stubEnv("AZURE_CONTENT_SAFETY_KEY", "");

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
            json: () => Promise.resolve({ unexpected: "format" }),
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

    it("returns raw severity scores from the API", async () => {
        mockAzureResponse([
            { category: "Hate", severity: 0 },
            { category: "SelfHarm", severity: 2 },
            { category: "Sexual", severity: 4 },
            { category: "Violence", severity: 6 },
        ]);

        const result = await moderateImage("base64data");

        expect(result.scores.Hate).toBe(0);
        expect(result.scores.SelfHarm).toBe(2);
        expect(result.scores.Sexual).toBe(4);
        expect(result.scores.Violence).toBe(6);
    });
});
