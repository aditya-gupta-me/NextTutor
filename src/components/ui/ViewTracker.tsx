"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Invisible component that records a profile view on mount.
 * Fires once per page load (fire-and-forget).
 * Renders nothing.
 */
export default function ViewTracker({ tutorProfileId }: { tutorProfileId: string }) {
    useEffect(() => {
        const track = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };

                if (session?.access_token) {
                    headers["Authorization"] = `Bearer ${session.access_token}`;
                }

                await fetch("/api/track-view", {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ tutorProfileId }),
                });
            } catch {
                // Fire-and-forget — never block or error
            }
        };

        track();
    }, [tutorProfileId]);

    return null;
}
