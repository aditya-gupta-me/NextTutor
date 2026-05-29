import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AvatarUpload from "../AvatarUpload";

// ─── Mocks ──────────────────────────────────────────────────────
// We mock the Supabase client, Toast context, and the global fetch
// (for the moderation API route) so tests stay fast and don't touch
// any real infrastructure.

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: mockUpload,
                remove: mockRemove,
                getPublicUrl: mockGetPublicUrl,
            }),
        },
        auth: {
            getSession: mockGetSession,
        },
    }),
}));

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

vi.mock("@/components/ui/ToastContext", () => ({
    useToast: () => mockToast,
}));

// ─── Helpers ────────────────────────────────────────────────────

const defaultProps = {
    userId: "user-123",
    currentUrl: null as string | null,
    fullName: "Priya Sharma",
    onUpload: vi.fn(),
    onRemove: vi.fn(),
};

/** Creates a mock File for testing uploads */
function createMockFile(
    name: string,
    sizeInBytes: number,
    type: string
): File {
    const content = new Uint8Array(sizeInBytes);
    return new File([content], name, { type });
}

/** Sets up mocks for a successful upload + moderation approval */
function setupApprovedFlow() {
    mockUpload.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
    });

    // Mock the moderation API route (global fetch)
    global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
            status: "approved",
            url: "https://storage.example.com/avatars/user-123/avatar?t=123",
        }),
    });
}

/** Sets up mocks for upload success but moderation rejection */
function setupRejectedFlow(reason?: string) {
    mockUpload.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
    });

    global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({
            status: "rejected",
            reason: reason || "Your photo was flagged as potentially inappropriate.",
        }),
    });

    mockRemove.mockResolvedValue({ error: null });
}

// ─── Tests ──────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    mockRemove.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://storage.example.com/avatars/user-123/avatar" },
    });
    mockGetSession.mockResolvedValue({
        data: { session: { access_token: "test-token" } },
    });
});

describe("AvatarUpload", () => {
    // ── Rendering ───────────────────────────────────────────────

    it("shows initials when no avatar is set", () => {
        render(<AvatarUpload {...defaultProps} />);

        expect(screen.getByText("PS")).toBeInTheDocument();
    });

    it("shows the image when currentUrl is provided", () => {
        render(
            <AvatarUpload
                {...defaultProps}
                currentUrl="https://example.com/photo.jpg"
            />
        );

        const img = screen.getByAltText("Priya Sharma") as HTMLImageElement;
        expect(img.src).toBe("https://example.com/photo.jpg");
    });

    it("shows remove button only when a photo exists", () => {
        const { rerender } = render(<AvatarUpload {...defaultProps} />);

        // No photo → no remove button
        expect(screen.queryByTestId("avatar-remove-btn")).not.toBeInTheDocument();

        // With photo → remove button appears
        rerender(
            <AvatarUpload
                {...defaultProps}
                currentUrl="https://example.com/photo.jpg"
            />
        );
        expect(screen.getByTestId("avatar-remove-btn")).toBeInTheDocument();
    });

    // ── Validation ──────────────────────────────────────────────

    it("rejects files larger than 2 MB", async () => {
        const user = userEvent.setup();
        render(<AvatarUpload {...defaultProps} />);

        const oversizedFile = createMockFile("huge.jpg", 3 * 1024 * 1024, "image/jpeg");
        const input = screen.getByTestId("avatar-file-input");

        await user.upload(input, oversizedFile);

        expect(mockToast.error).toHaveBeenCalledWith("Image must be under 2 MB.");
        expect(mockUpload).not.toHaveBeenCalled();
    });

    it("rejects non-image file types", async () => {
        render(<AvatarUpload {...defaultProps} />);

        const pdfFile = createMockFile("doc.pdf", 100_000, "application/pdf");
        const input = screen.getByTestId("avatar-file-input");

        // fireEvent bypasses the browser's accept-attribute filtering,
        // which is what we need — our code should still validate server-side.
        fireEvent.change(input, { target: { files: [pdfFile] } });

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith(
                "Please upload a JPEG, PNG, or WebP image."
            );
        });
        expect(mockUpload).not.toHaveBeenCalled();
    });

    // ── Upload + Moderation flow ────────────────────────────────

    it("uploads to pending path, moderates, and calls onUpload on approval", async () => {
        setupApprovedFlow();

        const user = userEvent.setup();
        const onUpload = vi.fn();
        render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

        const validFile = createMockFile("headshot.jpg", 500_000, "image/jpeg");
        const input = screen.getByTestId("avatar-file-input");

        await user.upload(input, validFile);

        // Should upload to the "pending" path, not directly to "avatar"
        await waitFor(() => {
            expect(mockUpload).toHaveBeenCalledWith(
                "user-123/pending",
                expect.any(File),
                { upsert: true, contentType: "image/jpeg" }
            );
        });

        // Should call the moderation API
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/moderate-avatar",
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({ userId: "user-123" }),
                })
            );
        });

        // Should pass the approved URL to the parent
        await waitFor(() => {
            expect(onUpload).toHaveBeenCalledWith(
                "https://storage.example.com/avatars/user-123/avatar?t=123"
            );
        });

        expect(mockToast.success).toHaveBeenCalledWith("Photo uploaded!");
    });

    it("shows error toast and reverts preview when moderation rejects", async () => {
        setupRejectedFlow("Your photo appears to contain adult content. Please upload a different photo.");

        const user = userEvent.setup();
        const onUpload = vi.fn();
        render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

        const validFile = createMockFile("photo.png", 100_000, "image/png");
        const input = screen.getByTestId("avatar-file-input");

        await user.upload(input, validFile);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith(
                "Your photo appears to contain adult content. Please upload a different photo."
            );
        });

        // onUpload should NOT have been called on rejection
        expect(onUpload).not.toHaveBeenCalled();
    });

    it("shows error toast and reverts preview when storage upload fails", async () => {
        mockUpload.mockResolvedValue({ error: new Error("Storage error") });

        const user = userEvent.setup();
        const onUpload = vi.fn();
        render(<AvatarUpload {...defaultProps} onUpload={onUpload} />);

        const validFile = createMockFile("photo.png", 100_000, "image/png");
        const input = screen.getByTestId("avatar-file-input");

        await user.upload(input, validFile);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith("Upload failed. Please try again.");
        });

        // onUpload should NOT have been called on failure
        expect(onUpload).not.toHaveBeenCalled();
    });

    // ── Remove flow ─────────────────────────────────────────────

    it("removes photo and calls onRemove on success", async () => {
        const user = userEvent.setup();
        const onRemove = vi.fn();

        render(
            <AvatarUpload
                {...defaultProps}
                currentUrl="https://example.com/photo.jpg"
                onRemove={onRemove}
            />
        );

        const removeBtn = screen.getByTestId("avatar-remove-btn");
        await user.click(removeBtn);

        await waitFor(() => {
            expect(mockRemove).toHaveBeenCalledWith(["user-123/avatar"]);
        });

        await waitFor(() => {
            expect(onRemove).toHaveBeenCalled();
        });

        expect(mockToast.success).toHaveBeenCalledWith("Photo removed.");
    });

    it("shows error toast when removal fails", async () => {
        mockRemove.mockResolvedValue({ error: new Error("Delete error") });

        const user = userEvent.setup();
        render(
            <AvatarUpload
                {...defaultProps}
                currentUrl="https://example.com/photo.jpg"
            />
        );

        const removeBtn = screen.getByTestId("avatar-remove-btn");
        await user.click(removeBtn);

        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith("Couldn't remove photo. Try again.");
        });
    });
});
