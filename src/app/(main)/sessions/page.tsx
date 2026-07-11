"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
    acceptSession,
    declineSession,
    startSession,
    completeSession,
    cancelSession,
} from "./actions";
import { useToast } from "@/components/ui/ToastContext";
import { BoxIcon } from "@/components/ui/BoxIcon";
import Image from "next/image";

type SessionStatus = "requested" | "accepted" | "declined" | "active" | "completed" | "cancelled";

interface SessionRow {
    id: string;
    subject: string;
    type: string;
    status: SessionStatus;
    agreed_fee: number;
    fee_type: string;
    message: string;
    session_date: string | null;
    created_at: string;
    other_name: string;
    other_avatar: string | null;
    tutor_slug?: string;
}

const TABS: { label: string; value: string; icon: string }[] = [
    { label: "All", value: "all", icon: "bx-grid-alt" },
    { label: "Pending", value: "requested", icon: "bx-hourglass" },
    { label: "Active", value: "active", icon: "bx-play-circle" },
    { label: "Completed", value: "completed", icon: "bx-check-circle" },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    requested: { bg: "bg-amber-50", text: "text-amber-600", icon: "bx-hourglass", label: "Pending" },
    accepted: { bg: "bg-blue-50", text: "text-blue-600", icon: "bx-check", label: "Accepted" },
    declined: { bg: "bg-red-50", text: "text-red-500", icon: "bx-x", label: "Declined" },
    active: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "bx-play-circle", label: "Active" },
    completed: { bg: "bg-slate-100", text: "text-slate-500", icon: "bx-check-square", label: "Done" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-400", icon: "bx-block", label: "Cancelled" },
};

export default function SessionsPage() {
    const supabase = createClient();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<"student" | "tutor">("student");
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [activeTab, setActiveTab] = useState("all");
    const [isPending, startTransition] = useTransition();

    const loadSessions = useCallback(async () => {
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

            let rawSessions: SessionRow[] = [];

            if (userRole === "tutor") {
                const { data: tutorProfile } = await supabase
                    .from("tutor_profiles")
                    .select("id")
                    .eq("user_id", user.id)
                    .single();

                if (tutorProfile) {
                    // Fetch sessions without !inner to avoid RLS filtering
                    const { data, error } = await supabase
                        .from("sessions")
                        .select("*")
                        .eq("tutor_profile_id", tutorProfile.id)
                        .order("created_at", { ascending: false });

                    if (error) console.error("Sessions fetch error:", error);

                    // Resolve student names for each session
                    rawSessions = await Promise.all(
                        (data || []).map(async (s: Record<string, unknown>) => {
                            let otherName = "Student";
                            let otherAvatar: string | null = null;

                            try {
                                const { data: sp } = await supabase
                                    .from("student_profiles")
                                    .select("user_id")
                                    .eq("id", s.student_profile_id as string)
                                    .single();

                                if (sp) {
                                    const { data: u } = await supabase
                                        .from("users")
                                        .select("full_name, avatar_url")
                                        .eq("id", sp.user_id)
                                        .single();
                                    if (u) {
                                        otherName = u.full_name || "Student";
                                        otherAvatar = u.avatar_url;
                                    }
                                }
                            } catch { /* fallback to defaults */ }

                            return {
                                id: s.id as string,
                                subject: s.subject as string,
                                type: s.type as string,
                                status: s.status as SessionStatus,
                                agreed_fee: s.agreed_fee as number,
                                fee_type: s.fee_type as string,
                                message: (s.message as string) || "",
                                session_date: s.session_date as string | null,
                                created_at: s.created_at as string,
                                other_name: otherName,
                                other_avatar: otherAvatar,
                            };
                        })
                    );
                }
            } else {
                const { data: studentProfile } = await supabase
                    .from("student_profiles")
                    .select("id")
                    .eq("user_id", user.id)
                    .single();

                if (studentProfile) {
                    // Fetch sessions without !inner to avoid RLS filtering
                    const { data, error } = await supabase
                        .from("sessions")
                        .select("*")
                        .eq("student_profile_id", studentProfile.id)
                        .order("created_at", { ascending: false });

                    if (error) console.error("Sessions fetch error:", error);

                    // Resolve tutor names for each session
                    rawSessions = await Promise.all(
                        (data || []).map(async (s: Record<string, unknown>) => {
                            let otherName = "Tutor";
                            let otherAvatar: string | null = null;
                            let tutorSlug: string | undefined;

                            try {
                                const { data: tp } = await supabase
                                    .from("tutor_profiles")
                                    .select("slug, user_id")
                                    .eq("id", s.tutor_profile_id as string)
                                    .single();

                                if (tp) {
                                    tutorSlug = tp.slug;
                                    const { data: u } = await supabase
                                        .from("users")
                                        .select("full_name, avatar_url")
                                        .eq("id", tp.user_id)
                                        .single();
                                    if (u) {
                                        otherName = u.full_name || "Tutor";
                                        otherAvatar = u.avatar_url;
                                    }
                                }
                            } catch { /* fallback to defaults */ }

                            return {
                                id: s.id as string,
                                subject: s.subject as string,
                                type: s.type as string,
                                status: s.status as SessionStatus,
                                agreed_fee: s.agreed_fee as number,
                                fee_type: s.fee_type as string,
                                message: (s.message as string) || "",
                                session_date: s.session_date as string | null,
                                created_at: s.created_at as string,
                                other_name: otherName,
                                other_avatar: otherAvatar,
                                tutor_slug: tutorSlug,
                            };
                        })
                    );
                }
            }

            setSessions(rawSessions);
        } catch (err) {
            console.error("loadSessions error:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleAction = (action: (id: string) => Promise<{ success: boolean }>, id: string, label: string) => {
        startTransition(async () => {
            try {
                await action(id);
                toast.success(`Session ${label} successfully!`);
                await loadSessions();
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : "Action failed");
            }
        });
    };

    const filtered = activeTab === "all"
        ? sessions
        : activeTab === "active"
            ? sessions.filter((s) => ["accepted", "active"].includes(s.status))
            : sessions.filter((s) => s.status === activeTab);

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="px-6 py-8 md:px-10 max-w-[960px]">
                <div className="h-8 w-48 skeleton mb-4" />
                <div className="h-4 w-64 skeleton mb-8" />
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 skeleton rounded-[var(--radius-lg)]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                        {role === "tutor" ? "📋 Session Requests" : "📚 My Sessions"}
                    </h1>
                    <p className="mt-1 text-text-secondary">
                        {role === "tutor"
                            ? "Review and manage student session requests."
                            : "Track your learning sessions."}
                    </p>
                </div>
                {role === "student" && (
                    <Link
                        href="/tutors"
                        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-white transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-sm)] cursor-pointer shrink-0"
                    >
                        <BoxIcon className="bx bx-search" /> Find Tutors
                    </Link>
                )}
            </div>

            {/* ─── Status Tabs ─── */}
            <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
                {TABS.map((tab) => {
                    const count = tab.value === "all"
                        ? sessions.length
                        : tab.value === "active"
                            ? sessions.filter((s) => ["accepted", "active"].includes(s.status)).length
                            : sessions.filter((s) => s.status === tab.value).length;

                    return (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-4 py-2 text-xs font-medium transition-base cursor-pointer whitespace-nowrap ${activeTab === tab.value
                                ? "bg-accent text-white shadow-md shadow-accent/20"
                                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
                                }`}
                        >
                            <BoxIcon className={`bx ${tab.icon}`} />
                            {tab.label}
                            {count > 0 && (
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.value
                                    ? "bg-white/20 text-white"
                                    : "bg-bg-tertiary text-text-tertiary"
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ─── Sessions List ─── */}
            {filtered.length === 0 ? (
                <EmptyState role={role} activeTab={activeTab} />
            ) : (
                <div className="space-y-3">
                    {filtered.map((session) => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            role={role}
                            isPending={isPending}
                            onAction={handleAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Session Card ─── */
function SessionCard({
    session,
    role,
    isPending,
    onAction,
}: {
    session: SessionRow;
    role: "student" | "tutor";
    isPending: boolean;
    onAction: (action: (id: string) => Promise<{ success: boolean }>, id: string, label: string) => void;
}) {
    const config = STATUS_CONFIG[session.status];
    const initials = (session.other_name || "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const dateLabel = session.session_date
        ? new Date(session.session_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : null;

    return (
        <Link
            href={`/sessions/${session.id}`}
            className="block rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 transition-all hover:shadow-[var(--shadow-sm)] hover:border-border-hover"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="shrink-0">
                    {session.other_avatar ? (
                        <Image src={session.other_avatar}
                            alt={session.other_name}
                            className="h-11 w-11 rounded-full object-cover border-2 border-border"
                         width={44} height={44} />
                    ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent border-2 border-accent/10">
                            {initials}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                            {session.other_name}
                        </h3>
                        <span className={`inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-1 text-[11px] font-medium ${config.bg} ${config.text}`}>
                            <BoxIcon className={`bx ${config.icon} text-xs`} />
                            {config.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                        <span className="inline-flex items-center gap-1">
                            <BoxIcon className="bx bx-book-open text-sm" /> {session.subject}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <BoxIcon className="bx bx-rupee text-sm" /> ₹{session.agreed_fee.toLocaleString()}
                            <span className="text-text-tertiary">/{session.fee_type === "monthly" ? "mo" : "session"}</span>
                        </span>
                        {dateLabel && (
                            <span className="inline-flex items-center gap-1">
                                <BoxIcon className="bx bx-calendar text-sm" /> {dateLabel}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 capitalize">
                            <BoxIcon className="bx bx-finger-touch text-sm" />
                            {session.type === "recurring" ? "Regular" : "One-time"}
                        </span>
                    </div>

                    {/* Message preview */}
                    {session.message && (
                        <p className="text-xs text-text-tertiary mt-2 truncate italic">
                            &ldquo;{session.message}&rdquo;
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {(role === "tutor" && session.status === "requested") && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
                    <button
                        onClick={() => onAction(acceptSession, session.id, "accepted")}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-emerald-500 px-4 py-2.5 text-xs font-medium text-white transition-base hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
                    >
                        <BoxIcon className="bx bx-check text-base" /> Accept
                    </button>
                    <button
                        onClick={() => onAction(declineSession, session.id, "declined")}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 transition-base hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                    >
                        <BoxIcon className="bx bx-x text-base" /> Decline
                    </button>
                </div>
            )}

            {(role === "tutor" && session.status === "accepted") && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
                    <button
                        onClick={() => onAction(startSession, session.id, "started")}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 py-2.5 text-xs font-medium text-white transition-base hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                    >
                        <BoxIcon className="bx bx-play text-base" /> Start Session
                    </button>
                    <button
                        onClick={() => onAction(cancelSession, session.id, "cancelled")}
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border px-4 py-2.5 text-xs font-medium text-text-secondary transition-base hover:bg-bg-secondary disabled:opacity-50 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {(role === "tutor" && session.status === "active") && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
                    <button
                        onClick={() => onAction(completeSession, session.id, "completed")}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-emerald-500 px-4 py-2.5 text-xs font-medium text-white transition-base hover:bg-emerald-600 disabled:opacity-50 cursor-pointer"
                    >
                        <BoxIcon className="bx bx-check-square text-base" /> Mark Complete
                    </button>
                </div>
            )}

            {(role === "student" && ["requested", "accepted"].includes(session.status)) && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-border" onClick={(e) => e.preventDefault()}>
                    <button
                        onClick={() => onAction(cancelSession, session.id, "cancelled")}
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600 transition-base hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                    >
                        <BoxIcon className="bx bx-x text-base" /> Cancel Request
                    </button>
                </div>
            )}
        </Link>
    );
}

/* ─── Empty State ─── */
function EmptyState({ role, activeTab }: { role: string; activeTab: string }) {
    const messages: Record<string, { title: string; desc: string }> = {
        all: role === "student"
            ? { title: "No sessions yet", desc: "Find a tutor and request your first session to get started!" }
            : { title: "No session requests yet", desc: "Requests from students will appear here." },
        requested: role === "student"
            ? { title: "No pending requests", desc: "All your requests have been responded to!" }
            : { title: "No new requests", desc: "You're all caught up! 🎉" },
        active: { title: "No active sessions", desc: "Sessions in progress will show up here." },
        completed: { title: "No completed sessions yet", desc: "Completed sessions will appear here after tutoring wraps up." },
    };

    const msg = messages[activeTab] || messages.all;

    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-16 text-center">
            <BoxIcon className="bx bx-calendar-event text-4xl text-text-tertiary mb-3" />
            <p className="text-lg font-medium text-text-primary">{msg.title}</p>
            <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto">{msg.desc}</p>
            {role === "student" && activeTab === "all" && (
                <Link
                    href="/tutors"
                    className="inline-flex items-center gap-2 mt-6 rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover cursor-pointer"
                >
                    <BoxIcon className="bx bx-search" /> Find a Tutor
                </Link>
            )}
        </div>
    );
}
