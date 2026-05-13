"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastContext";

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
 * Self-contained avatar upload widget.
 *
 * Handles file selection, validation, Supabase Storage upload,
 * and preview — all client-side. The parent just gets the final
 * public URL via `onUpload` and includes it in the save payload.
 *
 * Built for the tutor edit page but reusable anywhere.
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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // What we actually display — local preview takes priority over DB URL
    const displayUrl = previewUrl || currentUrl;

    const initials = (fullName || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

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
            // One file per user — always overwrite at the same path.
            // This avoids orphaned files piling up in storage.
            const filePath = `${userId}/avatar`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file, {
                    upsert: true,
                    contentType: file.type,
                });

            if (uploadError) throw uploadError;

            // Build the public URL with a cache-buster so the browser
            // doesn't show a stale cached version after re-upload
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            const freshUrl = `${publicUrl}?t=${Date.now()}`;
            onUpload(freshUrl);
            toast.success("Photo uploaded!");
        } catch (err) {
            console.error("Avatar upload failed:", err);
            toast.error("Upload failed. Please try again.");
            // Revert preview on failure
            setPreviewUrl(null);
        } finally {
            setUploading(false);
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
                    onClick={() => !uploading && fileInputRef.current?.click()}
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
                        <img
                            src={displayUrl}
                            alt={fullName}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl">{initials}</span>
                    )}

                    {/* Hover overlay — hidden during upload */}
                    {!uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <i className="bx bx-camera text-white text-xl" />
                            <span className="text-[10px] text-white/90 font-medium mt-0.5">
                                Change
                            </span>
                        </div>
                    )}

                    {/* Upload spinner */}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                            <i className="bx bx-loader-alt text-white text-2xl animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Remove button — only visible when there's a photo to remove */}
            {displayUrl && !uploading && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-bg-white border border-border shadow-sm text-text-tertiary hover:text-error hover:border-error/30 transition-base cursor-pointer"
                    title="Remove photo"
                    data-testid="avatar-remove-btn"
                >
                    <i className="bx bx-trash text-sm" />
                </button>
            )}
        </div>
    );
}
