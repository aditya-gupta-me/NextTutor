"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMethod = "phone" | "email";
type Role = "student" | "tutor";

export default function SignupPage() {
    const router = useRouter();
    const [method, setMethod] = useState<AuthMethod>("phone");
    const [role, setRole] = useState<Role>("student");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendError, setResendError] = useState("");

    // Countdown timer for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const supabase = createClient();

            if (method === "phone") {
                const formattedPhone = phone.startsWith("+91")
                    ? phone
                    : `+91${phone.replace(/\D/g, "")}`;
                const { error: authError } = await supabase.auth.signInWithOtp({
                    phone: formattedPhone,
                });
                if (authError) throw authError;

                // Store signup context for after OTP verification
                sessionStorage.setItem(
                    "tsearch_signup",
                    JSON.stringify({ method: "phone", phone: formattedPhone, fullName, role }),
                );
                router.push("/verify-otp");
            } else {
                const { error: authError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                        data: { full_name: fullName, role },
                    },
                });
                if (authError) throw authError;
                setEmailSent(true);
                setResendCooldown(60);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

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
                    Click the link in the email to complete your signup. <br />
                    If you don&apos;t see it, check your spam folder.
                </p>

                {resendError && (
                    <div className="mt-4 rounded-[var(--radius-md)] bg-error-light border border-error/20 px-4 py-2.5 text-xs text-error">
                        {resendError}
                    </div>
                )}

                <div className="mt-6 flex flex-col items-center gap-3">
                    <button
                        onClick={async () => {
                            setResendError("");
                            try {
                                const supabase = createClient();
                                const { error: resendErr } = await supabase.auth.signInWithOtp({
                                    email,
                                    options: {
                                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                                        data: { full_name: fullName, role },
                                    },
                                });
                                if (resendErr) throw resendErr;
                                setResendCooldown(60);
                            } catch (err: unknown) {
                                setResendError(err instanceof Error ? err.message : "Failed to resend. Try again.");
                            }
                        }}
                        disabled={resendCooldown > 0}
                        className="text-sm font-medium transition-base disabled:cursor-not-allowed disabled:text-text-tertiary text-accent hover:underline"
                    >
                        {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : "Resend verification email"}
                    </button>
                    <button
                        onClick={() => { setEmailSent(false); setResendError(""); }}
                        className="text-sm text-text-tertiary hover:text-text-secondary"
                    >
                        ← Use a different email
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-text-primary">
                    Create your account
                </h1>
                <p className="mt-2 text-text-secondary">
                    Join NextTutor — it&apos;s free for students and tutors.
                </p>
            </div>

            {/* Role selector */}
            <div className="mb-6">
                <label className="text-sm font-medium text-text-primary mb-2 block">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`flex items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-base ${
                            role === "student"
                                ? "border-accent bg-accent-light shadow-[var(--shadow-xs)]"
                                : "border-border bg-bg-white hover:bg-bg-secondary"
                        }`}
                    >
                        <span className="text-2xl">🎓</span>
                        <div className="text-left">
                            <div className="text-sm font-semibold text-text-primary">Student</div>
                            <div className="text-[11px] text-text-secondary">
                                Find tutors near me
                            </div>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("tutor")}
                        className={`flex items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-base ${
                            role === "tutor"
                                ? "border-accent bg-accent-light shadow-[var(--shadow-xs)]"
                                : "border-border bg-bg-white hover:bg-bg-secondary"
                        }`}
                    >
                        <span className="text-2xl">📚</span>
                        <div className="text-left">
                            <div className="text-sm font-semibold text-text-primary">Tutor</div>
                            <div className="text-[11px] text-text-secondary">
                                Reach more students
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                    <label
                        htmlFor="fullName"
                        className="text-sm font-medium text-text-primary mb-1.5 block"
                    >
                        Full name
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full rounded-[var(--radius-md)] border border-border bg-bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-base focus:border-accent focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
                    />
                </div>

                {/* Auth method toggle */}
                <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                        Sign up with
                    </label>
                    <div className="flex rounded-[var(--radius-md)] border border-border bg-bg-secondary p-0.5">
                        <button
                            type="button"
                            onClick={() => setMethod("phone")}
                            className={`flex-1 rounded-[var(--radius-sm)] py-2 text-xs font-medium transition-base ${
                                method === "phone"
                                    ? "bg-bg-white text-text-primary shadow-[var(--shadow-xs)]"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            📱 Phone
                        </button>
                        <button
                            type="button"
                            onClick={() => setMethod("email")}
                            className={`flex-1 rounded-[var(--radius-sm)] py-2 text-xs font-medium transition-base ${
                                method === "email"
                                    ? "bg-bg-white text-text-primary shadow-[var(--shadow-xs)]"
                                    : "text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            ✉️ Email
                        </button>
                    </div>
                </div>

                {/* Phone or Email input */}
                {method === "phone" ? (
                    <div>
                        <label
                            htmlFor="phone"
                            className="text-sm font-medium text-text-primary mb-1.5 block"
                        >
                            Phone number
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="flex h-[46px] items-center rounded-[var(--radius-md)] border border-border bg-bg-secondary px-3 text-sm text-text-secondary">
                                +91
                            </span>
                            <input
                                id="phone"
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="98765 43210"
                                maxLength={10}
                                className="flex-1 rounded-[var(--radius-md)] border border-border bg-bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-base focus:border-accent focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
                            />
                        </div>
                    </div>
                ) : (
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
                )}

                {/* Error */}
                {error && (
                    <div className="rounded-[var(--radius-md)] bg-error-light border border-error/20 px-4 py-3 text-sm text-error">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-[var(--radius-md)] bg-accent py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Sending OTP..." : "Continue →"}
                </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-text-secondary">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-accent hover:underline">
                    Log in
                </Link>
            </p>

            <p className="mt-4 text-center text-[11px] text-text-tertiary leading-relaxed">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-text-secondary">
                    Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-text-secondary">
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
    );
}
