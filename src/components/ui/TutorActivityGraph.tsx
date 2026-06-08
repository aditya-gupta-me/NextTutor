"use client";

import { useEffect, useState } from "react";

/**
 * Simplified activity graph for student-facing tutor profiles.
 * Shows a small trend sparkline with no exact numbers —
 * purely a visual warmth indicator of profile activity.
 */

interface ActivityData {
    daily: Array<{ date: string; views: number }>;
}

export default function TutorActivityGraph({
    tutorProfileId,
}: {
    tutorProfileId: string;
}) {
    const [data, setData] = useState<ActivityData | null>(null);

    useEffect(() => {
        fetch(`/api/tutor-activity?tutorProfileId=${tutorProfileId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((d) => setData(d))
            .catch(() => {});
    }, [tutorProfileId]);

    if (!data || data.daily.length === 0) return null;

    const values = data.daily.map((d) => d.views);
    const max = Math.max(...values, 1);
    const total = values.reduce((a, b) => a + b, 0);

    // Don't show if there's no meaningful activity
    if (total === 0) return null;

    // Build SVG sparkline path
    const width = 200;
    const height = 40;
    const padding = 2;
    const points = values.map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
        const y = height - padding - (v / max) * (height - 2 * padding);
        return `${x},${y}`;
    });
    const linePath = `M ${points.join(" L ")}`;
    // Fill area below the line
    const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

    return (
        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-4 md:p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <i className="bx bx-trending-up text-accent" />
                    Profile Activity
                </h2>
                <span className="text-[11px] text-text-tertiary">Last 30 days</span>
            </div>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-10"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#activityFill)" />
                <path
                    d={linePath}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <p className="text-[11px] text-text-tertiary mt-2">
                This tutor has been actively engaging with students
            </p>
        </div>
    );
}
