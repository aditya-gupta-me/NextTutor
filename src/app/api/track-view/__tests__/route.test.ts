import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for POST /api/track-view
 *
 * Tests the API route's input validation, self-view rejection,
 * error resilience, and successful view insertion.
 *
 * Note: Cooldown dedup and self-view checks involve complex
 * multi-table query chains that are better tested via integration.
 * These unit tests verify the contract and error handling.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockGetUser = vi.fn();

function makeChainable() {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
        select: vi.fn(),
        eq: vi.fn(),
        gte: vi.fn(),
        lt: vi.fn(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: mockInsert,
    };
    for (const key of Object.keys(chain)) {
        if (key !== "insert") {
            chain[key].mockReturnValue(chain);
        }
    }
    return chain;
}

let mockChain = makeChainable();

vi.mock("@supabase/supabase-js", () => ({
    createClient: () => ({
        from: vi.fn().mockImplementation(() => mockChain),
        auth: { getUser: mockGetUser },
    }),
}));

const { POST } = await import("@/app/api/track-view/route");

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
    const ip = `10.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
    return new Request("http://localhost:3000/api/track-view", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": ip,
            "user-agent": "test-agent",
            ...headers,
        },
        body: JSON.stringify(body),
    }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/track-view", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChain = makeChainable();
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
        mockInsert.mockResolvedValue({ error: null });
    });

    it("returns 400 for missing tutorProfileId", async () => {
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(400);
    });

    it("returns 400 for non-string tutorProfileId", async () => {
        const res = await POST(makeRequest({ tutorProfileId: 42 }));
        expect(res.status).toBe(400);
    });

    it("returns 202 and inserts view for anonymous visitor (no cooldown match)", async () => {
        const res = await POST(makeRequest({ tutorProfileId: "tutor-1" }));
        expect(res.status).toBe(202);
        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                tutor_profile_id: "tutor-1",
                viewer_id: null,
                viewer_fingerprint: expect.any(String),
            })
        );
    });

    it("returns 202 and inserts view for authenticated non-self visitor", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: "student-1" } },
            error: null,
        });
        // .single() returns tutor profile with different user_id (not self)
        mockChain.single.mockResolvedValue({ data: { user_id: "tutor-owner" } });
        // .limit() returns no cooldown match
        mockChain.limit.mockResolvedValue({ data: [] });

        const res = await POST(
            makeRequest({ tutorProfileId: "tutor-1" }, { Authorization: "Bearer token" })
        );
        expect(res.status).toBe(202);
        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                tutor_profile_id: "tutor-1",
                viewer_id: "student-1",
            })
        );
    });

    it("returns 202 even when internal error occurs (fire-and-forget)", async () => {
        (mockChain.select as ReturnType<typeof vi.fn>).mockImplementation(() => {
            throw new Error("DB crash");
        });

        const res = await POST(makeRequest({ tutorProfileId: "tutor-1" }));
        expect(res.status).toBe(202);
    });

    it("returns 400 for unparseable JSON body", async () => {
        const req = new Request("http://localhost:3000/api/track-view", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": "10.0.0.1",
                "user-agent": "test",
            },
            body: "{{{{not json",
        }) as unknown as import("next/server").NextRequest;

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it("includes fingerprint hash (not raw IP) in the insert", async () => {
        const res = await POST(makeRequest({ tutorProfileId: "tutor-2" }));
        expect(res.status).toBe(202);

        const insertArg = mockInsert.mock.calls[0][0];
        // Fingerprint should be a hex string, not raw IP
        expect(insertArg.viewer_fingerprint).toMatch(/^[a-f0-9]{16}$/);
    });
});
