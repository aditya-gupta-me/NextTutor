/**
 * Product-preview style illustrations.
 * These look like actual UI mockups rather than abstract art,
 * giving visitors a preview of what the platform feels like.
 */

export function HeroProductPreview({ className = "" }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {/* Main search card */}
            <div className="mockup-card p-5 w-full max-w-[340px] mx-auto">
                {/* Search bar */}
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-primary px-3 py-2.5 mb-4">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="7" cy="7" r="5.5" stroke="#8C8C8C" strokeWidth="1.5" />
                        <path d="M11 11L14 14" stroke="#8C8C8C" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-text-tertiary">Math tutor near Noida Sector 62...</span>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 mb-5">
                    <span className="rounded-[var(--radius-full)] bg-accent text-white px-3 py-1 text-[11px] font-medium">
                        Mathematics
                    </span>
                    <span className="rounded-[var(--radius-full)] border border-border bg-bg-primary px-3 py-1 text-[11px] font-medium text-text-secondary">
                        &lt; 5 km
                    </span>
                    <span className="rounded-[var(--radius-full)] border border-border bg-bg-primary px-3 py-1 text-[11px] font-medium text-text-secondary">
                        ✓ Verified
                    </span>
                </div>

                {/* Result card 1 */}
                <div className="rounded-[var(--radius-md)] border border-border bg-bg-white p-3.5 mb-3">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-accent-light flex items-center justify-center text-sm">
                            👩‍🏫
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-text-primary">Priya Sharma</span>
                                <span className="text-xs text-warning font-medium">⭐ 4.9</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">Mathematics · Physics</div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="5" fill="#0F7B5F" />
                                        <path d="M3 5L4.5 6.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Verified
                                </span>
                                <span className="text-[10px] text-text-tertiary">📍 1.2 km</span>
                                <span className="text-[10px] font-medium text-text-primary">₹3,000/mo</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result card 2 */}
                <div className="rounded-[var(--radius-md)] border border-border bg-bg-white p-3.5 mb-3">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-success-light flex items-center justify-center text-sm">
                            👨‍🏫
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-text-primary">Rajiv Mehta</span>
                                <span className="text-xs text-warning font-medium">⭐ 4.7</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">Mathematics · JEE Prep</div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="5" fill="#0F7B5F" />
                                        <path d="M3 5L4.5 6.5L7 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Verified
                                </span>
                                <span className="text-[10px] text-text-tertiary">📍 2.8 km</span>
                                <span className="text-[10px] font-medium text-text-primary">₹3,500/mo</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result card 3 (partial, cut off) */}
                <div className="rounded-[var(--radius-md)] border border-border bg-bg-white p-3.5 opacity-50">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-warning-light flex items-center justify-center text-sm">
                            👩‍🏫
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-text-primary">Ananya Joshi</span>
                                <span className="text-xs text-warning font-medium">⭐ 4.8</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-0.5">Mathematics · CBSE</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating badge — top right */}
            <div className="absolute -top-3 -right-3 mockup-card px-3 py-2 animate-float">
                <div className="flex items-center gap-1.5">
                    <span className="text-warning text-xs">★★★★★</span>
                    <span className="text-[10px] font-medium text-text-primary">4.8 avg</span>
                </div>
            </div>

            {/* Floating badge — bottom left */}
            <div className="absolute -bottom-2 -left-3 mockup-card px-3 py-2 animate-float" style={{ animationDelay: "1.5s" }}>
                <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="6" fill="#0F7B5F" />
                        <path d="M3.5 6L5.5 8L8.5 4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[10px] font-medium text-success">500+ verified</span>
                </div>
            </div>
        </div>
    );
}

export function TutorProfilePreview({ className = "" }: { className?: string }) {
    return (
        <div className={`mockup-card p-5 w-full max-w-[300px] ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-full bg-accent-light flex items-center justify-center text-2xl">
                    👩‍🏫
                </div>
                <div>
                    <div className="text-base font-semibold text-text-primary">Priya Sharma</div>
                    <div className="text-xs text-text-secondary">Mathematics · Physics</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-warning">★★★★★</span>
                        <span className="text-[10px] text-text-tertiary">4.9 (42 reviews)</span>
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-success-light px-2 py-0.5 text-[10px] font-medium text-success">
                    ✓ Verified
                </span>
                <span className="text-xs text-text-secondary">📍 Noida Sec 62</span>
            </div>

            {/* FAQ preview */}
            <div className="rounded-[var(--radius-md)] bg-bg-primary border border-border p-3 mb-3">
                <div className="text-[11px] font-semibold text-text-primary mb-1">What&apos;s your teaching approach?</div>
                <div className="text-[10px] text-text-secondary leading-relaxed">
                    I focus on building strong fundamentals through problem-solving. Each session includes concept explanation followed by practice.
                </div>
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-base font-bold text-text-primary">
                    ₹3,000<span className="text-xs font-normal text-text-tertiary">/month</span>
                </span>
                <span className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-xs font-medium text-white">
                    Request Session
                </span>
            </div>
        </div>
    );
}

export function SessionPreview({ className = "" }: { className?: string }) {
    return (
        <div className={`mockup-card p-5 w-full max-w-[300px] ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-text-primary">Upcoming Sessions</span>
                <span className="text-[10px] text-accent font-medium">View all →</span>
            </div>

            {/* Session card */}
            <div className="rounded-[var(--radius-md)] border border-border bg-bg-primary p-3 mb-2.5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-primary">Mathematics</span>
                    <span className="rounded-[var(--radius-sm)] bg-accent-light px-2 py-0.5 text-[9px] font-medium text-accent">
                        Today
                    </span>
                </div>
                <div className="text-[10px] text-text-secondary">with Priya Sharma · 4:00 – 5:00 PM</div>
                <div className="flex items-center gap-2 mt-2">
                    <div className="h-1.5 flex-1 rounded-full bg-bg-tertiary">
                        <div className="h-1.5 w-3/4 rounded-full bg-accent" />
                    </div>
                    <span className="text-[9px] text-text-tertiary">3 of 4 this week</span>
                </div>
            </div>

            {/* Session card 2 */}
            <div className="rounded-[var(--radius-md)] border border-border bg-bg-primary p-3 mb-2.5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-primary">Physics</span>
                    <span className="rounded-[var(--radius-sm)] bg-bg-tertiary px-2 py-0.5 text-[9px] font-medium text-text-tertiary">
                        Tomorrow
                    </span>
                </div>
                <div className="text-[10px] text-text-secondary">with Rajiv Mehta · 5:30 – 6:30 PM</div>
            </div>

            {/* Payment reminder */}
            <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning-light p-3 mt-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm">💳</span>
                    <div>
                        <div className="text-[10px] font-medium text-text-primary">Payment due in 3 days</div>
                        <div className="text-[9px] text-text-secondary">₹3,000 · Mathematics · Mar 2026</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
