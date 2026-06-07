import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for GET /api/analytics
 *
 * Verifies auth, authorization, and response structure.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

const mockGetUser = vi.fn();

function makeChainable() {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
        select: vi.fn(),
        eq: vi.fn(),
        gte: vi.fn(),
        lt: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        single: vi.fn().mockResolvedValue({ data: null }),
    };
    for (const key of Object.keys(chain)) {
        chain[key].mockReturnValue(chain);
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

const { GET } = await import("@/app/api/analytics/route");

function makeRequest(range = "30d", token?: string) {
    const url = `http://localhost:3000/api/analytics?range=${range}`;
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const req = new Request(url, { method: "GET", headers });
    (req as unknown as Record<string, unknown>).nextUrl = new URL(url);
    return req as unknown as import("next/server").NextRequest;
}

describe("GET /api/analytics", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockChain = makeChainable();
        mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    });

    it("returns 401 when no Authorization header", async () => {
        const res = await GET(makeRequest("30d"));
        expect(res.status).toBe(401);
    });

    it("returns 401 when auth token is invalid", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null },
            error: new Error("Invalid"),
        });

        const res = await GET(makeRequest("30d", "bad-token"));
        expect(res.status).toBe(401);
    });

    it("returns 403 when user is not a tutor", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: "student-1" } },
            error: null,
        });
        // No tutor profile found
        mockChain.single.mockResolvedValue({ data: null });

        const res = await GET(makeRequest("30d", "valid-token"));
        expect(res.status).toBe(403);
    });

    it("returns 200 with correct shape for valid tutor", async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: "tutor-user-1" } },
            error: null,
        });

        // First .single() call = tutor profile found
        // Subsequent calls return empty
        let singleCallCount = 0;
        mockChain.single.mockImplementation(() => {
            singleCallCount++;
            if (singleCallCount === 1) {
                return Promise.resolve({ data: { id: "tutor-profile-1" } });
            }
            return Promise.resolve({ data: null });
        });

        // order() and lt() return empty data arrays
        mockChain.order.mockResolvedValue({ data: [] });
        mockChain.lt.mockResolvedValue({ data: [] });
        mockChain.limit.mockResolvedValue({ data: [] });

        // select with count (today's live views)
        mockChain.select.mockReturnValue({
            ...mockChain,
            // head: true queries return count
        });
        mockChain.gte.mockReturnValue({
            ...mockChain,
        });

        const res = await GET(makeRequest("7d", "valid-token"));
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toHaveProperty("summary");
        expect(body).toHaveProperty("daily");
        expect(body).toHaveProperty("events");
        expect(body.summary.totalViews).toBe(0);
        expect(body.summary.uniqueVisitors).toBe(0);
        expect(body.summary.growthPercent).toBe(0);
        expect(body.summary.periodLabel).toBe("Last 7 days");
        expect(Array.isArray(body.daily)).toBe(true);
        expect(Array.isArray(body.events)).toBe(true);
    });
});
