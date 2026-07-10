"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

interface ServiceRadiusMapProps {
    lat: number | null;
    lng: number | null;
    radiusKm: number;
    tutorName?: string;
    editable?: boolean;
    onRadiusChange?: (km: number) => void;
    minRadius?: number;
    maxRadius?: number;
}

/**
 * Google Maps component showing a tutor's service radius as a circle overlay.
 * When `editable` is true, renders a slider to adjust the radius in real time.
 */
export default function ServiceRadiusMap({
    lat,
    lng,
    radiusKm,
    tutorName = "Tutor",
    editable = false,
    onRadiusChange,
    minRadius = 1,
    maxRadius = 15,
}: ServiceRadiusMapProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const circleRef = useRef<google.maps.Circle | null>(null);
    const [mapError, setMapError] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(editable); // editable mode loads immediately

    // Clamp and normalize radiusKm to ensure it's within bounds
    const normalizedRadiusKm = Math.max(minRadius, Math.min(maxRadius, radiusKm || minRadius));

    // Lazy-load: only load Maps when component is near the viewport (read-only mode)
    useEffect(() => {
        if (editable || isVisible) return; // skip for editable mode
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [editable, isVisible]);

    // Initialize map
    useEffect(() => {
        if (!isVisible || !mapRef.current || lat === null || lng === null) return;

        let cancelled = false;

        loadGoogleMaps()
            .then((maps) => {
                if (cancelled) return;

                const center = { lat, lng };
                const map = new maps.Map(mapRef.current!, {
                    center,
                    zoom: 14,
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    gestureHandling: editable ? "cooperative" : "greedy",
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                        },
                    ],
                });

                // Center marker
                new maps.Marker({
                    position: center,
                    map,
                    title: tutorName,
                    icon: {
                        path: maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#667eea",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 3,
                    },
                });

                // Service radius circle
                const circle = new maps.Circle({
                    map,
                    center,
                    radius: normalizedRadiusKm * 1000,
                    fillColor: "#667eea",
                    fillOpacity: 0.08,
                    strokeColor: "#667eea",
                    strokeOpacity: 0.3,
                    strokeWeight: 2,
                    clickable: false,
                });

                mapInstanceRef.current = map;
                circleRef.current = circle;

                // Fit bounds to circle
                fitBoundsToRadius(maps, map, lat, lng, normalizedRadiusKm);

                setMapLoaded(true);
            })
            .catch(() => {
                if (!cancelled) setMapError(true);
            });

        return () => {
            cancelled = true;
        };
    }, [isVisible, lat, lng]); // Re-init when visibility changes or coordinates change

    // Update circle radius when radiusKm changes (without re-creating map)
    useEffect(() => {
        if (!circleRef.current || !mapInstanceRef.current || !mapLoaded) return;
        if (lat === null || lng === null) return;

        circleRef.current.setRadius(normalizedRadiusKm * 1000);

        // Re-fit bounds smoothly
        if (typeof google !== "undefined") {
            fitBoundsToRadius(google.maps, mapInstanceRef.current, lat, lng, normalizedRadiusKm);
        }
    }, [normalizedRadiusKm, mapLoaded, lat, lng]);

    const handleSliderChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value);
            onRadiusChange?.(value);
        },
        [onRadiusChange]
    );

    const hasLocation = lat !== null && lng !== null;

    // No location state
    if (!hasLocation) {
        return (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-border bg-bg-secondary p-8 text-center">
                <i className="bx bx-map text-3xl text-text-tertiary mb-2 block" />
                <p className="text-sm font-medium text-text-primary mb-1">
                    No location set
                </p>
                <p className="text-xs text-text-tertiary">
                    {editable
                        ? "Set your address above to see your service area on the map."
                        : "Set your address to see the service area."}
                </p>
                {editable && (
                    <div className="mt-4 opacity-50 pointer-events-none">
                        <SliderUI
                            value={normalizedRadiusKm}
                            min={minRadius}
                            max={maxRadius}
                            disabled
                            onChange={() => {}}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Map error state
    if (mapError) {
        return (
            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-secondary p-8 text-center">
                <i className="bx bx-map text-3xl text-text-tertiary mb-2 block" />
                <p className="text-sm text-text-secondary">Map unavailable</p>
            </div>
        );
    }

    return (
        <div ref={sentinelRef} className="rounded-[var(--radius-xl)] border border-border overflow-hidden">
            {/* Map — or placeholder until visible */}
            {isVisible ? (
                <div ref={mapRef} className="w-full h-[260px] md:h-[320px]" />
            ) : (
                <div className="w-full h-[260px] md:h-[320px] bg-bg-secondary animate-pulse flex items-center justify-center">
                    <div className="text-center">
                        <i className="bx bx-map text-2xl text-text-tertiary mb-1 block" />
                        <span className="text-xs text-text-tertiary">Loading map…</span>
                    </div>
                </div>
            )}

            {/* Footer bar */}
            <div className="bg-bg-white border-t border-border px-4 py-3">
                {editable ? (
                    <SliderUI
                        value={normalizedRadiusKm}
                        min={minRadius}
                        max={maxRadius}
                        onChange={handleSliderChange}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <i className="bx bx-target-lock text-accent text-sm" />
                        <span className="text-xs text-text-secondary">
                            Service area: {normalizedRadiusKm} km radius
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Slider sub-component ── */

function SliderUI({
    value,
    min,
    max,
    disabled = false,
    onChange,
}: {
    value: number;
    min: number;
    max: number;
    disabled?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    // Calculate fill percentage for the track gradient
    const percent = ((value - min) / (max - min)) * 100;

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label htmlFor="service-radius-slider" className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <i className="bx bx-target-lock text-accent text-sm" />
                    Service Radius
                </label>
                <span className="text-sm font-bold text-accent tabular-nums">
                    {value} km
                </span>
            </div>
            <input
                id="service-radius-slider"
                type="range"
                min={min}
                max={max}
                step={1}
                value={value}
                disabled={disabled}
                onChange={onChange}
                className="w-full h-2 rounded-[var(--radius-full)] appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-accent
                    [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white
                    [&::-webkit-slider-thumb]:shadow-[var(--shadow-sm)]
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-accent
                    [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white
                    [&::-moz-range-thumb]:shadow-[var(--shadow-sm)]
                    [&::-moz-range-thumb]:cursor-pointer"
                style={{
                    background: disabled
                        ? "var(--bg-tertiary)"
                        : `linear-gradient(to right, var(--accent) 0%, var(--accent) ${percent}%, var(--bg-tertiary) ${percent}%, var(--bg-tertiary) 100%)`,
                }}
            />
            <div className="flex justify-between mt-1">
                <span className="text-[10px] text-text-tertiary">{min} km</span>
                <span className="text-[10px] text-text-tertiary">{max} km</span>
            </div>
        </div>
    );
}

/* ── Helpers ── */

function fitBoundsToRadius(
    maps: typeof google.maps,
    map: google.maps.Map,
    lat: number,
    lng: number,
    radiusKm: number
) {
    const bounds = new maps.LatLngBounds();
    const latDelta = radiusKm / 111.32;
    const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    bounds.extend({ lat: lat - latDelta, lng: lng - lngDelta });
    bounds.extend({ lat: lat + latDelta, lng: lng + lngDelta });
    map.fitBounds(bounds, 40);
}
