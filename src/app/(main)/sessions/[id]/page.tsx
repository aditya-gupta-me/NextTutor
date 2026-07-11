"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
    acceptSession,
    declineSession,
    startSession,
    completeSession,
    cancelSession,
    submitReview,
} from "../actions";
import { useToast } from "@/components/ui/ToastContext";
import { BoxIcon } from "@/components/ui/BoxIcon";


interface SessionDetail {
    id: string;
    subject: string;
    type: string;
    status: string;
    agreed_fee: number;
    fee_type: string;
    message: string;
    session_date: string | null;
    created_at: string;
    other_name: string;
    other_avatar: string | null;
    other_role: "tutor" | "student";
    tutor_slug?: string;
    tutor_profile_id?: string;
}

interface ExistingReview {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    helpful_count: number;
}

const STATUS_CONFIG: Record<string, { gradient: string; icon: string; label: string; desc: string; emoji: string }> = {
    requested: { gradient: "from-amber-400 via-orange-400 to-amber-500", icon: "bx-hourglass", label: "Pending Review", desc: "Waiting for the tutor to respond", emoji: "⏳" },
    accepted: { gradient: "from-blue-400 via-indigo-400 to-blue-500", icon: "bx-check", label: "Accepted!", desc: "The tutor accepted — ready to begin", emoji: "🎉" },
    declined: { gradient: "from-rose-400 via-red-400 to-rose-500", icon: "bx-x", label: "Declined", desc: "The tutor declined this request", emoji: "😔" },
    active: { gradient: "from-emerald-400 via-teal-400 to-emerald-500", icon: "bx-play-circle", label: "In Progress", desc: "Tutoring sessions are underway!", emoji: "🚀" },
    completed: { gradient: "from-slate-400 via-gray-400 to-slate-500", icon: "bx-check-square", label: "Completed", desc: "This session has been completed", emoji: "🏁" },
    cancelled: { gradient: "from-gray-400 via-gray-500 to-gray-400", icon: "bx-block", label: "Cancelled", desc: "This session was cancelled", emoji: "🚫" },
};

const STAR_LABELS = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const supabase = createClient();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [role, setRole] = useState<"student" | "tutor">("student");
    const [isPending, startTransition] = useTransition();
    const [sessionId, setSessionId] = useState("");

    // Review state
    const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");

    useEffect(() => {
        params.then((p) => {
            setSessionId(p.id);
            loadSession(p.id);
        });
    }, [params]);

    const loadSession = useCallback(async (id: string) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();

            const userRole = (profile?.role || "student") as "tutor" | "student";
            setRole(userRole);

            const { data: s } = await supabase
                .from("sessions")
                .select("*")
                .eq("id", id)
                .single();

            if (!s) return;

            // Resolve other party
            let otherName = "User";
            let otherAvatar: string | null = null;
            let otherRole: "tutor" | "student" = "tutor";
            let tutorSlug: string | undefined;

            if (userRole === "tutor") {
                otherRole = "student";
                try {
                    const { data: sp } = await supabase
                        .from("student_profiles")
                        .select("user_id")
                        .eq("id", s.student_profile_id)
                        .single();
                    if (sp) {
                        const { data: u } = await supabase
                            .from("users")
                            .select("full_name, avatar_url")
                            .eq("id", sp.user_id)
                            .single();
                        if (u) { otherName = u.full_name || "Student"; otherAvatar = u.avatar_url; }
                    }
                } catch { /* fallback */ }
            } else {
                otherRole = "tutor";
                try {
                    const { data: tp } = await supabase
                        .from("tutor_profiles")
                        .select("slug, user_id")
                        .eq("id", s.tutor_profile_id)
                        .single();
                    if (tp) {
                        tutorSlug = tp.slug;
                        const { data: u } = await supabase
                            .from("users")
                            .select("full_name, avatar_url")
                            .eq("id", tp.user_id)
                            .single();
                        if (u) { otherName = u.full_name || "Tutor"; otherAvatar = u.avatar_url; }
                    }
                } catch { /* fallback */ }
            }

            setSession({
                id: s.id, subject: s.subject, type: s.type, status: s.status,
                agreed_fee: s.agreed_fee, fee_type: s.fee_type, message: s.message || "",
                session_date: s.session_date, created_at: s.created_at,
                other_name: otherName, other_avatar: otherAvatar, other_role: otherRole,
                tutor_slug: tutorSlug, tutor_profile_id: s.tutor_profile_id,
            });

            // Load existing review for this session
            if (s.status === "completed") {
                const { data: review } = await supabase
                    .from("reviews")
                    .select("id, rating, comment, created_at, helpful_count")
                    .eq("session_id", id)
                    .maybeSingle();
                if (review) setExistingReview(review);
            }
        } catch (err) {
            console.error("loadSession error:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const handleAction = (action: (id: string) => Promise<{ success: boolean }>, label: string) => {
        startTransition(async () => {
            try {
                await action(sessionId);
                toast.success(`Session ${label} successfully!`);
                await loadSession(sessionId);
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Action failed");
            }
        });
    };

    const handleReviewSubmit = async () => {
        if (reviewRating === 0) { setReviewError("Please select a rating."); return; }



        setReviewError("");
        setReviewSubmitting(true);
        try {
            await submitReview(sessionId, reviewRating, reviewComment);
            toast.success("Review submitted! Thank you for your feedback 🌟");
            await loadSession(sessionId);
        } catch (err: unknown) {
            setReviewError(err instanceof Error ? err.message : "Failed to submit review.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="px-6 py-8 md:px-10 max-w-[640px] mx-auto">
                <div className="h-5 w-32 skeleton mb-6" />
                <div className="h-40 skeleton rounded-2xl mb-4" />
                <div className="h-20 skeleton rounded-2xl mb-4" />
                <div className="h-32 skeleton rounded-2xl" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="px-6 py-16 md:px-10 max-w-[640px] mx-auto text-center">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-xl font-semibold text-text-primary mb-2">Session not found</p>
                <p className="text-sm text-text-secondary mb-6">This session may have been removed or you don&apos;t have access.</p>
                <Link href="/sessions" className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover transition-base">
                    <BoxIcon className="bx bx-arrow-back" /> Back to Sessions
                </Link>
            </div>
        );
    }

    const config = STATUS_CONFIG[session.status];
    const initials = (session.other_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const dateLabel = session.session_date
        ? new Date(session.session_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "Not specified";

    const createdLabel = new Date(session.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const activeRating = reviewHover || reviewRating;

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[640px] mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-tertiary mb-6">
                <Link href="/sessions" className="hover:text-text-secondary transition-base">Sessions</Link>
                <span>/</span>
                <span className="text-text-secondary truncate">{session.subject}</span>
            </div>

            {/* Status Hero */}
            <div className={`rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-br ${config.gradient} text-white shadow-lg relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
                <div className="relative flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-2xl">{config.emoji}</div>
                    <div className="flex-1">
                        <h1 className="text-xl md:text-2xl font-bold mb-1">{config.label}</h1>
                        <p className="text-sm text-white/80 leading-relaxed">{config.desc}</p>
                    </div>
                </div>
            </div>

            {/* Person Card */}
            <div className="rounded-2xl border border-border bg-bg-white p-5 mb-4">
                <div className="flex items-center gap-4">
                    {session.other_avatar ? (
                        <Image src={session.other_avatar} alt={session.other_name} width={56} height={56} className="h-14 w-14 rounded-full object-cover border-2 border-border" />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light text-lg font-bold text-accent border-2 border-accent/10">{initials}</div>
                    )}
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-text-primary">{session.other_name}</h3>
                        <p className="text-xs text-text-secondary capitalize">Your {session.other_role}</p>
                    </div>
                    {session.tutor_slug && (
                        <Link href={`/tutors/${session.tutor_slug}`} className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-secondary transition-base">
                            View Profile <BoxIcon className="bx bx-link-external" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            <div className="rounded-2xl border border-border bg-bg-white p-5 mb-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4 pb-3 border-b border-border">
                    <BoxIcon className="bx bx-info-circle text-lg text-accent" /> Session Details
                </h3>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                    <DetailItem icon="bx-book-open" label="Subject" value={session.subject} />
                    <DetailItem icon="bx-finger-touch" label="Type" value={session.type === "recurring" ? "Regular Classes" : "One-Time Class"} />
                    <DetailItem icon="bx-rupee" label="Fee" value={`₹${session.agreed_fee.toLocaleString()} / ${session.fee_type === "monthly" ? "month" : "session"}`} />
                    <DetailItem icon="bx-calendar" label="Start Date" value={dateLabel} />
                    <DetailItem icon="bx-calendar-plus" label="Requested On" value={createdLabel} />
                </div>
            </div>

            {/* Message */}
            {session.message && (
                <div className="rounded-2xl border border-border bg-bg-white p-5 mb-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                        <BoxIcon className="bx bx-note text-lg text-accent" /> Student&apos;s Note
                    </h3>
                    <div className="bg-bg-secondary rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{session.message}&rdquo;</p>
                    </div>
                </div>
            )}

            {/* ─── Review Section (completed sessions only) ─── */}
            {session.status === "completed" && (
                existingReview ? (
                    /* Read-only review display */
                    <div className="rounded-2xl border border-border bg-bg-white p-5 mb-4 relative overflow-hidden">
                        {/* Decorative ribbon */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                <BoxIcon className="bx bx-star text-lg text-amber-500" />
                                {role === "student" ? "Your Review" : "Student\'s Review"}
                            </h3>
                            <span className="text-xs text-text-tertiary">
                                {new Date(existingReview.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <BoxIcon key={star} className={`bx bx-star text-xl ${star <= existingReview.rating ? "text-amber-400" : "text-gray-200"}`} />
                            ))}
                            <span className="ml-2 text-sm font-medium text-text-primary">{STAR_LABELS[existingReview.rating]}</span>
                        </div>

                        {/* Comment */}
                        {existingReview.comment && (
                            <div className="bg-bg-secondary rounded-xl p-4 border border-border/50">
                                <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{existingReview.comment}&rdquo;</p>
                            </div>
                        )}

                        {/* Helpful count */}
                        {existingReview.helpful_count > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-text-tertiary">
                                <BoxIcon className="bx bx-like text-sm" />
                                {existingReview.helpful_count} {existingReview.helpful_count === 1 ? "person" : "people"} found this helpful
                            </div>
                        )}
                    </div>
                ) : role === "student" ? (
                    /* Review form for students */
                    <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-gradient-to-br from-accent/[0.03] to-transparent p-6 mb-4">
                        <div className="text-center mb-5">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-2xl mb-3">⭐</div>
                            <h3 className="text-base font-semibold text-text-primary">How was your experience?</h3>
                            <p className="text-xs text-text-secondary mt-1">Your feedback helps other students find great tutors</p>
                        </div>

                        {/* Star picker */}
                        <div className="flex flex-col items-center gap-2 mb-5">
                            <div className="flex items-center gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onMouseEnter={() => setReviewHover(star)}
                                        onMouseLeave={() => setReviewHover(0)}
                                        onClick={() => setReviewRating(star)}
                                        className="p-0.5 transition-transform hover:scale-125 cursor-pointer"
                                    >
                                        <BoxIcon className={`bx bx-star text-3xl transition-colors ${star <= activeRating ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]" : "text-gray-200"}`} />
                                    </button>
                                ))}
                            </div>
                            <span className={`text-sm font-medium text-accent h-5 transition-opacity duration-200 ${activeRating > 0 ? "opacity-100" : "opacity-0"}`}>
                                {activeRating > 0 ? STAR_LABELS[activeRating] : "\u00A0"}
                            </span>
                        </div>

                        {/* Comment textarea */}
                        <div className="mb-4">
                            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                                Share your thoughts (optional)
                            </label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => { setReviewComment(e.target.value); setReviewError(""); }}
                                rows={3}
                                placeholder="What did you like? Any suggestions for improvement?"
                                className="form-input resize-none"
                                maxLength={1000}
                            />
                            <div className="flex items-center justify-between mt-1.5">
                                <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                                    <BoxIcon className="bx bx-shield-quarter" /> Reviews are checked for respectful language
                                </p>
                                <span className="text-[10px] text-text-tertiary">{reviewComment.length}/1000</span>
                            </div>
                        </div>

                        {/* Error */}
                        {reviewError && (
                            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 mb-4">
                                <BoxIcon className="bx bx-error-circle text-red-500 text-lg mt-0.5" />
                                <p className="text-xs text-red-600 leading-relaxed">{reviewError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleReviewSubmit}
                            disabled={reviewSubmitting || reviewRating === 0}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] hover:shadow-lg"
                            style={{ background: reviewRating > 0 ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#d1d5db" }}
                        >
                            {reviewSubmitting ? (
                                <><BoxIcon className="bx bx-loader-alt animate-spin" /> Submitting...</>
                            ) : (
                                <><BoxIcon className="bx bx-send" /> Submit Review</>
                            )}
                        </button>
                    </div>
                ) : null
            )}

            {/* ─── Action Buttons ─── */}
            {role === "tutor" && session.status === "requested" && (
                <div className="rounded-2xl border border-border bg-bg-white p-5 mt-2">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Respond to this request</h3>
                    <div className="flex gap-3">
                        <button onClick={() => handleAction(acceptSession, "accepted")} disabled={isPending}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                            <BoxIcon className="bx bx-check text-lg" /> Accept
                        </button>
                        <button onClick={() => handleAction(declineSession, "declined")} disabled={isPending}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                            <BoxIcon className="bx bx-x text-lg" /> Decline
                        </button>
                    </div>
                </div>
            )}

            {role === "tutor" && session.status === "accepted" && (
                <div className="rounded-2xl border border-border bg-bg-white p-5 mt-2">
                    <h3 className="text-sm font-semibold text-text-primary mb-3">Ready to begin?</h3>
                    <div className="flex gap-3">
                        <button onClick={() => handleAction(startSession, "started")} disabled={isPending}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:shadow-lg disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                            <BoxIcon className="bx bx-play text-lg" /> Start Session
                        </button>
                        <button onClick={() => handleAction(cancelSession, "cancelled")} disabled={isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3.5 text-sm font-medium text-text-secondary transition-base hover:bg-bg-secondary disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {role === "tutor" && session.status === "active" && (
                <div className="rounded-2xl border border-border bg-bg-white p-5 mt-2">
                    <button onClick={() => handleAction(completeSession, "completed")} disabled={isPending}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                        <BoxIcon className="bx bx-check-square text-lg" /> Mark as Complete
                    </button>
                </div>
            )}

            {role === "student" && ["requested", "accepted"].includes(session.status) && (
                <div className="rounded-2xl border border-border bg-bg-white p-5 mt-2">
                    <button onClick={() => handleAction(cancelSession, "cancelled")} disabled={isPending}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 cursor-pointer active:scale-[0.98]">
                        <BoxIcon className="bx bx-x text-lg" /> Cancel Request
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Detail Item ─── */
function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary mt-0.5">
                <BoxIcon className={`bx ${icon} text-base text-accent`} />
            </div>
            <div>
                <p className="text-[11px] text-text-tertiary uppercase tracking-wider font-medium">{label}</p>
                <p className="text-sm font-medium text-text-primary mt-0.5">{value}</p>
            </div>
        </div>
    );
}
