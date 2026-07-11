"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { BoxIcon } from "@/components/ui/BoxIcon";

// Lazy-load Recharts to avoid SSR issues
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const ReferenceLine = dynamic(() => import("recharts").then(m => m.ReferenceLine), { ssr: false });

interface DailyData {
    date: string;
    views: number;
    unique: number;
}

interface UpdateEvent {
    date: string;
    type: string;
    description: string;
}

interface AnalyticsData {
    summary: {
        totalViews: number;
        uniqueVisitors: number;
        growthPercent: number;
        periodLabel: string;
    };
    daily: DailyData[];
    events: UpdateEvent[];
}

type Range = "7d" | "30d" | "90d";

export default function AnalyticsPage() {
    const supabase = createClient();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [range, setRange] = useState<Range>("30d");

    const fetchAnalytics = useCallback(async (selectedRange: Range) => {
        setLoading(true);
        setError("");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Please log in to view analytics.");
                return;
            }

            const res = await fetch(`/api/analytics?range=${selectedRange}`, {
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                },
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error || "Failed to load analytics");
            }

            const result = await res.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load analytics");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchAnalytics(range);
    }, [range, fetchAnalytics]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const formatTooltipLabel = (label: unknown) => formatDate(String(label));

    // Get event dates for reference lines
    const eventDates = (data?.events || []).map(e => e.date.split("T")[0]);

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[960px]">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                    Profile Analytics
                </h1>
                <p className="mt-1 text-text-secondary">
                    Understand how students discover and engage with your profile
                </p>
            </div>

            {error && (
                <div className="rounded-[var(--radius-lg)] border border-error/20 bg-error/5 p-4 mb-6">
                    <p className="text-sm text-error">{error}</p>
                </div>
            )}

            {loading && !data ? (
                <div className="space-y-4">
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-1 h-24 skeleton rounded-[var(--radius-lg)]" />
                        ))}
                    </div>
                    <div className="h-72 skeleton rounded-[var(--radius-lg)]" />
                </div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <SummaryCard
                            icon="bx bx-show"
                            label="Profile Views"
                            value={data.summary.totalViews}
                            gradient="linear-gradient(135deg, #667eea, #764ba2)"
                        />
                        <SummaryCard
                            icon="bx bx-group"
                            label="Unique Visitors"
                            value={data.summary.uniqueVisitors}
                            gradient="linear-gradient(135deg, #f093fb, #f5576c)"
                        />
                        <SummaryCard
                            icon="bx bx-trending-up"
                            label="Growth"
                            value={`${data.summary.growthPercent > 0 ? "+" : ""}${data.summary.growthPercent}%`}
                            gradient={data.summary.growthPercent >= 0
                                ? "linear-gradient(135deg, #4facfe, #00f2fe)"
                                : "linear-gradient(135deg, #fa709a, #fee140)"
                            }
                            subtitle={`vs previous ${range.replace("d", " days")}`}
                        />
                    </div>

                    {/* Range Toggles */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-lg font-semibold text-text-primary">
                            Views Over Time
                        </h2>
                        <div className="flex gap-1 rounded-[var(--radius-md)] bg-bg-secondary p-1">
                            {(["7d", "30d", "90d"] as Range[]).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                                        range === r
                                            ? "bg-bg-white text-text-primary shadow-sm"
                                            : "text-text-tertiary hover:text-text-secondary"
                                    }`}
                                >
                                    {r.replace("d", "D")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-4 md:p-6 mb-6">
                        {data.daily.length > 0 ? (
                            <div style={{ width: "100%", height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="uniqueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f093fb" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#f093fb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={formatDate}
                                            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={range === "7d" ? 0 : range === "30d" ? 4 : 14}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: "var(--bg-white)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "var(--radius-md)",
                                                fontSize: "12px",
                                            }}
                                            labelFormatter={formatTooltipLabel}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#667eea"
                                            strokeWidth={2}
                                            fill="url(#viewsGradient)"
                                            name="Views"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="unique"
                                            stroke="#f093fb"
                                            strokeWidth={2}
                                            fill="url(#uniqueGradient)"
                                            name="Unique"
                                        />
                                        {/* Profile update markers */}
                                        {eventDates.map((date, i) => (
                                            <ReferenceLine
                                                key={i}
                                                x={date}
                                                stroke="#10b981"
                                                strokeDasharray="4 4"
                                                strokeWidth={1.5}
                                            />
                                        ))}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-text-tertiary">
                                <BoxIcon className="bx bx-bar-chart-alt-2 text-4xl mb-2" />
                                <p className="text-sm">No view data yet. Share your profile to start tracking!</p>
                            </div>
                        )}
                    </div>

                    {/* Profile Update Events */}
                    {data.events.length > 0 && (
                        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-4 md:p-6">
                            <h3 className="font-serif text-base font-semibold text-text-primary mb-3">
                                Profile Updates
                            </h3>
                            <p className="text-xs text-text-tertiary mb-4">
                                Green dashed lines on the chart mark when you updated your profile
                            </p>
                            <div className="space-y-2">
                                {data.events.map((event, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <div className="h-2 w-2 rounded-full bg-success shrink-0" />
                                        <span className="text-text-secondary">
                                            {new Date(event.date).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                        <span className="text-text-primary">
                                            {event.description || event.type.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    gradient,
    subtitle,
}: {
    icon: string;
    label: string;
    value: string | number;
    gradient: string;
    subtitle?: string;
}) {
    return (
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-white p-4 relative overflow-hidden">
            <div
                className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full"
                style={{ background: gradient }}
            />
            <div className="flex items-center gap-2 mb-2">
                <i className={`${icon} text-lg`} style={{ color: gradient.includes("#667eea") ? "#667eea" : gradient.includes("#f093fb") ? "#f093fb" : "#4facfe" }} />
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    {label}
                </span>
            </div>
            <div className="text-2xl font-bold text-text-primary">
                {value}
            </div>
            {subtitle && (
                <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
            )}
        </div>
    );
}
