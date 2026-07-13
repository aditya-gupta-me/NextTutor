"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import InlineAlert from "@/components/ui/InlineAlert";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContinuePage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    // Read URL error parameter on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("error") === "auth_callback_failed") {
            setError("Your sign-in link expired or is invalid. Please try again.");
        }
    }, []);

    // Cooldown timer — synced with Supabase's SMTP minimum interval (60s)
    const [resendCooldown, setResendCooldown] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startCooldown = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        setResendCooldown(60);
        timerRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) { 
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0; 
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const supabase = createClient();

            if (!EMAIL_REGEX.test(email)) {
                throw new Error("Please enter a valid email address.");
            }

            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (authError) throw authError;
            setEmailSent(true);
            startCooldown();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (authError) throw authError;
            
            startCooldown();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to resend email.");
        }
    };

    // Email sent confirmation
    if (emailSent) {
        return (
            <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent-light text-3xl mb-5">
                    ✉️
                </div>
                <h1 className="font-serif text-2xl font-bold text-text-primary mb-2">
                    Check your inbox
                </h1>
                <p className="text-text-secondary mb-2">We sent a sign-in link to</p>
                <p className="text-sm font-medium text-text-primary mb-6">{email}</p>
                <p className="text-xs text-text-tertiary leading-relaxed">
                    Click the link in the email to continue. <br />
                    If you don&apos;t see it, check your spam folder.
                </p>

                {error && (
                    <div className="mt-4">
                        <InlineAlert variant="error" message={error} dismissible />
                    </div>
                )}

                <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="mt-6 w-full rounded-[var(--radius-md)] border border-border py-3 text-sm font-medium text-text-primary transition-base hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend Verification Email"}
                </button>
                <button
                    onClick={() => { setEmailSent(false); setError(""); }}
                    className="mt-3 text-sm text-accent font-medium hover:underline cursor-pointer"
                >
                    ← Try a different email
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-text-primary">
                    Welcome to NextTutor
                </h1>
                <p className="mt-2 text-text-secondary">
                    Enter your email to continue. We&apos;ll create your account if
                    you&apos;re new.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input */}
                <div>
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-text-primary mb-1.5 block"
                    >
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-[var(--radius-md)] border border-border bg-bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-base focus:border-accent focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
                    />
                </div>

                {/* Error */}
                {error && <InlineAlert variant="error" message={error} dismissible />}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-[var(--radius-md)] bg-accent py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {loading ? "Sending..." : "Continue →"}
                </button>
            </form>

            {/* Info */}
            <p className="mt-6 text-center text-[11px] text-text-tertiary leading-relaxed">
                By continuing, you agree to our{" "}
                <a href="/terms" className="underline hover:text-text-secondary">
                    Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline hover:text-text-secondary">
                    Privacy Policy
                </a>
                .
            </p>
        </div>
    );
}
