import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import ReviewsList from "@/components/ui/ReviewsList";
import TutorMap from "@/components/ui/TutorMap";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: tutor } = await supabase
        .from("tutor_profiles")
        .select("subjects, city, user_id, users!inner(full_name)")
        .eq("slug", slug)
        .single();

    if (!tutor) return { title: "Tutor Not Found — NextTutor" };

    const user = (tutor as unknown as { users: { full_name: string } }).users;
    return {
        title: `${user.full_name} — ${(tutor.subjects as string[]).join(", ")} Tutor in ${tutor.city} | NextTutor`,
        description: `Book sessions with ${user.full_name}, a verified ${(tutor.subjects as string[]).join(", ")} tutor in ${tutor.city}. View ratings, FAQs, and pricing on NextTutor.`,
    };
}

export default async function TutorProfilePage({ params }: PageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Check current user for auth-aware CTA
    const {
        data: { user: currentUser },
    } = await supabase.auth.getUser();

    let currentRole: string | null = null;
    let currentUserId: string | null = null;
    if (currentUser) {
        currentUserId = currentUser.id;
        const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", currentUser.id)
            .single();
        currentRole = profile?.role || null;
    }

    const { data: tutor } = await supabase
        .from("tutor_profiles")
        .select(`
      *,
      users!inner(full_name, avatar_url, email, phone),
      tutor_faqs(id, question, answer, display_order)
    `)
        .eq("slug", slug)
        .single();

    if (!tutor) notFound();

    const user = (tutor as unknown as { users: { full_name: string; avatar_url: string | null; email: string; phone: string } }).users;
    const faqs = (tutor.tutor_faqs || []) as { id: string; question: string; answer: string; display_order: number }[];
    const subjects = (tutor.subjects || []) as string[];
    const initials = user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Extract lat/lng from PostGIS geography column
    let tutorLat: number | null = null;
    let tutorLng: number | null = null;
    try {
        const { data: locData } = await supabase.rpc("get_tutor_coords", { tutor_id: tutor.id }).single();
        const coords = locData as { lat: number; lng: number } | null;
        if (coords) {
            tutorLat = coords.lat;
            tutorLng = coords.lng;
        }
    } catch {
        // location not set – skip map
    }

    // Fetch real reviews for this tutor
    const { data: rawReviews } = await supabase
        .from("reviews")
        .select("id, rating, comment, helpful_count, created_at, student_profile_id")
        .eq("tutor_profile_id", tutor.id)
        .order("created_at", { ascending: false });

    // Resolve reviewer names
    const reviews = await Promise.all(
        (rawReviews || []).map(async (r) => {
            let reviewerName = "Student";
            let reviewerInitials = "S";
            try {
                const { data: sp } = await supabase
                    .from("student_profiles")
                    .select("user_id")
                    .eq("id", r.student_profile_id)
                    .single();
                if (sp) {
                    const { data: u } = await supabase
                        .from("users")
                        .select("full_name")
                        .eq("id", sp.user_id)
                        .single();
                    if (u?.full_name) {
                        reviewerName = u.full_name;
                        reviewerInitials = u.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                    }
                }
            } catch { /* fallback */ }
            return {
                id: r.id,
                rating: r.rating,
                comment: r.comment || "",
                helpful_count: r.helpful_count || 0,
                created_at: r.created_at,
                reviewer_name: reviewerName,
                reviewer_initials: reviewerInitials,
            };
        })
    );

    return (
        <>
            <Navbar isLoggedIn={!!currentUser} />
            <main className="min-h-screen bg-bg-primary pt-20">
                <div className="mx-auto max-w-[720px] px-5 py-8 md:py-12">
                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-text-tertiary">
                        <Link href="/tutors" className="hover:text-text-secondary">Tutors</Link>
                        <span>/</span>
                        <span className="text-text-secondary">{user.full_name}</span>
                    </div>

                    {/* Hero Card */}
                    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8 mb-6">
                        <div className="flex flex-col sm:flex-row gap-5">
                            {/* Avatar */}
                            <div
                                className="shrink-0 self-center sm:self-start rounded-full p-[3px]"
                                style={{ background: "linear-gradient(135deg, #9B7FD4, #C3B1E1)" }}
                            >
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-bg-white text-2xl font-bold text-accent border-3 border-bg-white">
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.full_name} className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        <span>{initials}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                                            {user.full_name}
                                        </h1>
                                        <p className="mt-1 text-text-secondary">
                                            {subjects.join(" · ")}
                                        </p>
                                    </div>
                                </div>

                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    {tutor.verification_status === "verified" && (
                                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-success-light px-2.5 py-1 text-xs font-medium text-success">
                                            ✓ Verified
                                        </span>
                                    )}
                                    {tutor.avg_rating > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-warning-light px-2.5 py-1 text-xs font-medium text-warning">
                                            ⭐ {tutor.avg_rating.toFixed(1)} ({tutor.review_count} reviews)
                                        </span>
                                    )}
                                    <span className="text-xs text-text-tertiary">
                                        📍 {tutor.locality}, {tutor.city}
                                    </span>
                                </div>

                                {/* Pricing */}
                                <div className="flex items-center gap-4 mt-4">
                                    {tutor.fee_per_month && (
                                        <div>
                                            <span className="text-xl font-bold text-text-primary">
                                                ₹{tutor.fee_per_month.toLocaleString("en-IN")}
                                            </span>
                                            <span className="text-sm text-text-tertiary">/month</span>
                                        </div>
                                    )}
                                    {tutor.fee_per_session && (
                                        <div>
                                            <span className="text-xl font-bold text-text-primary">
                                                ₹{tutor.fee_per_session.toLocaleString("en-IN")}
                                            </span>
                                            <span className="text-sm text-text-tertiary">/session</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            {currentRole === "student" ? (
                                <Link
                                    href={`/sessions/new?tutor=${slug}`}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] py-3.5 text-center text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                                    style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                                >
                                    <i className="bx bx-book-reader text-lg" />
                                    Start Learning with {user.full_name.split(" ")[0]}
                                </Link>
                            ) : currentUserId === tutor.user_id ? (
                                <Link
                                    href="/profile/edit"
                                    className="flex-1 rounded-[var(--radius-lg)] border border-border bg-bg-white py-3.5 text-center text-sm font-medium text-text-primary transition-base hover:bg-bg-secondary"
                                >
                                    ✏️ Edit Your Profile
                                </Link>
                            ) : !currentUser ? (
                                <Link
                                    href="/continue"
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] py-3.5 text-center text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                                    style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                                >
                                    <i className="bx bx-log-in text-lg" />
                                    Sign up free to book a session
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    {/* About */}
                    {tutor.bio && (
                        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8 mb-6">
                            <h2 className="font-serif text-lg font-semibold text-text-primary mb-3">
                                About
                            </h2>
                            <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
                                {tutor.bio}
                            </p>
                        </div>
                    )}

                    {/* Details */}
                    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8 mb-6">
                        <h2 className="font-serif text-lg font-semibold text-text-primary mb-4">
                            Details
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <DetailItem label="Qualification" value={tutor.qualification} />
                            <DetailItem label="Subjects" value={subjects.join(", ")} />
                            <DetailItem label="Location" value={`${tutor.locality}, ${tutor.city} – ${tutor.pincode}`} />
                            <DetailItem label="Service Radius" value={`${tutor.service_radius_km} km`} />
                            <DetailItem label="Available Seats" value={`${tutor.available_seats}`} />
                        </div>
                    </div>

                    {/* FAQs */}
                    {faqs.length > 0 && (
                        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8 mb-6">
                            <h2 className="font-serif text-lg font-semibold text-text-primary mb-4">
                                Frequently Asked Questions
                            </h2>
                            <div className="space-y-4">
                                {faqs
                                    .sort((a, b) => a.display_order - b.display_order)
                                    .map((faq) => (
                                        <div key={faq.id}>
                                            <h3 className="text-sm font-semibold text-text-primary mb-1">
                                                {faq.question}
                                            </h3>
                                            <p className="text-sm text-text-secondary leading-relaxed">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Map */}
                    {tutorLat && tutorLng && (
                        <div className="mb-6">
                            <TutorMap
                                lat={tutorLat}
                                lng={tutorLng}
                                radiusKm={tutor.service_radius_km || 5}
                                tutorName={user.full_name}
                            />
                        </div>
                    )}

                    {/* Reviews (real data) */}
                    <ReviewsList
                        reviews={
                            !currentUser
                                ? [...reviews].sort((a, b) => b.helpful_count - a.helpful_count)
                                : reviews
                        }
                        isAuthenticated={!!currentUser}
                        avgRating={tutor.avg_rating || 0}
                        reviewCount={tutor.review_count || 0}
                        maxItems={!currentUser ? 3 : undefined}
                        moreHref={
                            !currentUser
                                ? "/continue"
                                : currentUserId === tutor.user_id
                                    ? "/reviews"
                                    : undefined
                        }
                    />
                </div>
            </main>
            <Footer />
        </>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div>
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-0.5">
                {label}
            </div>
            <div className="text-sm text-text-primary">{value}</div>
        </div>
    );
}
