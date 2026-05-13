import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
    title: "My Reviews — NextTutor",
    description: "View reviews on your NextTutor profile.",
};

export default async function ReviewsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user!.id)
        .single();

    const role = profile?.role || "student";

    // ── Tutor view: reviews received ──
    if (role === "tutor") {
        const { data: tutorProfile } = await supabase
            .from("tutor_profiles")
            .select("id, avg_rating, review_count")
            .eq("user_id", user!.id)
            .single();

        if (!tutorProfile) {
            return (
                <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
                    <EmptyState
                        title="No tutor profile found"
                        desc="Complete your tutor profile to start receiving reviews."
                        href="/profile/edit"
                        cta="Set Up Profile"
                    />
                </div>
            );
        }

        const avgRating = tutorProfile.avg_rating || 0;
        const reviewCount = tutorProfile.review_count || 0;

        const { data: rawReviews } = await supabase
            .from("reviews")
            .select("id, rating, comment, helpful_count, created_at, student_profile_id")
            .eq("tutor_profile_id", tutorProfile.id)
            .order("created_at", { ascending: false });

        // Resolve names
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

        // Rating breakdown
        const breakdown = [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: reviews.filter((r) => r.rating === star).length,
        }));

        return (
            <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-text-tertiary mb-3">
                        <Link href="/dashboard" className="hover:text-text-secondary">Dashboard</Link>
                        <span>›</span>
                        <span className="text-text-secondary">Reviews</span>
                    </div>
                    <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                        Your Reviews
                    </h1>
                    <p className="mt-1 text-text-secondary">
                        Feedback from your students
                    </p>
                </div>

                {/* Summary card */}
                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Big rating */}
                        <div className="text-center sm:text-left">
                            <div className="text-5xl font-bold text-text-primary leading-none">
                                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                            </div>
                            <div className="flex items-center gap-0.5 mt-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <i
                                        key={s}
                                        className={`bx bx-star text-lg ${s <= Math.round(avgRating) ? "text-amber-400" : "text-gray-200"}`}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-text-tertiary mt-1">
                                {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                            </p>
                        </div>

                        {/* Rating distribution */}
                        <div className="flex-1 w-full space-y-2">
                            {breakdown.map(({ star, count }) => {
                                const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center gap-3">
                                        <span className="text-sm text-text-tertiary w-4 text-right">{star}</span>
                                        <i className="bx bx-star text-sm text-amber-400" />
                                        <div className="flex-1 h-2.5 rounded-full bg-bg-secondary overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-amber-400 transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-text-tertiary w-6">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Reviews list */}
                {reviews.length === 0 ? (
                    <EmptyState
                        title="No reviews yet"
                        desc="Once students complete sessions with you, their reviews will show up here."
                    />
                ) : (
                    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white divide-y divide-border">
                        {reviews.map((review) => (
                            <div key={review.id} className="p-5 md:p-6">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent">
                                        {review.reviewer_initials}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-text-primary">{review.reviewer_name}</p>
                                        <p className="text-[11px] text-text-tertiary">
                                            {new Date(review.created_at).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    {review.helpful_count > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                                            <i className="bx bx-like text-sm" />
                                            {review.helpful_count}
                                        </span>
                                    )}
                                </div>

                                {/* Stars */}
                                <div className="flex items-center gap-0.5 mb-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <i
                                            key={s}
                                            className={`bx bx-star text-sm ${s <= review.rating ? "text-amber-400" : "text-gray-200"}`}
                                        />
                                    ))}
                                </div>

                                {/* Comment */}
                                {review.comment && (
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── Student view: reviews submitted ──
    const { data: studentProfile } = await supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

    if (!studentProfile) {
        return (
            <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
                <EmptyState
                    title="No student profile found"
                    desc="Complete your student profile to get started."
                    href="/profile/edit"
                    cta="Set Up Profile"
                />
            </div>
        );
    }

    const { data: rawStudentReviews } = await supabase
        .from("reviews")
        .select("id, rating, comment, helpful_count, created_at, tutor_profile_id")
        .eq("student_profile_id", studentProfile.id)
        .order("created_at", { ascending: false });

    // Resolve tutor names
    const studentReviews = await Promise.all(
        (rawStudentReviews || []).map(async (r) => {
            let tutorName = "Tutor";
            let tutorSlug = "";
            try {
                const { data: tp } = await supabase
                    .from("tutor_profiles")
                    .select("user_id, slug")
                    .eq("id", r.tutor_profile_id)
                    .single();
                if (tp) {
                    tutorSlug = tp.slug;
                    const { data: u } = await supabase
                        .from("users")
                        .select("full_name")
                        .eq("id", tp.user_id)
                        .single();
                    if (u?.full_name) tutorName = u.full_name;
                }
            } catch { /* fallback */ }
            return {
                id: r.id,
                rating: r.rating,
                comment: r.comment || "",
                helpful_count: r.helpful_count || 0,
                created_at: r.created_at,
                tutor_name: tutorName,
                tutor_slug: tutorSlug,
            };
        })
    );

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-text-tertiary mb-3">
                    <Link href="/dashboard" className="hover:text-text-secondary">Dashboard</Link>
                    <span>›</span>
                    <span className="text-text-secondary">Reviews</span>
                </div>
                <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                    Your Reviews
                </h1>
                <p className="mt-1 text-text-secondary">
                    Reviews you&apos;ve submitted for your tutors
                </p>
            </div>

            {studentReviews.length === 0 ? (
                <EmptyState
                    title="No reviews yet"
                    desc="After completing a session, you can leave a review for your tutor."
                    href="/sessions"
                    cta="View Sessions"
                />
            ) : (
                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white divide-y divide-border">
                    {studentReviews.map((review) => (
                        <div key={review.id} className="p-5 md:p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        Review for{" "}
                                        {review.tutor_slug ? (
                                            <Link href={`/tutors/${review.tutor_slug}`} className="text-accent hover:underline">
                                                {review.tutor_name}
                                            </Link>
                                        ) : (
                                            review.tutor_name
                                        )}
                                    </p>
                                    <p className="text-[11px] text-text-tertiary">
                                        {new Date(review.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })}
                                    </p>
                                </div>
                                {review.helpful_count > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                                        <i className="bx bx-like text-sm" />
                                        {review.helpful_count} helpful
                                    </span>
                                )}
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <i
                                        key={s}
                                        className={`bx bx-star text-sm ${s <= review.rating ? "text-amber-400" : "text-gray-200"}`}
                                    />
                                ))}
                            </div>

                            {/* Comment */}
                            {review.comment && (
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState({
    title,
    desc,
    href,
    cta,
}: {
    title: string;
    desc: string;
    href?: string;
    cta?: string;
}) {
    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-10 text-center">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm font-medium text-text-primary">{title}</p>
            <p className="mt-1 text-xs text-text-secondary">{desc}</p>
            {href && cta && (
                <Link
                    href={href}
                    className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-lg)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg"
                    style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                >
                    {cta}
                </Link>
            )}
        </div>
    );
}
