"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMethod = "phone" | "email";

export default function LoginPage() {
    const router = useRouter();
    const [method, setMethod] = useState<AuthMethod>("phone");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailSent, setEmailSent] = useState(false);

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

                sessionStorage.setItem(
                    "tsearch_login",
                    JSON.stringify({ method: "phone", phone: formattedPhone }),
                );
                router.push("/verify-otp");
            } else {
                const { error: authError } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (authError) throw authError;
                setEmailSent(true);
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
                    Click the link in the email to log in. <br />
                    If you don&apos;t see it, check your spam folder.
                </p>
                <button
                    onClick={() => setEmailSent(false)}
                    className="mt-6 text-sm text-accent font-medium hover:underline"
                >
                    ← Use a different email
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-bold text-text-primary">Welcome back</h1>
                <p className="mt-2 text-text-secondary">Log in to your NextTutor account.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auth method toggle */}
                <div>
                    <label className="text-sm font-medium text-text-primary mb-1.5 block">
                        Log in with
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
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-medium text-accent hover:underline">
                    Sign up
                </Link>
            </p>
        </div>
    );
}
