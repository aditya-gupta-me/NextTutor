import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ServiceRadiusMap from "@/components/ui/ServiceRadiusMap";
import {
    Body,
    BookBookmark,
    BookOpen,
    BookAlt,
    BuildingHouse,
    Buildings,
    Calendar,
    Chair,
    City,
    Diameter,
    EditAlt,
    Education,
    Envelope,
    Group,
    Head,
    Heart,
    HelpCircle,
    Home,
    InfoCircle,
    LocationPin,
    MapIcon,
    PencilSparkles,
    Phone,
    Rocket,
    Rupee,
    Clock,
    Trophy,
    UniversalAccess,
    User,
    UserSquare,
} from "@boxicons/react";
import type { ReactNode } from "react";

export default async function ProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/continue");

    const { data: profile } = await supabase
        .from("users")
        .select("full_name, role, email, phone, avatar_url, created_at")
        .eq("id", user.id)
        .single();

    if (!profile) redirect("/onboarding");

    const role = profile.role as "student" | "tutor";
    const initials = (profile.full_name || "U")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    let tutorData: Record<string, unknown> | null = null;
    let tutorFaqs: { question: string; answer: string }[] = [];
    let studentData: Record<string, unknown> | null = null;
    let parentData: Record<string, unknown> | null = null;

    let tutorLat: number | null = null;
    let tutorLng: number | null = null;

    if (role === "tutor") {
        const { data } = await supabase
            .from("tutor_profiles")
            .select("*, tutor_faqs(*)")
            .eq("user_id", user.id)
            .maybeSingle();
        if (data) {
            const { tutor_faqs: faqs, ...rest } = data as Record<string, unknown> & {
                tutor_faqs: { question: string; answer: string }[];
            };
            tutorData = rest;
            tutorFaqs = faqs || [];

            // Extract lat/lng from PostGIS via RPC (same pattern as public profile)
            try {
                const { data: locData } = await supabase
                    .rpc("get_tutor_coords", { tutor_id: data.id })
                    .single();
                const coords = locData as { lat: number; lng: number } | null;
                if (coords) {
                    tutorLat = coords.lat;
                    tutorLng = coords.lng;
                }
            } catch {
                // location not set — skip map
            }
        }
    } else {
        const { data } = await supabase
            .from("student_profiles")
            .select("*, parent_info(*)")
            .eq("user_id", user.id)
            .maybeSingle();
        if (data) {
            const { parent_info, ...rest } = data as Record<string, unknown> & {
                parent_info: Record<string, unknown> | null;
            };
            studentData = rest;
            parentData = parent_info;
        }
    }

    const joinDate = new Date(profile.created_at).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
    });

    // Calculate profile completion
    const completionItems = role === "tutor"
        ? [
            profile.full_name,
            profile.email || user.email,
            profile.phone || user.phone,
            tutorData?.qualification,
            tutorData?.bio,
            (tutorData?.subjects as string[])?.length,
            tutorData?.fee_per_month,
            tutorData?.city,
        ]
        : [
            profile.full_name,
            profile.email || user.email,
            profile.phone || user.phone,
            studentData?.school,
            studentData?.age,
            (studentData?.subjects_interested as string[])?.length,
            studentData?.city,
            parentData?.parent_name,
        ];

    const filledCount = completionItems.filter(Boolean).length;
    const totalCount = completionItems.length;
    const completionPercent = Math.round((filledCount / totalCount) * 100);

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[760px]">

            {/* ─── Hero Header Card ─── */}
            <div className="relative rounded-[var(--radius-xl)] border border-border bg-bg-white overflow-hidden mb-6">
                {/* Gradient Banner */}
                <div
                    className="h-28 md:h-32"
                    style={{
                        background: role === "tutor"
                            ? "linear-gradient(135deg, #C3B1E1 0%, #E8D5F5 50%, #F5E6FF 100%)"
                            : "linear-gradient(135deg, #A7D8F0 0%, #C9E8FA 50%, #E3F4FF 100%)",
                    }}
                />

                {/* Profile Content — overlaps banner */}
                <div className="px-6 md:px-8 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                        {/* Avatar with gradient ring */}
                        <div className="shrink-0 rounded-full p-[3px]" style={{
                            background: role === "tutor"
                                ? "linear-gradient(135deg, #9B7FD4, #C3B1E1)"
                                : "linear-gradient(135deg, #5BA3D9, #A7D8F0)",
                        }}>
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-bg-white text-2xl font-bold text-accent border-[3px] border-bg-white">
                                {profile.avatar_url ? (
                                    <Image
                                        src={profile.avatar_url}
                                        alt={profile.full_name || "User avatar"}
                                        width={96}
                                        height={96}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl">{initials}</span>
                                )}
                            </div>
                        </div>

                        {/* Name & badges */}
                        <div className="flex-1 min-w-0 pb-1">
                            <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl leading-tight">
                                {profile.full_name || "Unnamed User"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1 text-xs font-semibold text-white capitalize"
                                    style={{
                                        background: role === "tutor"
                                            ? "linear-gradient(135deg, #667eea, #764ba2)"
                                            : "linear-gradient(135deg, #2F80ED, #56CCF2)",
                                    }}
                                >
                                    {role === "tutor"
                                        ? <PencilSparkles size="sm" color="white" aria-hidden="true" focusable="false" />
                                        : <BookAlt size="sm" color="white" aria-hidden="true" focusable="false" />
                                    }
                                    {role}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
                                    <Calendar size="sm" aria-hidden="true" focusable="false" /> Joined {joinDate}
                                </span>
                            </div>
                        </div>

                        {/* Edit button */}
                        <Link
                            href="/profile/edit"
                            className="shrink-0 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-medium text-white transition-base hover:bg-accent-hover self-start sm:self-end"
                        >
                            <EditAlt size="sm" color="white" aria-hidden="true" focusable="false" /> Edit Profile
                        </Link>
                    </div>

                    {/* Contact pills */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {(profile.email || user.email) && (
                            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary">
                                <Envelope size="sm" className="text-accent" aria-hidden="true" focusable="false" />
                                {profile.email || user.email}
                            </span>
                        )}
                        {(profile.phone || user.phone) && (
                            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-bg-secondary px-3 py-1.5 text-xs text-text-secondary">
                                <Phone size="sm" className="text-accent" aria-hidden="true" focusable="false" />
                                {profile.phone || user.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Profile Completion ─── */}
            {completionPercent < 100 && (
                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Trophy size="sm" className="text-warning" aria-hidden="true" focusable="false" />
                            <span className="text-sm font-semibold text-text-primary">
                                Profile Strength
                            </span>
                        </div>
                        <span className="text-sm font-bold" style={{
                            color: completionPercent >= 75 ? "var(--success)" : completionPercent >= 50 ? "var(--warning)" : "var(--error)",
                        }}>
                            {completionPercent}%
                        </span>
                    </div>
                    <div className="h-2.5 rounded-[var(--radius-full)] bg-bg-tertiary overflow-hidden">
                        <div
                            className="h-full rounded-[var(--radius-full)] transition-all duration-500"
                            style={{
                                width: `${completionPercent}%`,
                                background: completionPercent >= 75
                                    ? "linear-gradient(90deg, #0F7B5F, #34D399)"
                                    : completionPercent >= 50
                                        ? "linear-gradient(90deg, #D97706, #FBBF24)"
                                        : "linear-gradient(90deg, #DC3545, #F87171)",
                            }}
                        />
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                        {completionPercent < 50
                            ? "Complete your profile to get discovered by tutors & students!"
                            : completionPercent < 100
                                ? "Almost there! A complete profile builds trust."
                                : ""}
                    </p>
                </div>
            )}

            {/* ─── Tutor Sections ─── */}
            {role === "tutor" && (
                <>
                    {/* Subjects as colorful chips */}
                    <ProfileSection icon={<BookOpen size="sm" aria-hidden="true" focusable="false" />} title="Subjects & Expertise">
                        {(tutorData?.subjects as string[])?.length ? (
                            <div className="flex flex-wrap gap-2">
                                {(tutorData!.subjects as string[]).map((subject, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3.5 py-1.5 text-xs font-medium border transition-base hover:shadow-[var(--shadow-xs)]"
                                        style={{
                                            backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].bg,
                                            color: SUBJECT_COLORS[i % SUBJECT_COLORS.length].text,
                                            borderColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].border,
                                        }}
                                    >
                                        <BookBookmark size="sm" aria-hidden="true" focusable="false" />
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <EmptyField message="No subjects added yet" />
                        )}
                    </ProfileSection>

                    {/* Teaching info */}
                    <ProfileSection icon={<Head size="sm" aria-hidden="true" focusable="false" />} title="My Details">
                        <div className="grid grid-cols-2 gap-3">
                            <MiniCard icon={<Education size="sm" aria-hidden="true" focusable="false" />} label="Qualification" value={tutorData?.qualification as string} />
                            <MiniCard icon={<UniversalAccess size="sm" aria-hidden="true" focusable="false" />} label="Gender" value={tutorData?.gender as string} />
                            <MiniCard icon={<Body size="sm" aria-hidden="true" focusable="false" />} label="Age" value={tutorData?.age ? `${tutorData.age} yrs` : null} />
                            <MiniCard icon={<Chair size="sm" aria-hidden="true" focusable="false" />} label="Available Seats" value={tutorData?.available_seats?.toString()} highlight />
                            <MiniCard icon={<Diameter size="sm" aria-hidden="true" focusable="false" />} label="Service Radius" value={tutorData?.service_radius_km ? `${tutorData.service_radius_km} km` : null} />
                        </div>
                    </ProfileSection>

                    {/* Bio */}
                    {(tutorData?.bio as string) && (
                        <ProfileSection icon={<UserSquare size="sm" aria-hidden="true" focusable="false" />} title="About Me">
                            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                                {tutorData!.bio as string}
                            </p>
                        </ProfileSection>
                    )}

                    {/* Fees */}
                    <ProfileSection icon={<Rupee size="sm" aria-hidden="true" focusable="false" />} title="Fees">
                        <div className="grid grid-cols-2 gap-4">
                            <FeeCard
                                label="Per Month"
                                amount={tutorData?.fee_per_month as number | null}
                                icon={<Calendar size="sm" aria-hidden="true" focusable="false" />}
                                gradient="linear-gradient(135deg, #9B7FD4, #C3B1E1)"
                            />
                            <FeeCard
                                label="Per Session"
                                amount={tutorData?.fee_per_session as number | null}
                                icon={<Clock size="sm" aria-hidden="true" focusable="false" />}
                                gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                            />
                        </div>
                    </ProfileSection>

                    {/* Location */}
                    <ProfileSection icon={<MapIcon size="sm" aria-hidden="true" focusable="false" />} title="Location">
                        <InfoRow icon={<Home size="sm" aria-hidden="true" focusable="false" />} label="Address" value={tutorData?.address as string} />
                        <InfoRow icon={<Buildings size="sm" aria-hidden="true" focusable="false" />} label="Locality" value={tutorData?.locality as string} />
                        <InfoRow icon={<City size="sm" aria-hidden="true" focusable="false" />} label="City" value={tutorData?.city as string} />
                        <InfoRow icon={<LocationPin size="sm" aria-hidden="true" focusable="false" />} label="Pincode" value={tutorData?.pincode as string} />

                        {/* Service area map */}
                        <div className="mt-4">
                            <ServiceRadiusMap
                                lat={tutorLat}
                                lng={tutorLng}
                                radiusKm={(tutorData?.service_radius_km as number) || 4}
                                tutorName={profile.full_name}
                            />
                        </div>
                    </ProfileSection>

                    {/* FAQs */}
                    {tutorFaqs.length > 0 && (
                        <ProfileSection icon={<HelpCircle size="sm" aria-hidden="true" focusable="false" />} title="Frequently Asked">
                            <div className="space-y-3">
                                {tutorFaqs.map((faq, i) => (
                                    <div key={i} className="rounded-[var(--radius-lg)] bg-bg-secondary p-4">
                                        <p className="text-sm font-semibold text-text-primary flex items-start gap-2.5">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white mt-0.5">
                                                {i + 1}
                                            </span>
                                            {faq.question}
                                        </p>
                                        <p className="mt-1.5 text-sm text-text-secondary pl-[30px]">
                                            {faq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </ProfileSection>
                    )}
                </>
            )}

            {/* ─── Student Sections ─── */}
            {role === "student" && (
                <>
                    {/* Subjects as colorful chips */}
                    {(studentData?.subjects_interested as string[])?.length ? (
                        <ProfileSection icon={<BookOpen size="sm" aria-hidden="true" focusable="false" />} title="Subjects I'm Learning">
                            <div className="flex flex-wrap gap-2">
                                {(studentData!.subjects_interested as string[]).map((subject, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3.5 py-1.5 text-xs font-medium border transition-base hover:shadow-[var(--shadow-xs)]"
                                        style={{
                                            backgroundColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].bg,
                                            color: SUBJECT_COLORS[i % SUBJECT_COLORS.length].text,
                                            borderColor: SUBJECT_COLORS[i % SUBJECT_COLORS.length].border,
                                        }}
                                    >
                                        <BookBookmark size="sm" aria-hidden="true" focusable="false" />
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        </ProfileSection>
                    ) : null}

                    {/* Student info as mini cards */}
                    <ProfileSection icon={<Head size="sm" aria-hidden="true" focusable="false" />} title="My Details">
                        <div className="grid grid-cols-2 gap-3">
                            <MiniCard icon={<BuildingHouse size="sm" aria-hidden="true" focusable="false" />} label="School" value={studentData?.school as string} />
                            <MiniCard icon={<UniversalAccess size="sm" aria-hidden="true" focusable="false" />} label="Gender" value={studentData?.gender as string} />
                            <MiniCard icon={<Body size="sm" aria-hidden="true" focusable="false" />} label="Age" value={studentData?.age ? `${studentData.age} years` : null} />
                        </div>
                    </ProfileSection>

                    {/* Location */}
                    <ProfileSection icon={<MapIcon size="sm" aria-hidden="true" focusable="false" />} title="Location">
                        <InfoRow icon={<Home size="sm" aria-hidden="true" focusable="false" />} label="Address" value={studentData?.address as string} />
                        <InfoRow icon={<Buildings size="sm" aria-hidden="true" focusable="false" />} label="Locality" value={studentData?.locality as string} />
                        <InfoRow icon={<City size="sm" aria-hidden="true" focusable="false" />} label="City" value={studentData?.city as string} />
                        <InfoRow icon={<LocationPin size="sm" aria-hidden="true" focusable="false" />} label="Pincode" value={studentData?.pincode as string} />
                    </ProfileSection>

                    {/* Parent / Guardian */}
                    {parentData && (
                        <ProfileSection icon={<Group size="sm" aria-hidden="true" focusable="false" />} title="Parent / Guardian">
                            <InfoRow icon={<User size="sm" aria-hidden="true" focusable="false" />} label="Name" value={parentData.parent_name as string} />
                            <InfoRow icon={<Phone size="sm" aria-hidden="true" focusable="false" />} label="Phone" value={parentData.parent_phone as string} />
                            <InfoRow icon={<Envelope size="sm" aria-hidden="true" focusable="false" />} label="Email" value={parentData.parent_email as string} />
                            <InfoRow icon={<Heart size="sm" aria-hidden="true" focusable="false" />} label="Relationship" value={
                                (parentData.relationship as string)
                                    ? (parentData.relationship as string).charAt(0).toUpperCase() +
                                    (parentData.relationship as string).slice(1)
                                    : null
                            } />
                        </ProfileSection>
                    )}
                </>
            )}

            {/* ─── Empty State ─── */}
            {role === "tutor" && !tutorData && (
                <EmptyPrompt
                    title="Let's build your tutor profile!"
                    message="Students are searching — complete your profile to start getting discovered."
                    role={role}
                />
            )}
            {role === "student" && !studentData && (
                <EmptyPrompt
                    title="Set up your student profile!"
                    message="A complete profile helps tutors understand your learning needs."
                    role={role}
                />
            )}
        </div>
    );
}

/* ── Constants ── */

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

/* ── Components ── */

function ProfileSection({
    icon,
    title,
    children,
}: {
    icon: ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 mb-5 transition-base hover:shadow-[var(--shadow-sm)]">
            <h2 className="flex items-center gap-2.5 text-base font-semibold text-text-primary mb-4 pb-3 border-b border-border">
                <span className="text-accent">{icon}</span>
                {title}
            </h2>
            {children}
        </div>
    );
}

function MiniCard({
    icon,
    label,
    value,
    highlight,
}: {
    icon: ReactNode;
    label: string;
    value?: string | null;
    highlight?: boolean;
}) {
    return (
        <div className={`rounded-[var(--radius-lg)] border p-3.5 transition-base ${highlight && value ? "border-accent/20 bg-accent-light" : "border-border bg-bg-secondary"}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className={highlight && value ? "text-accent" : "text-text-tertiary"}>{icon}</span>
                <span className="text-[11px] text-text-tertiary uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-sm font-semibold ${value ? "text-text-primary" : "text-text-tertiary italic"}`}>
                {value || "Not set"}
            </p>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
            <span className="text-text-tertiary shrink-0">{icon}</span>
            <span className="text-sm text-text-tertiary w-[100px] shrink-0">{label}</span>
            <span className={`text-sm flex-1 text-right ${value ? "text-text-primary font-medium" : "text-text-tertiary italic"}`}>
                {value || "Not set"}
            </span>
        </div>
    );
}

function FeeCard({
    label,
    amount,
    icon,
    gradient,
}: {
    label: string;
    amount: number | null;
    icon: ReactNode;
    gradient: string;
}) {
    return (
        <div className="relative rounded-[var(--radius-lg)] border border-border bg-bg-white p-5 text-center overflow-hidden group transition-base hover:shadow-[var(--shadow-sm)]">
            {/* Subtle gradient accent at top */}
            <div className="absolute top-0 left-0 right-0 h-1 opacity-60" style={{ background: gradient }} />
            <div className="flex items-center justify-center gap-1.5 mb-2">
                <span className="text-text-tertiary">{icon}</span>
                <p className="text-xs text-text-tertiary uppercase tracking-wide">{label}</p>
            </div>
            {amount ? (
                <p className="text-2xl font-bold text-text-primary">
                    ₹{amount.toLocaleString("en-IN")}
                </p>
            ) : (
                <p className="text-sm text-text-tertiary italic">Not set</p>
            )}
        </div>
    );
}

function EmptyField({ message }: { message: string }) {
    return (
        <p className="text-sm text-text-tertiary italic flex items-center gap-1.5">
            <InfoCircle size="sm" aria-hidden="true" focusable="false" />
            {message}
        </p>
    );
}

function EmptyPrompt({
    title,
    message,
    role,
}: {
    title: string;
    message: string;
    role: string;
}) {
    return (
        <div className="relative rounded-[var(--radius-xl)] border border-border bg-bg-white overflow-hidden text-center">
            {/* Gradient top accent */}
            <div
                className="h-1.5"
                style={{
                    background: role === "tutor"
                        ? "linear-gradient(90deg, #9B7FD4, #C3B1E1)"
                        : "linear-gradient(90deg, #5BA3D9, #A7D8F0)",
                }}
            />
            <div className="p-10">
                <span className="text-accent mb-3 inline-block"><Rocket size="lg" aria-hidden="true" focusable="false" /></span>
                <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
                <p className="text-sm text-text-secondary mb-5 max-w-xs mx-auto">{message}</p>
                <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 py-2.5 text-sm font-medium text-white transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-sm)]"
                >
                    <EditAlt size="sm" color="white" aria-hidden="true" focusable="false" />
                    Complete Your Profile
                </Link>
            </div>
        </div>
    );
}
