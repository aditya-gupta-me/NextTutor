"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import { BoxIcon } from "@/components/ui/BoxIcon";

interface TutorMapProps {
    lat: number;
    lng: number;
    radiusKm: number;
    tutorName: string;
}

export default function TutorMap({ lat, lng, radiusKm, tutorName }: TutorMapProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [mapError, setMapError] = useState(false);

    // Lazy-load: only start loading Maps when the component is near the viewport
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" } // Start loading 200px before visible
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Initialize map once visible
    useEffect(() => {
        if (!isVisible || !mapRef.current) return;

        loadGoogleMaps()
            .then((maps) => {
                const center = { lat, lng };
                const map = new maps.Map(mapRef.current!, {
                    center,
                    zoom: 14,
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }],
                        },
                    ],
                });

                // Marker
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
                new maps.Circle({
                    map,
                    center,
                    radius: radiusKm * 1000, // metres
                    fillColor: "#667eea",
                    fillOpacity: 0.08,
                    strokeColor: "#667eea",
                    strokeOpacity: 0.3,
                    strokeWeight: 2,
                });

                // Fit bounds to circle
                const bounds = new maps.LatLngBounds();
                // Approximate bounds from radius
                const latDelta = (radiusKm / 111.32);
                const lngDelta = (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180)));
                bounds.extend({ lat: lat - latDelta, lng: lng - lngDelta });
                bounds.extend({ lat: lat + latDelta, lng: lng + lngDelta });
                map.fitBounds(bounds, 40);
            })
            .catch(() => {
                setMapError(true);
            });
    }, [isVisible, lat, lng, radiusKm, tutorName]);

    if (mapError) {
        return (
            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-secondary p-8 text-center">
                <BoxIcon className="bx bx-map text-3xl text-text-tertiary mb-2" />
                <p className="text-sm text-text-secondary">Map unavailable</p>
            </div>
        );
    }

    return (
        <div ref={sentinelRef} className="rounded-[var(--radius-xl)] border border-border overflow-hidden">
            {isVisible ? (
                <div ref={mapRef} className="w-full h-[300px] md:h-[360px]" />
            ) : (
                /* Placeholder skeleton shown until component enters viewport */
                <div className="w-full h-[300px] md:h-[360px] bg-bg-secondary animate-pulse flex items-center justify-center">
                    <div className="text-center">
                        <BoxIcon className="bx bx-map text-2xl text-text-tertiary mb-1 block" />
                        <span className="text-xs text-text-tertiary">Loading map…</span>
                    </div>
                </div>
            )}
            <div className="bg-bg-white px-4 py-2.5 border-t border-border flex items-center gap-2">
                <BoxIcon className="bx bx-target-lock text-accent text-sm" />
                <span className="text-xs text-text-secondary">
                    Service area: {radiusKm} km radius
                </span>
            </div>
        </div>
    );
}
