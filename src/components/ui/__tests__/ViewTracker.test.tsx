import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import ViewTracker from "../ViewTracker";

/**
 * Tests for ViewTracker component
 *
 * Verifies:
 *   - Fires fetch on mount with correct payload
 *   - Includes auth token when available
 *   - Handles fetch failure silently
 *   - Renders nothing (invisible component)
 */

// Mock Supabase client
const mockGetSession = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        auth: {
            getSession: mockGetSession,
        },
    }),
}));

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("ViewTracker", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue(new Response(null, { status: 202 }));
    });

    it("renders nothing (returns null)", () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });
        const { container } = render(<ViewTracker tutorProfileId="tutor-1" />);
        expect(container.innerHTML).toBe("");
    });

    it("fires POST /api/track-view on mount with correct body", async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });

        render(<ViewTracker tutorProfileId="tutor-profile-123" />);

        // Wait for useEffect to fire
        await vi.waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            "/api/track-view",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ tutorProfileId: "tutor-profile-123" }),
            })
        );
    });

    it("includes Authorization header when user is authenticated", async () => {
        mockGetSession.mockResolvedValue({
            data: {
                session: { access_token: "my-jwt-token" },
            },
        });

        render(<ViewTracker tutorProfileId="tutor-1" />);

        await vi.waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers.Authorization).toBe("Bearer my-jwt-token");
    });

    it("does not include Authorization header for anonymous users", async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });

        render(<ViewTracker tutorProfileId="tutor-1" />);

        await vi.waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers.Authorization).toBeUndefined();
    });

    it("handles fetch failure silently without throwing", async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } });
        mockFetch.mockRejectedValue(new Error("Network failure"));

        // Should not throw
        expect(() => {
            render(<ViewTracker tutorProfileId="tutor-1" />);
        }).not.toThrow();

        await vi.waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
});
