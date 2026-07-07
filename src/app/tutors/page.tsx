"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { SUBJECTS, DISTANCE_OPTIONS } from "@/lib/constants";

interface TutorResult {
    id: string;
    slug: string;
    subjects: string[];
    qualification: string;
    fee_per_month: number | null;
    fee_per_session: number | null;
    locality: string;
    city: string;
    verification_status: string;
    avg_rating: number;
    review_count: number;
    available_seats: number;
    distance_km?: number;
    users: {
        full_name: string;
        avatar_url: string | null;
    };
}

const GUEST_LIMIT = 10;

export default function TutorSearchPage() {
    const [tutors, setTutors] = useState<TutorResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchSubject, setSearchSubject] = useState("");
    const [searchLocation, setSearchLocation] = useState("");
    const [filterVerified, setFilterVerified] = useState(false);
    const [sortBy, setSortBy] = useState<"rating" | "price_low" | "price_high" | "nearest">("rating");
    const [isGuest, setIsGuest] = useState(true);
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [userCity, setUserCity] = useState("");
    const [locationCooldown, setLocationCooldown] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsGuest(!user);
        });
    }, []);

    useEffect(() => {
        fetchTutors();
    }, [filterVerified, sortBy, userLat, userLng]);

    const fetchTutors = async () => {
        setLoading(true);
        const supabase = createClient();

        // If user has shared location and sort is "nearest", use PostGIS RPC
        if (userLat && userLng && sortBy === "nearest") {
            const { data } = await supabase.rpc("nearby_tutors", {
                user_lat: userLat,
                user_lng: userLng,
                radius_km: 100,
            });

            if (data) {
                const mapped: TutorResult[] = (data as unknown as {
                    id: string; slug: string; subjects: string[]; qualification: string;
                    fee_per_month: number | null; fee_per_session: number | null;
                    locality: string; city: string; verification_status: string;
                    avg_rating: number; review_count: number; available_seats: number;
                    full_name: string; avatar_url: string | null; distance_km: number;
                }[]).map((t) => ({
                    id: t.id,
                    slug: t.slug,
                    subjects: Array.isArray(t.subjects) ? t.subjects : [],
                    qualification: t.qualification,
                    fee_per_month: t.fee_per_month,
                    fee_per_session: t.fee_per_session,
                    locality: t.locality,
                    city: t.city,
                    verification_status: t.verification_status,
                    avg_rating: t.avg_rating,
                    review_count: t.review_count,
                    available_seats: t.available_seats,
                    distance_km: t.distance_km,
                    users: { full_name: t.full_name, avatar_url: t.avatar_url },
                }));
                setTutors(filterVerified ? mapped.filter((t) => t.verification_status === "verified") : mapped);
            } else {
                setTutors([]);
            }
            setLoading(false);
            return;
        }

        // Fallback: standard query
        let query = supabase
            .from("tutor_profiles")
            .select(`
        id, slug, subjects, qualification, fee_per_month, fee_per_session,
        locality, city, verification_status, avg_rating, review_count,
        available_seats,
        users!inner(full_name, avatar_url)
      `);

        if (filterVerified) {
            query = query.eq("verification_status", "verified");
        }

        if (sortBy === "rating" || sortBy === "nearest") {
            query = query.order("avg_rating", { ascending: false });
        } else if (sortBy === "price_low") {
            query = query.order("fee_per_month", { ascending: true, nullsFirst: false });
        } else {
            query = query.order("fee_per_month", { ascending: false, nullsFirst: false });
        }

        const { data } = await query.limit(50);
        setTutors((data as unknown as TutorResult[]) || []);
        setLoading(false);
    };

    const handleUseMyLocation = () => {
        if (locationCooldown || locating) return;
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser.");
            return;
        }
        setLocating(true);
        setLocationError("");
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                setUserLat(pos.coords.latitude);
                setUserLng(pos.coords.longitude);
                setSortBy("nearest");
                // Reverse geocode to get city name for subtitle
                try {
                    const { reverseGeocode } = await import("@/lib/google-maps");
                    const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                    if (result?.city) setUserCity(result.city);
                    else if (result?.locality) setUserCity(result.locality);
                } catch { /* ignore */ }
                setLocating(false);
                // Cooldown: prevent rapid re-clicks for 30 seconds
                setLocationCooldown(true);
                setTimeout(() => setLocationCooldown(false), 30000);
            },
            (err) => {
                setLocationError(
                    err.code === 1
                        ? "Location access denied. Please enable it in browser settings."
                        : "Unable to get your location. Try again."
                );
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Client-side subject filter
    const filteredTutors = tutors.filter((t) => {
        if (searchSubject && !t.subjects.some((s) =>
            s.toLowerCase().includes(searchSubject.toLowerCase())
        )) return false;
        if (searchLocation && !`${t.locality} ${t.city}`.toLowerCase().includes(searchLocation.toLowerCase())) return false;
        return true;
    });

    return (
        <>
            <Navbar isLoggedIn={!isGuest} />
            <main className="pt-20 pb-16 md:pt-24">
                <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-serif text-3xl font-bold text-text-primary md:text-4xl">
                            Find tutors near you
                        </h1>
                        <p className="mt-2 text-text-secondary">
                            Browse verified tutors {userCity ? `in ${userCity}` : 'near you'}. Filter by subject, location, and price.
                        </p>
                    </div>

                    {/* Search & Filters */}
                    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 mb-8">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            {/* Subject */}
                            <div className="flex-1">
                                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1.5 block">
                                    Subject
                                </label>
                                <select
                                    value={searchSubject}
                                    onChange={(e) => setSearchSubject(e.target.value)}
                                    className="w-full rounded-[var(--radius-md)] border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none transition-base focus:border-accent"
                                >
                                    <option value="">All subjects</option>
                                    {SUBJECTS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Location */}
                            <div className="flex-1">
                                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1.5 block">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={searchLocation}
                                    onChange={(e) => setSearchLocation(e.target.value)}
                                    placeholder="e.g. Noida Sector 62"
                                    className="w-full rounded-[var(--radius-md)] border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-base focus:border-accent"
                                />
                            </div>

                            {/* Sort */}
                            <div className="w-full md:w-[180px]">
                                <label className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1.5 block">
                                    Sort by
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                    className="w-full rounded-[var(--radius-md)] border border-border bg-bg-primary px-3 py-2.5 text-sm text-text-primary outline-none transition-base focus:border-accent"
                                >
                                    {userLat && userLng && (
                                        <option value="nearest">Nearest first</option>
                                    )}
                                    <option value="rating">Highest rated</option>
                                    <option value="price_low">Price: Low to High</option>
                                    <option value="price_high">Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter chips */}
                        <div className="flex items-center gap-3 mt-4">
                            <button
                                onClick={() => setFilterVerified(!filterVerified)}
                                className={`rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-medium transition-base ${filterVerified
                                    ? "bg-success-light text-success border border-success/20"
                                    : "bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary"
                                    }`}
                            >
                                ✓ Verified only
                            </button>
                            <button
                                onClick={handleUseMyLocation}
                                disabled={locating || locationCooldown}
                                className={`rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-medium transition-base cursor-pointer disabled:cursor-wait ${userLat
                                    ? "bg-accent/10 text-accent border border-accent/20"
                                    : "bg-bg-secondary text-text-secondary border border-border hover:bg-bg-tertiary"
                                    }`}
                            >
                                <i className={`bx ${locating ? "bx-loader-alt animate-spin" : "bx-current-location"} mr-1`} />
                                {locating ? "Locating..." : userLat ? "📍 Near me" : "Use my location"}
                            </button>
                        </div>
                        {locationError && (
                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                <i className="bx bx-error-circle" /> {locationError}
                            </p>
                        )}
                    </div>

                    {/* Results */}
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-full skeleton" />
                                        <div className="flex-1">
                                            <div className="h-4 w-24 skeleton mb-2" />
                                            <div className="h-3 w-32 skeleton" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-full skeleton mb-2" />
                                    <div className="h-3 w-2/3 skeleton" />
                                </div>
                            ))}
                        </div>
                    ) : filteredTutors.length === 0 ? (
                        <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-16 text-center">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-lg font-medium text-text-primary">No tutors found</p>
                            <p className="mt-1 text-sm text-text-secondary">
                                Try adjusting your filters or search in a different area.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-text-tertiary mb-4">
                                {isGuest && filteredTutors.length > GUEST_LIMIT
                                    ? `Showing ${GUEST_LIMIT} of ${filteredTutors.length} tutors`
                                    : `${filteredTutors.length} tutor${filteredTutors.length !== 1 ? "s" : ""} found`}
                            </p>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(isGuest ? filteredTutors.slice(0, GUEST_LIMIT) : filteredTutors).map((tutor) => (
                                    <TutorCard key={tutor.id} tutor={tutor} />
                                ))}
                            </div>
                            {isGuest && filteredTutors.length > GUEST_LIMIT && (
                                <div className="mt-8 rounded-[var(--radius-xl)] border border-accent/20 p-8 text-center" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)" }}>
                                    <i className="bx bx-lock-open-alt text-3xl text-accent mb-3" />
                                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                                        You&apos;re only seeing a preview
                                    </h3>
                                    <p className="text-sm text-text-secondary mb-5 max-w-md mx-auto">
                                        Join free to browse all {filteredTutors.length} tutors, send session requests, and start learning today.
                                    </p>
                                    <Link
                                        href="/continue"
                                        className="inline-flex items-center gap-2 rounded-[var(--radius-lg)] py-3 px-8 text-sm font-semibold text-white transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                                    >
                                        <i className="bx bx-user-plus" /> Create Free Account →
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}

function TutorCard({ tutor }: { tutor: TutorResult }) {
    const user = tutor.users;
    const initials = user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <Link
            href={`/tutors/${tutor.slug}`}
            className="card-hover rounded-[var(--radius-xl)] border border-border bg-bg-white p-5 block"
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="h-12 w-12 rounded-full object-cover"
                        />
                    ) : (
                        initials
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                        {user.full_name}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                        {tutor.subjects.join(" · ")}
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {tutor.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-success-light px-2 py-0.5 text-[10px] font-medium text-success">
                        ✓ Verified
                    </span>
                )}
                {tutor.avg_rating > 0 && (
                    <span className="text-xs text-warning font-medium">
                        ⭐ {tutor.avg_rating.toFixed(1)} ({tutor.review_count})
                    </span>
                )}
                <span className="text-xs text-text-tertiary">
                    📍 {tutor.locality}, {tutor.city}
                </span>
                {tutor.distance_km !== undefined && (
                    <span className="inline-flex items-center gap-0.5 rounded-[var(--radius-sm)] bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <i className="bx bx-walk text-xs" />
                        {tutor.distance_km} km
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                    {tutor.fee_per_month && (
                        <span className="text-sm font-bold text-text-primary">
                            ₹{tutor.fee_per_month.toLocaleString("en-IN")}
                            <span className="text-xs font-normal text-text-tertiary">/mo</span>
                        </span>
                    )}
                </div>
                <span className="text-xs text-accent font-medium">View Profile →</span>
            </div>
        </Link>
    );
}
