/**
 * Google Maps script loader & geocoding utility.
 * Uses a singleton to ensure the script is only loaded once.
 */

let googleMapsPromise: Promise<typeof google.maps> | null = null;

/** Load Google Maps JS API (returns the google.maps namespace) */
export function loadGoogleMaps(): Promise<typeof google.maps> {
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise((resolve, reject) => {
        // Already loaded?
        if (typeof google !== "undefined" && google.maps) {
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
                    resolve(google.maps);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        };
        script.onerror = () => reject(new Error("Failed to load Google Maps script"));
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

/**
 * Reverse geocode lat/lng → structured address.
 * Used by "Use My Location" to auto-fill address fields.
 */
export async function reverseGeocode(
    lat: number,
    lng: number
): Promise<{
    address: string;
    locality: string;
    city: string;
    pincode: string;
} | null> {
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

                    resolve({
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
                } else {
                    resolve(null);
                }
            }
        );
    });
}
