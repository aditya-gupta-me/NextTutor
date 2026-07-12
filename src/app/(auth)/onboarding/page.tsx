"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InlineAlert from "@/components/ui/InlineAlert";

type Role = "student" | "tutor";

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<Role>("student");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");

    // Check if user already has a complete profile — if so, skip onboarding
    useEffect(() => {
        const check = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/continue");
                return;
            }

            const { data: profile } = await supabase
                .from("users")
                .select("full_name, role")
                .eq("id", user.id)
                .maybeSingle();

            if (profile?.full_name && profile.full_name.trim() !== "") {
                // Already onboarded
                router.replace("/dashboard");
                return;
            }

            // Pre-fill from user metadata if available
            const meta = user.user_metadata || {};
            if (meta.full_name) setFullName(meta.full_name);
            if (meta.role === "tutor" || meta.role === "student") setRole(meta.role);

            setChecking(false);
        };
        check();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!fullName.trim()) {
            setError("Please enter your name.");
            return;
        }
        if (fullName.trim().length < 2) {
            setError("Name must be at least 2 characters.");
            return;
        }

        setLoading(true);

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Create/update user row
            const { error: upsertErr } = await supabase.from("users").upsert(
                {
                    id: user.id,
                    email: user.email ?? null,
                    full_name: fullName.trim(),
                    role,
                },
                { onConflict: "id" }
            );

            if (upsertErr) throw new Error(upsertErr.message);

            // Also update auth metadata so it's available later
            await supabase.auth.updateUser({
                data: { full_name: fullName.trim(), role },
            });

            router.replace("/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="text-center py-12">
                <div className="h-8 w-48 skeleton mx-auto mb-4 rounded-[var(--radius-md)]" />
                <div className="h-4 w-64 skeleton mx-auto rounded-[var(--radius-md)]" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-2xl mb-4">
                    👋
                </div>
                <h1 className="font-serif text-3xl font-bold text-text-primary">
                    Welcome aboard!
                </h1>
                <p className="mt-2 text-text-secondary">
                    Let&apos;s set up your profile. This takes 10 seconds.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                    <label
                        htmlFor="fullName"
                        className="text-sm font-medium text-text-primary mb-1.5 block"
                    >
                        What&apos;s your name?
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        required
                        autoFocus
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full rounded-[var(--radius-md)] border border-border bg-bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-base focus:border-accent focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
                    />
                </div>

                {/* Role selector */}
                <div>
                    <label className="text-sm font-medium text-text-primary mb-2 block">
                        I am a
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setRole("student")}
                            className={`flex items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-base ${role === "student"
                                ? "border-accent bg-accent-light shadow-[var(--shadow-xs)]"
                                : "border-border bg-bg-white hover:bg-bg-secondary"
                                }`}
                        >
                            <span className="text-2xl">🎓</span>
                            <div className="text-left">
                                <div className="text-sm font-semibold text-text-primary">
                                    Student
                                </div>
                                <div className="text-[11px] text-text-secondary">
                                    Find tutors near me
                                </div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("tutor")}
                            className={`flex items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-base ${role === "tutor"
                                ? "border-accent bg-accent-light shadow-[var(--shadow-xs)]"
                                : "border-border bg-bg-white hover:bg-bg-secondary"
                                }`}
                        >
                            <span className="text-2xl">📚</span>
                            <div className="text-left">
                                <div className="text-sm font-semibold text-text-primary">
                                    Tutor
                                </div>
                                <div className="text-[11px] text-text-secondary">
                                    Reach more students
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <InlineAlert variant="error" message={error} dismissible />
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-[var(--radius-md)] bg-accent py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Setting up..." : "Get started →"}
                </button>
            </form>
        </div>
    );
}
