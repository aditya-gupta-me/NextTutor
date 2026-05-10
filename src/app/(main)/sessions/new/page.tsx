"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InlineAlert from "@/components/ui/InlineAlert";
import { useToast } from "@/components/ui/ToastContext";

interface TutorInfo {
    id: string;
    slug: string;
    subjects: string[];
    fee_per_month: number | null;
    fee_per_session: number | null;
    qualification: string;
    bio: string;
    available_seats: number;
    user: { full_name: string; avatar_url: string | null };
}

export default function NewSessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tutorSlug = searchParams.get("tutor");
    const supabase = createClient();
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [tutor, setTutor] = useState<TutorInfo | null>(null);

    // Form state
    const [selectedSubject, setSelectedSubject] = useState("");
    const [sessionType, setSessionType] = useState<"recurring" | "one_time">("recurring");
    const [feeType, setFeeType] = useState<"monthly" | "per_session">("monthly");
    const [agreedFee, setAgreedFee] = useState("");
    const [sessionDate, setSessionDate] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!tutorSlug) {
            setError("No tutor selected. Please go back and choose a tutor.");
            setLoading(false);
            return;
        }
        loadTutor();
    }, [tutorSlug]);

    // Auto-fill fee when type changes
    useEffect(() => {
        if (!tutor) return;
        if (feeType === "monthly" && tutor.fee_per_month) {
            setAgreedFee(tutor.fee_per_month.toString());
        } else if (feeType === "per_session" && tutor.fee_per_session) {
            setAgreedFee(tutor.fee_per_session.toString());
        }
    }, [feeType, tutor]);

    const loadTutor = async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from("tutor_profiles")
                .select(`
                    id, slug, subjects, fee_per_month, fee_per_session,
                    qualification, bio, available_seats,
                    users:user_id(full_name, avatar_url)
                `)
                .eq("slug", tutorSlug)
                .maybeSingle();

            if (fetchError || !data) {
                setError("Tutor not found. They may have removed their profile.");
                return;
            }

            const userData = data.users as unknown as { full_name: string; avatar_url: string | null };
            setTutor({
                id: data.id,
                slug: data.slug,
                subjects: data.subjects || [],
                fee_per_month: data.fee_per_month,
                fee_per_session: data.fee_per_session,
                qualification: data.qualification,
                bio: data.bio,
                available_seats: data.available_seats,
                user: userData,
            });

            // Auto-select first subject
            if (data.subjects?.length) {
                setSelectedSubject(data.subjects[0]);
            }
            // Auto-fill fee
            if (data.fee_per_month) {
                setAgreedFee(data.fee_per_month.toString());
            }
        } catch {
            setError("Something went wrong loading the tutor.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (!selectedSubject) throw new Error("Please select a subject.");
            if (!agreedFee || parseInt(agreedFee) <= 0) throw new Error("Please enter a valid fee.");

            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Please log in to request a session.");

            // Get student profile
            const { data: studentProfile } = await supabase
                .from("student_profiles")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!studentProfile) {
                throw new Error("Please complete your student profile before requesting a session.");
            }

            const { error: insertError } = await supabase.from("sessions").insert({
                tutor_profile_id: tutor!.id,
                student_profile_id: studentProfile.id,
                type: sessionType,
                status: "requested",
                subject: selectedSubject,
                agreed_fee: parseInt(agreedFee),
                fee_type: feeType,
                session_date: sessionDate || null,
                message: message.trim(),
            });

            if (insertError) {
                console.error("Insert error:", insertError);
                throw new Error(`Failed to send request: ${insertError.message}`);
            }

            toast.success("Request sent! Your tutor will respond soon 🎉");
            router.push("/sessions");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="px-6 py-8 md:px-10 max-w-[640px]">
                <div className="h-8 w-48 skeleton mb-4" />
                <div className="h-4 w-64 skeleton mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-14 skeleton rounded-[var(--radius-md)]" />
                    ))}
                </div>
            </div>
        );
    }

    /* ─── Error (no tutor) ─── */
    if (!tutor) {
        return (
            <div className="px-6 py-8 md:px-10 max-w-[640px]">
                <InlineAlert variant="error" message={error || "Tutor not found"} />
                <button
                    onClick={() => router.push("/tutors")}
                    className="mt-6 rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover"
                >
                    ← Browse Tutors
                </button>
            </div>
        );
    }

    const initials = (tutor.user.full_name || "T")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const SUBJECT_COLORS = [
        { bg: "#EBF3FE", text: "#2F80ED", border: "#BDD7FB" },
        { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
        { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
        { bg: "#FAF5FF", text: "#9333EA", border: "#E9D5FF" },
        { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3" },
        { bg: "#ECFEFF", text: "#0891B2", border: "#A5F3FC" },
        { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
        { bg: "#F0F9FF", text: "#0284C7", border: "#BAE6FD" },
    ];

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[640px]">
            <form onSubmit={handleSubmit}>

                {/* ─── Header ─── */}
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-base mb-4 cursor-pointer"
                    >
                        <i className="bx bx-arrow-back" /> Go Back
                    </button>
                    <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                        📚 Let&apos;s Learn Together!
                    </h1>
                    <p className="mt-1.5 text-text-secondary">
                        Send a session request to get started with your tutor.
                    </p>
                </div>

                {/* ─── Tutor Card ─── */}
                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 mb-6 flex items-center gap-4">
                    <div
                        className="shrink-0 rounded-full p-[2px]"
                        style={{ background: "linear-gradient(135deg, #9B7FD4, #C3B1E1)" }}
                    >
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-white text-lg font-bold text-accent border-2 border-bg-white">
                            {tutor.user.avatar_url ? (
                                <img
                                    src={tutor.user.avatar_url}
                                    alt={tutor.user.full_name}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-text-primary truncate">
                            {tutor.user.full_name}
                        </h2>
                        <p className="text-xs text-text-secondary mt-0.5">
                            {tutor.qualification || "Tutor"} ·{" "}
                            {tutor.available_seats > 0 ? (
                                <span className="text-success font-medium">
                                    {tutor.available_seats} seat{tutor.available_seats !== 1 ? "s" : ""} open
                                </span>
                            ) : (
                                <span className="text-error font-medium">No seats available</span>
                            )}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        {tutor.fee_per_month && (
                            <p className="text-sm font-bold text-text-primary">₹{tutor.fee_per_month.toLocaleString()}<span className="text-xs text-text-tertiary font-normal">/mo</span></p>
                        )}
                        {tutor.fee_per_session && (
                            <p className="text-xs text-text-secondary">₹{tutor.fee_per_session.toLocaleString()}/session</p>
                        )}
                    </div>
                </div>

                {/* ─── Subject Selection ─── */}
                <Section icon="bx-book-open" title="What would you like to learn?">
                    <div className="flex flex-wrap gap-2">
                        {tutor.subjects.map((subject, i) => (
                            <button
                                key={subject}
                                type="button"
                                onClick={() => setSelectedSubject(subject)}
                                className="rounded-[var(--radius-full)] px-4 py-2 text-sm font-medium border transition-all cursor-pointer"
                                style={
                                    selectedSubject === subject
                                        ? {
                                            backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].text,
                                            color: "#fff",
                                            borderColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].text,
                                            boxShadow: `0 4px 12px ${SUBJECT_COLORS[i % SUBJECT_COLORS.length].text}33`,
                                        }
                                        : {
                                            backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].bg,
                                            color: SUBJECT_COLORS[i % SUBJECT_COLORS.length].text,
                                            borderColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].border,
                                        }
                                }
                            >
                                {selectedSubject === subject && <i className="bx bx-check mr-1" />}
                                {subject}
                            </button>
                        ))}
                    </div>
                    {!selectedSubject && (
                        <p className="text-xs text-text-tertiary mt-2 flex items-center gap-1">
                            <i className="bx bx-info-circle" /> Pick one subject to continue
                        </p>
                    )}
                </Section>

                {/* ─── Session Type ─── */}
                <Section icon="bx-calendar-event" title="How often?">
                    <div className="grid grid-cols-2 gap-3">
                        <TypeCard
                            icon="bx-finger-touch"
                            title="Regular Classes"
                            desc="Ongoing weekly sessions"
                            selected={sessionType === "recurring"}
                            onClick={() => setSessionType("recurring")}
                        />
                        <TypeCard
                            icon="bx-finger-touch"
                            title="One-Time Class"
                            desc="A single session"
                            selected={sessionType === "one_time"}
                            onClick={() => setSessionType("one_time")}
                        />
                    </div>
                </Section>

                {/* ─── Fee ─── */}
                <Section icon="bx-rupee" title="Fee Details">
                    <div className="space-y-4">
                        {/* Fee type toggle */}
                        <div className="flex rounded-[var(--radius-md)] border border-border bg-bg-secondary p-0.5">
                            <button
                                type="button"
                                onClick={() => setFeeType("monthly")}
                                className={`flex-1 rounded-[var(--radius-sm)] py-2.5 text-xs font-medium transition-base cursor-pointer ${feeType === "monthly"
                                    ? "bg-bg-white text-text-primary shadow-[var(--shadow-xs)]"
                                    : "text-text-secondary hover:text-text-primary"
                                    }`}
                            >
                                <i className="bx bx-calendar mr-1" /> Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setFeeType("per_session")}
                                className={`flex-1 rounded-[var(--radius-sm)] py-2.5 text-xs font-medium transition-base cursor-pointer ${feeType === "per_session"
                                    ? "bg-bg-white text-text-primary shadow-[var(--shadow-xs)]"
                                    : "text-text-secondary hover:text-text-primary"
                                    }`}
                            >
                                <i className="bx bx-time mr-1" /> Per Session
                            </button>
                        </div>

                        {/* Fee amount */}
                        <div>
                            <label className="text-sm font-medium text-text-primary mb-1.5 block">
                                Agreed Fee (₹)
                            </label>
                            <div className="relative">
                                <i className="bx bx-rupee absolute left-3 top-1/2 -translate-y-1/2 text-lg text-text-tertiary pointer-events-none" />
                                <input
                                    type="number"
                                    value={agreedFee}
                                    onChange={(e) => setAgreedFee(e.target.value)}
                                    placeholder="0"
                                    min={0}
                                    className="form-input !pl-10"
                                />
                            </div>
                            {tutor.fee_per_month && feeType === "monthly" && (
                                <p className="text-xs text-text-tertiary mt-1">
                                    Tutor&apos;s listed rate: ₹{tutor.fee_per_month.toLocaleString()}/month
                                </p>
                            )}
                            {tutor.fee_per_session && feeType === "per_session" && (
                                <p className="text-xs text-text-tertiary mt-1">
                                    Tutor&apos;s listed rate: ₹{tutor.fee_per_session.toLocaleString()}/session
                                </p>
                            )}
                        </div>
                    </div>
                </Section>

                {/* ─── Date ─── */}
                <Section icon="bx-calendar" title={sessionType === "one_time" ? "When?" : "Starting From"}>
                    <input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="form-input cursor-pointer"
                    />
                    <p className="text-xs text-text-tertiary mt-1.5">
                        {sessionType === "one_time"
                            ? "Pick a date for your session"
                            : "When would you like to start?"}
                    </p>
                </Section>

                {/* ─── Message ─── */}
                <Section icon="bx-note" title="Say hi to your tutor! (optional)">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="Hi! I'm in class 10 and need help preparing for my board exams..."
                        className="form-input resize-none"
                        maxLength={500}
                    />
                    <p className="text-xs text-text-tertiary mt-1.5 text-right">
                        {message.length}/500
                    </p>
                </Section>

                {/* ─── Error ─── */}
                {error && (
                    <div className="mb-6">
                        <InlineAlert variant="error" message={error} dismissible />
                    </div>
                )}

                {/* ─── Submit ─── */}
                <button
                    type="submit"
                    disabled={submitting || !selectedSubject || tutor.available_seats <= 0}
                    className="w-full rounded-[var(--radius-lg)] py-4 text-base font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    }}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <i className="bx bx-loader-alt animate-spin" /> Sending Request...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <i className="bx bx-send" /> Send Request to {tutor.user.full_name.split(" ")[0]}
                        </span>
                    )}
                </button>

                <p className="mt-4 text-center text-xs text-text-tertiary leading-relaxed">
                    Your tutor will review your request and respond soon.
                    <br />You can track the status in{" "}
                    <span className="font-medium text-accent">My Sessions</span>.
                </p>
            </form>
        </div>
    );
}

/* ─── Sub Components ─── */

function Section({
    icon,
    title,
    children,
}: {
    icon: string;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 mb-5 transition-base hover:shadow-[var(--shadow-sm)]">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4 pb-2.5 border-b border-border">
                <i className={`bx ${icon} text-lg text-accent`} />
                {title}
            </h3>
            {children}
        </div>
    );
}

function TypeCard({
    icon,
    title,
    desc,
    selected,
    onClick,
}: {
    icon: string;
    title: string;
    desc: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-[var(--radius-lg)] border-2 p-4 text-left transition-all cursor-pointer ${selected
                ? "border-accent bg-accent-light shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
                : "border-border bg-bg-white hover:border-border-hover hover:bg-bg-secondary"
                }`}
        >
            <i className={`bx ${icon} text-2xl ${selected ? "text-accent" : "text-text-tertiary"} mb-2 block`} />
            <p className={`text-sm font-semibold ${selected ? "text-accent" : "text-text-primary"}`}>
                {title}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
        </button>
    );
}
