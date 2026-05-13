import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/continue");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("users")
        .select("full_name, role, avatar_url")
        .eq("id", user.id)
        .single();

    const role = profile?.role || "student";
    const name = profile?.full_name || "User";
    const avatarUrl = profile?.avatar_url as string | null;
    const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Fetch pending session count for tutors (for badge)
    let pendingSessionCount = 0;
    if (role === "tutor") {
        try {
            const { data: tutorProfile } = await supabase
                .from("tutor_profiles")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (tutorProfile) {
                const { count } = await supabase
                    .from("sessions")
                    .select("*", { count: "exact", head: true })
                    .eq("tutor_profile_id", tutorProfile.id)
                    .eq("status", "requested");
                pendingSessionCount = count || 0;
            }
        } catch {
            // fallback
        }
    }

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Sidebar */}
            <aside className="hidden md:flex w-[240px] flex-col border-r border-border bg-bg-white sticky top-0 h-screen overflow-y-auto">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-border">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-lg font-bold text-text-primary"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent text-sm font-bold text-white">
                            T
                        </span>
                        <span className="font-serif">NextTutor</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <NavLink href="/dashboard" icon="bx bx-dashboard" label="Dashboard" />
                    <NavLink href="/profile" icon="bx bx-user" label="My Profile" />
                    {role === "student" && (
                        <NavLink href="/tutors" icon="bx bx-search" label="Find Tutors" />
                    )}
                    <NavLink
                        href="/sessions"
                        icon="bx bx-calendar-event"
                        label="Sessions"
                        badge={pendingSessionCount}
                    />
                    {role === "tutor" && (
                        <NavLink href="/reviews" icon="bx bx-star" label="Reviews" />
                    )}
                    <NavLink href="/payments" icon="bx bx-credit-card-alt" label="Payments" />
                    <NavLink href="/settings" icon="bx bx-cog" label="Settings" />
                </nav>

                {/* User */}
                <div className="px-4 py-4 border-t border-border">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">
                                {name}
                            </div>
                            <div className="text-[11px] text-text-tertiary capitalize">{role}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile header */}
            <div className="flex-1 flex flex-col">
                <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-white">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-base font-bold text-text-primary"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-xs font-bold text-white">
                            T
                        </span>
                        <span className="font-serif">NextTutor</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile bottom nav */}
                <main className="flex-1 overflow-auto">{children}</main>

                <nav className="md:hidden flex items-center justify-around border-t border-border bg-bg-white py-2">
                    <MobileNavLink href="/dashboard" icon="bx bx-dashboard" label="Home" />
                    <MobileNavLink
                        href="/sessions"
                        icon="bx bx-calendar-event"
                        label="Sessions"
                        badge={pendingSessionCount}
                    />
                    {role === "student" && (
                        <MobileNavLink href="/tutors" icon="bx bx-search" label="Search" />
                    )}
                    <MobileNavLink href="/payments" icon="bx bx-credit-card-alt" label="Payments" />
                    <MobileNavLink href="/profile" icon="bx bx-user" label="Profile" />
                </nav>
            </div>
        </div>
    );
}

function NavLink({
    href,
    icon,
    label,
    badge,
}: {
    href: string;
    icon: string;
    label: string;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-text-secondary transition-base hover:bg-bg-secondary hover:text-text-primary"
        >
            <span className="relative">
                <i className={`${icon} text-lg`} />
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white shadow-sm">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </span>
            <span className="flex-1">{label}</span>
        </Link>
    );
}

function MobileNavLink({
    href,
    icon,
    label,
    badge,
}: {
    href: string;
    icon: string;
    label: string;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-text-secondary relative"
        >
            <span className="relative">
                <i className={`${icon} text-xl`} />
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </span>
            <span className="text-[10px]">{label}</span>
        </Link>
    );
}
