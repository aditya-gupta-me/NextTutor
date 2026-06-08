import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    PencilSparkles,
    CalendarEvent,
    Hourglass,
    CheckSquare,
    Group,
    Star,
    Search,
    User,
    ChevronRight,
    Rocket,
    ChartSpline,
} from "@boxicons/react";
import type { ReactNode } from "react";

export default async function DashboardPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user!.id)
        .single();

    const name = profile?.full_name || "there";
    const role = profile?.role || "student";

    // ─── Tutor profile gate (server-side backup) ───
    // Auth callback handles this on login, but this catches direct navigation
    if (role === "tutor") {
        const { data: tp } = await supabase
            .from("tutor_profiles")
            .select("subjects, city, location, fee_per_month, fee_per_session")
            .eq("user_id", user!.id)
            .maybeSingle();

        const isComplete = tp
            && tp.subjects?.length > 0
            && !!tp.city
            && !!tp.location
            && !!(tp.fee_per_month || tp.fee_per_session);

        if (!isComplete) redirect("/profile/edit?onboarding=true");
    }

    // ─── Student profile nudge ───
    let showStudentNudge = false;
    if (role === "student") {
        const { data: sp } = await supabase
            .from("student_profiles")
            .select("city")
            .eq("user_id", user!.id)
            .maybeSingle();
        showStudentNudge = !sp || !sp.city;
    }

    // ─── Fetch live session stats ───
    let activePeople = 0;
    let upcomingSessions = 0;
    let pendingCount = 0;
    let completedSessions = 0;
    let avgRating = 0;
    let reviewCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recentSessions: any[] = [];

    try {
        if (role === "tutor") {
            const { data: tutorProfile } = await supabase
                .from("tutor_profiles")
                .select("id, avg_rating, review_count, slug")
                .eq("user_id", user!.id)
                .single();

            if (tutorProfile) {
                avgRating = tutorProfile.avg_rating || 0;
                reviewCount = tutorProfile.review_count || 0;
                // Active students (sessions with status = 'active')
                const { count: activeCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("tutor_profile_id", tutorProfile.id)
                    .eq("status", "active");
                activePeople = activeCount || 0;

                // Completed
                const { count: cCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("tutor_profile_id", tutorProfile.id)
                    .eq("status", "completed");
                completedSessions = cCount || 0;

                // Upcoming = accepted + active
                const { count: ucCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("tutor_profile_id", tutorProfile.id)
                    .in("status", ["accepted", "active"]);
                upcomingSessions = ucCount || 0;

                // Pending requests
                const { count: pCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("tutor_profile_id", tutorProfile.id)
                    .eq("status", "requested");
                pendingCount = pCount || 0;

                // Recent sessions for activity feed
                const { data: recent } = await supabase
                    .from("sessions")
                    .select("id, subject, status, created_at")
                    .eq("tutor_profile_id", tutorProfile.id)
                    .order("created_at", { ascending: false })
                    .limit(5);
                recentSessions = recent || [];
            }
        } else {
            const { data: studentProfile } = await supabase
                .from("student_profiles")
                .select("id")
                .eq("user_id", user!.id)
                .single();

            if (studentProfile) {
                // Active tutors
                const { count: activeCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("student_profile_id", studentProfile.id)
                    .eq("status", "active");
                activePeople = activeCount || 0;

                // Upcoming = accepted + active
                const { count: ucCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("student_profile_id", studentProfile.id)
                    .in("status", ["accepted", "active"]);
                upcomingSessions = ucCount || 0;

                // Pending
                const { count: pCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("student_profile_id", studentProfile.id)
                    .eq("status", "requested");
                pendingCount = pCount || 0;

                // Completed
                const { count: cCount } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("student_profile_id", studentProfile.id)
                    .eq("status", "completed");
                completedSessions = cCount || 0;

                // Recent
                const { data: recent } = await supabase
                    .from("sessions")
                    .select("id, subject, status, created_at")
                    .eq("student_profile_id", studentProfile.id)
                    .order("created_at", { ascending: false })
                    .limit(5);
                recentSessions = recent || [];
            }
        }
    } catch {
        // fallback to zeros
    }

    const statusEmoji: Record<string, string> = {
        requested: "⏳", accepted: "✅", active: "🟢", completed: "🏁", declined: "❌", cancelled: "🚫",
    };
    const statusLabel: Record<string, string> = {
        requested: "New request", accepted: "Accepted", active: "Active", completed: "Completed", declined: "Declined", cancelled: "Cancelled",
    };

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
            {/* Greeting */}
            <div className="mb-8">
                <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                    Welcome back, {name.split(" ")[0]}{" "}
                    <span className="inline-block origin-[70%_70%] hover:animate-[wave_0.5s_ease-in-out_2] cursor-default">👋</span>
                </h1>
                <p className="mt-1 text-text-secondary">
                    Here&apos;s what&apos;s happening with your{" "}
                    {role === "tutor" ? "tutoring" : "learning"}.
                </p>
            </div>

            {/* Student profile nudge */}
            {showStudentNudge && (
                <Link
                    href="/profile/edit"
                    className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 mb-8 transition-all hover:shadow-md hover:border-amber-300 group"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">📍</span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">Complete your profile</p>
                        <p className="text-xs text-text-secondary">Add your location to find tutors near you</p>
                    </div>
                    <ChevronRight className="text-text-tertiary group-hover:text-accent transition-colors" size="md" />
                </Link>
            )}

            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
                {role === "student" ? (
                    <>
                        <StatCard
                            label="Active Tutors"
                            value={String(activePeople)}
                            icon={<PencilSparkles size="md" />}
                            highlight={activePeople > 0}
                            href="/sessions"
                        />
                        <StatCard
                            label="Upcoming Sessions"
                            value={String(upcomingSessions)}
                            icon={<CalendarEvent size="md" />}
                            highlight={upcomingSessions > 0}
                            href="/sessions"
                        />
                        <StatCard
                            label="Pending Requests"
                            value={String(pendingCount)}
                            icon={<Hourglass size="md" />}
                            highlight={pendingCount > 0}
                            accentColor="amber"
                            href="/sessions"
                        />
                        <StatCard
                            label="Completed"
                            value={String(completedSessions)}
                            icon={<CheckSquare size="md" />}
                            href="/sessions"
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Active Students"
                            value={String(activePeople)}
                            icon={<Group size="md" />}
                            highlight={activePeople > 0}
                            href="/sessions"
                        />
                        <StatCard
                            label="Sessions"
                            value={`${upcomingSessions + completedSessions}`}
                            icon={<CalendarEvent size="md" />}
                            highlight={upcomingSessions > 0}
                            subtitle={upcomingSessions > 0 ? `${upcomingSessions} upcoming` : undefined}
                            href="/sessions"
                        />
                        <StatCard
                            label="Pending Requests"
                            value={String(pendingCount)}
                            icon={<Hourglass size="md" />}
                            highlight={pendingCount > 0}
                            accentColor="amber"
                            href="/sessions"
                        />
                        <StatCard
                            label="Avg. Rating"
                            value={avgRating > 0 ? avgRating.toFixed(1) : "—"}
                            icon={<Star size="md" />}
                            highlight={avgRating > 0}
                            subtitle={reviewCount > 0 ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : undefined}
                            href="/reviews"
                        />
                    </>
                )}
            </div>

            {/* Profile Analytics Summary — tutor only */}
            {role === "tutor" && (
                <Link
                    href="/analytics"
                    className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 mb-8 transition-all hover:shadow-md hover:border-accent/30 group"
                >
                    <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
                    >
                        <ChartSpline size="md" />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">Profile Analytics</p>
                        <p className="text-xs text-text-secondary">
                            See how students discover and engage with your profile
                        </p>
                    </div>
                    <ChevronRight className="text-xl text-text-tertiary group-hover:text-accent transition-colors" size="md" />
                </Link>
            )}

            {/* Quick actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                    Quick Actions
                </h2>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {role === "student" ? (
                        <>
                            <QuickAction
                                href="/tutors"
                                icon={<Search size="sm" />}
                                title="Find a Tutor"
                                desc="Search for tutors near you"
                            />
                            <QuickAction
                                href="/sessions"
                                icon={<CalendarEvent size="sm" />}
                                title="My Sessions"
                                desc="View your session schedule"
                            />
                            <QuickAction
                                href="/profile/edit"
                                icon={<User size="sm" />}
                                title="Edit Profile"
                                desc="Update your details"
                            />
                        </>
                    ) : (
                        <>
                            <QuickAction
                                href="/profile/edit"
                                icon={<User size="sm" />}
                                title="Edit Profile"
                                desc="Update your tutor profile"
                            />
                            <QuickAction
                                href="/sessions"
                                icon={<CalendarEvent size="sm" />}
                                title="Session Requests"
                                desc={pendingCount > 0 ? `${pendingCount} new pending` : "View pending requests"}
                                badge={pendingCount > 0 ? pendingCount : undefined}
                            />
                            <QuickAction
                                href="/analytics"
                                icon={<ChartSpline size="sm" />}
                                title="Profile Analytics"
                                desc="View your profile performance"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Recent activity */}
            <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                    Recent Activity
                </h2>
                {recentSessions.length === 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-white p-10 text-center flex flex-col items-center justify-center">
                        <Rocket className="text-text-tertiary mb-3" size="lg" />
                        <p className="text-sm font-medium text-text-primary">
                            No activity yet
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                            {role === "student"
                                ? "Start by finding a tutor near you!"
                                : "Complete your profile to start receiving students."}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-white divide-y divide-border">
                        {recentSessions.map((s) => (
                            <Link
                                key={s.id}
                                href={`/sessions/${s.id}`}
                                className="flex items-center gap-3 px-5 py-4 hover:bg-bg-secondary transition-base"
                            >
                                <span className="text-lg">{statusEmoji[s.status] || "📋"}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-text-primary">{s.subject}</span>
                                    <span className="text-xs text-text-tertiary ml-2">{statusLabel[s.status] || s.status}</span>
                                </div>
                                <span className="text-xs text-text-tertiary shrink-0">
                                    {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    highlight,
    accentColor,
    subtitle,
    href,
}: {
    label: string;
    value: string;
    icon: ReactNode;
    highlight?: boolean;
    accentColor?: string;
    subtitle?: string;
    href?: string;
}) {
    const colorMap: Record<string, string> = {
        amber: "text-amber-500",
    };
    const iconColor = accentColor ? colorMap[accentColor] || "text-accent" : "text-accent";

    const content = (
        <>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-2xl ${iconColor}`}>{icon}</span>
                {highlight && (
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}
            </div>
            <div className={`text-xl font-bold ${highlight ? "text-accent" : "text-text-primary"}`}>
                {value}
            </div>
            <div className="text-xs text-text-secondary mt-0.5">{label}</div>
            {subtitle && (
                <div className="text-[10px] text-text-tertiary mt-1">{subtitle}</div>
            )}
        </>
    );

    const className = `rounded-[var(--radius-lg)] border bg-bg-white p-5 transition-all ${highlight ? "border-accent/30 shadow-[0_0_0_1px_rgba(var(--accent-rgb),0.1)]" : "border-border"} ${href ? "hover:shadow-[var(--shadow-sm)] hover:border-accent/40 cursor-pointer" : ""}`;

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return <div className={className}>{content}</div>;
}

function QuickAction({
    href,
    icon,
    title,
    desc,
    badge,
}: {
    href: string;
    icon: ReactNode;
    title: string;
    desc: string;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-bg-white p-4 transition-base hover:bg-bg-secondary hover:shadow-[var(--shadow-xs)] relative"
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-bg-secondary text-accent relative">
                {icon}
                {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse">
                        {badge}
                    </span>
                )}
            </span>
            <div>
                <div className="text-sm font-semibold text-text-primary">{title}</div>
                <div className="text-xs text-text-secondary">{desc}</div>
            </div>
        </Link>
    );
}
