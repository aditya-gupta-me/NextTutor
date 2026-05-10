"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InlineAlert from "@/components/ui/InlineAlert";

interface AuthContext {
    method: "phone" | "email";
    phone?: string;
    email?: string;
}

export default function VerifyOtpPage() {
    const router = useRouter();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendTimer, setResendTimer] = useState(30);
    const [context, setContext] = useState<AuthContext | null>(null);
    const [contextLoaded, setContextLoaded] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Load context from sessionStorage (browser-only)
    useEffect(() => {
        const stored = sessionStorage.getItem("tsearch_auth");
        if (stored) {
            setContext(JSON.parse(stored));
        }
        setContextLoaded(true);
    }, []);

    // Resend timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setTimeout(() => setResendTimer((p) => p - 1), 1000);
        return () => clearTimeout(t);
    }, [resendTimer]);

    // Auto-focus first input once context loads
    useEffect(() => {
        if (contextLoaded) inputRefs.current[0]?.focus();
    }, [contextLoaded]);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-advance
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits entered
        if (newOtp.every((d) => d) && newOtp.join("").length === 6) {
            handleVerify(newOtp.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newOtp = [...otp];
        pasted.split("").forEach((char, i) => {
            newOtp[i] = char;
        });
        setOtp(newOtp);
        if (pasted.length === 6) {
            handleVerify(pasted);
        } else {
            inputRefs.current[pasted.length]?.focus();
        }
    };

    const handleVerify = async (code: string) => {
        if (!context) {
            setError("Session expired. Please start over.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const supabase = createClient();

            if (context.method === "phone") {
                const { error: authError } = await supabase.auth.verifyOtp({
                    phone: context.phone!,
                    token: code,
                    type: "sms",
                });
                if (authError) throw authError;
            } else {
                const { error: authError } = await supabase.auth.verifyOtp({
                    email: context.email!,
                    token: code,
                    type: "email",
                });
                if (authError) throw authError;
            }

            // Clean up
            sessionStorage.removeItem("tsearch_auth");

            // Check if user needs onboarding
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("full_name")
                    .eq("id", user.id)
                    .maybeSingle();

                if (!profile?.full_name || profile.full_name.trim() === "") {
                    router.push("/onboarding");
                    return;
                }
            }

            router.push("/dashboard");
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Invalid OTP. Please try again."
            );
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0 || !context) return;
        setResendTimer(30);

        try {
            const supabase = createClient();
            if (context.method === "phone") {
                await supabase.auth.signInWithOtp({ phone: context.phone! });
            } else {
                await supabase.auth.signInWithOtp({ email: context.email! });
            }
        } catch {
            setError("Failed to resend OTP. Please try again.");
        }
    };

    if (!contextLoaded) {
        return (
            <div className="text-center py-16">
                <p className="text-text-secondary">Loading...</p>
            </div>
        );
    }

    if (!context) {
        return (
            <div className="text-center">
                <h1 className="font-serif text-2xl font-bold text-text-primary mb-4">
                    Session expired
                </h1>
                <p className="text-text-secondary mb-6">
                    Your verification session has expired. Please start over.
                </p>
                <a
                    href="/continue"
                    className="inline-block rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover"
                >
                    Start over
                </a>
            </div>
        );
    }

    const displayIdentifier =
        context.method === "phone"
            ? (context.phone || "").replace(/(\+91)(\d{5})(\d{5})/, "$1 $2 $3")
            : context.email || "";

    return (
        <div>
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-2xl mb-4">
                    📱
                </div>
                <h1 className="font-serif text-2xl font-bold text-text-primary">
                    Enter verification code
                </h1>
                <p className="mt-2 text-sm text-text-secondary">
                    We sent a 6-digit code to{" "}
                    <span className="font-medium text-text-primary">
                        {displayIdentifier}
                    </span>
                </p>
            </div>

            {/* OTP inputs */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => {
                            inputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        disabled={loading}
                        className={`h-14 w-11 rounded-[var(--radius-md)] border text-center text-lg font-semibold outline-none transition-base ${digit
                            ? "border-accent bg-accent-light/50 text-text-primary"
                            : "border-border bg-bg-white text-text-primary"
                            } focus:border-accent focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)] disabled:opacity-50`}
                    />
                ))}
            </div>

            {/* Error */}
            {error && (
                <InlineAlert variant="error" message={error} dismissible />
            )}

            {/* Loading state */}
            {loading && (
                <p className="text-center text-sm text-text-secondary mb-4">
                    Verifying...
                </p>
            )}

            {/* Resend */}
            <div className="text-center">
                {resendTimer > 0 ? (
                    <p className="text-sm text-text-tertiary">
                        Resend code in {resendTimer}s
                    </p>
                ) : (
                    <button
                        onClick={handleResend}
                        className="text-sm font-medium text-accent hover:underline"
                    >
                        Resend code
                    </button>
                )}
            </div>
        </div>
    );
}
