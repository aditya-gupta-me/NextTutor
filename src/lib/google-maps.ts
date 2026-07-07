/**
 * Google Maps script loader & geocoding utility.
 * Uses a singleton to ensure the script is only loaded once.
 *
 * Cost protections:
 * - Singleton script loader (prevents duplicate API loads)
 * - sessionStorage cache for reverse geocode (prevents repeat billing for same coords)
 * - Circuit breaker to stop retrying after consecutive failures
 */

let googleMapsPromise: Promise<typeof google.maps> | null = null;

/* ── Circuit Breaker ── */
const circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    threshold: 3,          // open circuit after 3 consecutive failures
    cooldownMs: 5 * 60000, // 5 minutes before retrying
    isOpen(): boolean {
        if (this.failures < this.threshold) return false;
        // Allow retry after cooldown
        if (Date.now() - this.lastFailure > this.cooldownMs) {
            this.failures = 0;
            return false;
        }
        return true;
    },
    recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();
    },
    recordSuccess() {
        this.failures = 0;
    },
};

/** Load Google Maps JS API (returns the google.maps namespace) */
export function loadGoogleMaps(): Promise<typeof google.maps> {
    if (circuitBreaker.isOpen()) {
        return Promise.reject(new Error("Google Maps temporarily unavailable (circuit breaker open)"));
    }

    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise((resolve, reject) => {
        // Already loaded?
        if (typeof google !== "undefined" && google.maps) {
            circuitBreaker.recordSuccess();
            resolve(google.maps);
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=Function.prototype`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            // Small delay to let Google Maps fully initialize
            const check = () => {
                if (typeof google !== "undefined" && google.maps) {
                    circuitBreaker.recordSuccess();
                    resolve(google.maps);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        };
        script.onerror = () => {
            circuitBreaker.recordFailure();
            googleMapsPromise = null; // Allow retry after circuit breaker cooldown
            reject(new Error("Failed to load Google Maps script"));
        };
        document.head.appendChild(script);
    });

    return googleMapsPromise;
}

/**
 * Geocode an address string → { lat, lng }.
 * Uses the Google Geocoding service (client-side).
 */
export async function geocodeAddress(
    fullAddress: string
): Promise<{ lat: number; lng: number } | null> {
    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
        geocoder.geocode(
            { address: fullAddress, region: "in" },
            (results, status) => {
                if (
                    status === google.maps.GeocoderStatus.OK &&
                    results &&
                    results.length > 0
                ) {
                    const loc = results[0].geometry.location;
                    resolve({ lat: loc.lat(), lng: loc.lng() });
                } else {
                    resolve(null);
                }
            }
        );
    });
}

/** Extract address components from a Google Places result */
export function extractAddressComponents(place: google.maps.places.PlaceResult) {
    const get = (type: string) =>
        place.address_components?.find((c) => c.types.includes(type));

    return {
        address: place.formatted_address || "",
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
        lat: place.geometry?.location?.lat() ?? null,
        lng: place.geometry?.location?.lng() ?? null,
    };
}

/* ── Reverse Geocode Cache ── */

type ReverseGeocodeResult = {
    address: string;
    locality: string;
    city: string;
    pincode: string;
};

const CACHE_PREFIX = "nt_rgeo_";

/** Round to ~11m precision for cache key — close enough, saves repeat calls */
function coordsKey(lat: number, lng: number): string {
    return `${CACHE_PREFIX}${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function getCachedReverseGeocode(lat: number, lng: number): ReverseGeocodeResult | null {
    try {
        const raw = sessionStorage.getItem(coordsKey(lat, lng));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setCachedReverseGeocode(lat: number, lng: number, result: ReverseGeocodeResult) {
    try {
        sessionStorage.setItem(coordsKey(lat, lng), JSON.stringify(result));
    } catch {
        // sessionStorage full or unavailable — skip caching
    }
}

/**
 * Reverse geocode lat/lng → structured address.
 * Used by "Use My Location" to auto-fill address fields.
 * Results are cached in sessionStorage to prevent repeat billing.
 */
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<ReverseGeocodeResult | null> {
    // Check cache first — same coordinates in same session = free
    const cached = getCachedReverseGeocode(lat, lng);
    if (cached) return cached;

    await loadGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve) => {
        geocoder.geocode(
            { location: { lat, lng } },
            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (
                    status === google.maps.GeocoderStatus.OK &&
                    results &&
                    results.length > 0
                ) {
                    const result = results[0];
                    const get = (type: string) =>
                        result.address_components?.find((c) =>
                            c.types.includes(type)
                        );

                    const parsed: ReverseGeocodeResult = {
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
                    };

                    // Cache for this session
                    setCachedReverseGeocode(lat, lng, parsed);

                    resolve(parsed);
                } else {
                    resolve(null);
                }
            }
        );
    });
}
