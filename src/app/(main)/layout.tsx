import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileHeader from "@/components/ui/MobileHeader";
import { NavLink, MobileNavLink } from "@/components/ui/NavigationLinks";
import {
    Dashboard,
    User,
    Search,
    CalendarEvent,
    Star,
    ChartSpline,
    CreditCardAlt,
    Cog,
} from "@boxicons/react";
import type { ReactNode } from "react";

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
        <div className="h-[100dvh] bg-bg-primary flex overflow-hidden w-full">
            {/* Sidebar */}
            <aside className="hidden md:flex w-[240px] flex-col border-r border-border bg-bg-white flex-shrink-0">
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
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <NavLink href="/dashboard" icon={<Dashboard size="sm" />} label="Dashboard" />
                    <NavLink href="/profile" icon={<User size="sm" />} label="My Profile" />
                    {role === "student" && (
                        <NavLink href="/tutors" icon={<Search size="sm" />} label="Find Tutors" />
                    )}
                    <NavLink
                        href="/sessions"
                        icon={<CalendarEvent size="sm" />}
                        label="Sessions"
                        badge={pendingSessionCount}
                    />
                    {role === "tutor" && (
                        <NavLink href="/reviews" icon={<Star size="sm" />} label="Reviews" />
                    )}
                    {role === "tutor" && (
                        <NavLink href="/analytics" icon={<ChartSpline size="sm" />} label="Analytics" />
                    )}
                    <NavLink href="/payments" icon={<CreditCardAlt size="sm" />} label="Payments" />
                    <NavLink href="/settings" icon={<Cog size="sm" />} label="Settings" />
                </nav>

                {/* User */}
                <div className="px-4 py-4 border-t border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent overflow-hidden shrink-0">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt={name} width={36} height={36} className="h-full w-full object-cover" />
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
            <div className="flex-1 flex flex-col min-w-0">
                <MobileHeader
                    avatarUrl={avatarUrl}
                    name={name}
                    initials={initials}
                    role={role}
                />

                {/* Mobile bottom nav */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>

                <nav className="md:hidden flex items-center justify-around border-t border-border bg-bg-white py-2 shrink-0 pb-safe">
                    <MobileNavLink href="/dashboard" icon={<Dashboard size="sm" />} label="Home" />
                    <MobileNavLink
                        href="/sessions"
                        icon={<CalendarEvent size="sm" />}
                        label="Sessions"
                        badge={pendingSessionCount}
                    />
                    {role === "student" && (
                        <MobileNavLink href="/tutors" icon={<Search size="sm" />} label="Search" />
                    )}
                    <MobileNavLink href="/payments" icon={<CreditCardAlt size="sm" />} label="Payments" />
                    <MobileNavLink href="/profile" icon={<User size="sm" />} label="Profile" />
                </nav>
            </div>
        </div>
    );
}
