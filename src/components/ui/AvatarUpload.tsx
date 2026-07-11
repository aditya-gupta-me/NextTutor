"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastContext";
import Image from "next/image";
import { BoxIcon } from "@/components/ui/BoxIcon";

// Keeps file uploads predictable — no surprises in prod
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadProps {
    userId: string;
    currentUrl: string | null;
    fullName: string;
    onUpload: (url: string) => void;
    onRemove: () => void;
    accentGradient?: string;
}

/**
 * Self-contained avatar upload widget with image moderation.
 *
 * Flow:
 *   1. User selects a file → instant local preview
 *   2. File uploads to Supabase Storage at a "pending" path
 *   3. Server-side moderation API analyses the image via Azure Content Safety
 *   4. If approved → image moves to the live path, parent gets the URL
 *   5. If rejected → pending file deleted, preview reverted, error shown
 *
 * The parent only receives the final URL after moderation approval.
 */
export default function AvatarUpload({
    userId,
    currentUrl,
    fullName,
    onUpload,
    onRemove,
    accentGradient = "linear-gradient(135deg, #9B7FD4, #C3B1E1)",
}: AvatarUploadProps) {
    const supabase = createClient();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploading, setUploading] = useState(false);
    const [moderating, setModerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // What we actually display — local preview takes priority over DB URL
    const displayUrl = previewUrl || currentUrl;

    const initials = (fullName || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const isBusy = uploading || moderating;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so selecting the same file again still triggers onChange
        e.target.value = "";

        // --- Validation ---
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error("Please upload a JPEG, PNG, or WebP image.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error("Image must be under 2 MB.");
            return;
        }

        // Show instant preview while upload happens in the background
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);
        setUploading(true);

        try {
            // ─── Stage 1: Upload to "pending" path ───
            const pendingPath = `${userId}/pending`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(pendingPath, file, {
                    upsert: true,
                    contentType: file.type,
                });

            if (uploadError) throw uploadError;

            setUploading(false);
            setModerating(true);

            // ─── Stage 2: Call moderation API ───
            const { data: { session } } = await supabase.auth.getSession();

            const moderationResponse = await fetch("/api/moderate-avatar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ userId }),
            });

            if (!moderationResponse.ok) {
                const errorData = await moderationResponse.json().catch(() => null);
                setPreviewUrl(null);
                toast.error(errorData?.reason || "Photo could not be verified. Please try a different image.");
                // Best-effort cleanup of pending file
                supabase.storage.from("avatars").remove([pendingPath]).catch(() => {});
                return;
            }

            const moderationResult = await moderationResponse.json();

            if (moderationResult.status === "approved") {
                // Moderation passed — use the live URL
                onUpload(moderationResult.url);
                toast.success("Photo uploaded!");
            } else {
                // Rejected or error — revert preview
                setPreviewUrl(null);
                toast.error(moderationResult.reason || "Photo could not be verified. Please try a different image.");
            }
        } catch (err) {
            console.error("Avatar upload failed:", err);
            toast.error("Upload failed. Please try again.");
            // Revert preview on failure
            setPreviewUrl(null);

            // Best-effort cleanup of pending file
            supabase.storage.from("avatars").remove([`${userId}/pending`]).catch(() => {});
        } finally {
            setUploading(false);
            setModerating(false);
            URL.revokeObjectURL(localPreview);
        }
    };

    const handleRemove = async () => {
        setUploading(true);

        try {
            const { error } = await supabase.storage
                .from("avatars")
                .remove([`${userId}/avatar`]);

            if (error) throw error;

            setPreviewUrl(null);
            onRemove();
            toast.success("Photo removed.");
        } catch (err) {
            console.error("Avatar removal failed:", err);
            toast.error("Couldn't remove photo. Try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group" data-testid="avatar-upload">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="avatar-file-input"
            />

            {/* Avatar circle with gradient ring */}
            <div className="shrink-0 rounded-full p-[3px]" style={{ background: accentGradient }}>
                <div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full bg-bg-white text-2xl font-bold text-accent border-[3px] border-bg-white overflow-hidden cursor-pointer"
                    onClick={() => !isBusy && fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload profile photo"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                        }
                    }}
                >
                    {/* Current photo or initials */}
                    {displayUrl ? (
                        <Image
                            src={displayUrl}
                            alt={`${fullName} profile photo`}
                            width={96}
                            height={96}
                            unoptimized={displayUrl.startsWith('blob:')}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl">{initials}</span>
                    )}

                    {/* Hover overlay — hidden during upload/moderation */}
                    {!isBusy && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <BoxIcon className="bx bx-camera text-white text-xl" />
                            <span className="text-[10px] text-white/90 font-medium mt-0.5">
                                Change
                            </span>
                        </div>
                    )}

                    {/* Upload spinner */}
                    {uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40">
                            <BoxIcon className="bx bx-loader-alt text-white text-2xl animate-spin" />
                            <span className="text-[9px] text-white/80 font-medium mt-1">Uploading…</span>
                        </div>
                    )}

                    {/* Moderation spinner */}
                    {moderating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40">
                            <BoxIcon className="bx bx-shield-quarter text-white text-2xl animate-pulse" />
                            <span className="text-[9px] text-white/80 font-medium mt-1">Verifying…</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Remove button — only visible when there's a photo and not busy */}
            {displayUrl && !isBusy && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-bg-white border border-border shadow-sm text-text-tertiary hover:text-error hover:border-error/30 transition-base cursor-pointer"
                    title="Remove photo"
                    data-testid="avatar-remove-btn"
                >
                    <BoxIcon className="bx bx-trash text-sm" />
                </button>
            )}
        </div>
    );
}
