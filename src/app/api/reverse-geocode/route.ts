import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/reverse-geocode
 *
 * Server-side reverse geocoding proxy with rate limiting.
 * Moves the Google Geocoding API call from the browser to the server so we can:
 *   1. Rate-limit by IP (max 5 requests per 60 seconds)
 *   2. Keep the API key server-side in the future (currently shared with client Maps JS)
 *   3. Log usage for observability
 *
 * Request body: { lat: number, lng: number }
 * Response: { address, locality, city, pincode } or { error: string }
 */

/* ── In-memory rate limiter (per-IP, sliding window) ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000; // 1 minute

function getClientIp(request: NextRequest): string {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return { allowed: true, retryAfterMs: 0 };
    }

    if (entry.count >= RATE_LIMIT) {
        return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    entry.count++;
    return { allowed: true, retryAfterMs: 0 };
}

// Periodic cleanup of stale rate limit entries (prevent memory leak)
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, 5 * 60_000); // every 5 minutes

/* ── Google Geocoding API types ── */
interface GeocoderResult {
    formatted_address: string;
    address_components: {
        long_name: string;
        short_name: string;
        types: string[];
    }[];
}

interface GeocoderResponse {
    status: string;
    results: GeocoderResult[];
    error_message?: string;
}

/* ── Route handler ── */
export async function POST(request: NextRequest) {
    const ip = getClientIp(request);

    // Rate limit check
    const { allowed, retryAfterMs } = checkRateLimit(ip);
    if (!allowed) {
        console.log(
            JSON.stringify({
                event: "maps_api_rate_limited",
                service: "reverse_geocode",
                ip: ip.slice(0, 8) + "***",
                timestamp: new Date().toISOString(),
            })
        );

        return NextResponse.json(
            { error: "Too many requests. Please try again shortly." },
            {
                status: 429,
                headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
            }
        );
    }

    // Parse and validate request body
    let lat: number;
    let lng: number;

    try {
        const body = await request.json();
        lat = body?.lat;
        lng = body?.lng;

        if (
            typeof lat !== "number" ||
            typeof lng !== "number" ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return NextResponse.json({ error: "lat and lng are required numbers" }, { status: 400 });
        }

        // Basic coordinate validation
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Call Google Geocoding API server-side
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("[reverse-geocode] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
        return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 503 });
    }

    const startMs = Date.now();

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data: GeocoderResponse = await response.json();
        const latencyMs = Date.now() - startMs;

        // Structured log
        console.log(
            JSON.stringify({
                event: "maps_api_call",
                service: "reverse_geocode",
                success: data.status === "OK",
                status: data.status,
                latencyMs,
                ip: ip.slice(0, 8) + "***",
                timestamp: new Date().toISOString(),
            })
        );

        if (data.status !== "OK" || !data.results?.length) {
            return NextResponse.json(
                { error: data.error_message || "No results found" },
                { status: 404 }
            );
        }

        const result = data.results[0];
        const get = (type: string) =>
            result.address_components?.find((c) => c.types.includes(type));

        return NextResponse.json({
            address: result.formatted_address || "",
            locality:
                get("sublocality_level_1")?.long_name ||
                get("sublocality")?.long_name ||
                get("neighborhood")?.long_name ||
                "",
            city:
                get("locality")?.long_name ||
                get("administrative_area_level_2")?.long_name ||
                "",
            pincode: get("postal_code")?.long_name || "",
        });
    } catch (error) {
        const latencyMs = Date.now() - startMs;

        console.error(
            JSON.stringify({
                event: "maps_api_call",
                service: "reverse_geocode",
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                latencyMs,
                ip: ip.slice(0, 8) + "***",
                timestamp: new Date().toISOString(),
            })
        );

        return NextResponse.json({ error: "Geocoding service failed" }, { status: 502 });
    }
}
