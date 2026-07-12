"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleHelpful } from "@/app/(main)/sessions/actions";
import { BoxIcon } from "@/components/ui/BoxIcon";

interface ReviewItem {
    id: string;
    rating: number;
    comment: string;
    helpful_count: number;
    created_at: string;
    reviewer_name: string;
    reviewer_initials: string;
}

export default function ReviewsList({
    reviews,
    isAuthenticated,
    avgRating,
    reviewCount,
    maxItems,
    moreHref,
}: {
    reviews: ReviewItem[];
    isAuthenticated: boolean;
    avgRating: number;
    reviewCount: number;
    maxItems?: number;
    moreHref?: string;
}) {
    const visibleReviews = maxItems ? reviews.slice(0, maxItems) : reviews;
    const hasMore = maxItems && reviews.length > maxItems;

    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8">
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-5">
                Reviews
            </h2>

            {/* Summary bar */}
            {reviewCount > 0 && (
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border">
                    {/* Big rating */}
                    <div className="text-center">
                        <div className="text-4xl font-bold text-text-primary leading-none">
                            {avgRating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-0.5 mt-1.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <BoxIcon key={s}
                                    className={`bx bx-star text-sm ${s <= Math.round(avgRating) ? "text-amber-400" : "text-gray-200"}`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-text-tertiary mt-1">
                            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Rating distribution */}
                    <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviews.filter((r) => r.rating === star).length;
                            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs text-text-tertiary w-3 text-right">{star}</span>
                                    <BoxIcon className="bx bx-star text-xs text-amber-400" />
                                    <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-400 transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-text-tertiary w-5">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-sm font-medium text-text-primary">No reviews yet</p>
                    <p className="text-xs text-text-tertiary mt-1">Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {visibleReviews.map((review, idx) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            isAuthenticated={isAuthenticated}
                            isLast={idx === visibleReviews.length - 1 && !hasMore}
                        />
                    ))}
                </div>
            )}

            {/* "See all" link */}
            {(hasMore || (moreHref && reviews.length > 0)) && moreHref && (
                <div className="mt-4 pt-4 border-t border-border text-center">
                    <Link
                        href={moreHref}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline transition-all"
                    >
                        See all {reviewCount} reviews
                        <BoxIcon className="bx bx-right-arrow-alt text-lg" />
                    </Link>
                </div>
            )}
        </div>
    );
}

function ReviewCard({
    review,
    isAuthenticated,
    isLast,
}: {
    review: ReviewItem;
    isAuthenticated: boolean;
    isLast: boolean;
}) {
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
    const [liked, setLiked] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleHelpful = () => {
        if (!isAuthenticated) return;
        startTransition(async () => {
            try {
                const result = await toggleHelpful(review.id);
                setLiked(result.liked);
                setHelpfulCount((prev) => (result.liked ? prev + 1 : Math.max(0, prev - 1)));
            } catch {
                // ignore
            }
        });
    };

    const dateLabel = new Date(review.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <div className={`py-5 ${!isLast ? "border-b border-border" : ""}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light text-xs font-bold text-accent">
                    {review.reviewer_initials}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{review.reviewer_name}</p>
                    <p className="text-[11px] text-text-tertiary">{dateLabel}</p>
                </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                    <BoxIcon key={s}
                        className={`bx bx-star text-sm ${s <= review.rating ? "text-amber-400" : "text-gray-200"}`}
                    />
                ))}
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-sm text-text-secondary leading-relaxed mb-3">
                    {review.comment}
                </p>
            )}

            {/* Helpful button */}
            <button
                onClick={handleHelpful}
                disabled={isPending || !isAuthenticated}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer disabled:cursor-default ${liked
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-bg-secondary text-text-tertiary border border-transparent hover:bg-bg-secondary hover:text-text-secondary"
                    }`}
            >
                <BoxIcon className={`bx ${liked ? "bxs-like" : "bx-like"} text-sm`} />
                {helpfulCount > 0 ? `Helpful (${helpfulCount})` : "Helpful"}
            </button>
        </div>
    );
}
