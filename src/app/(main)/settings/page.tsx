"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [tutorProfileId, setTutorProfileId] = useState<string | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userProfile } = await supabase
                .from("users")
                .select("role")
                .eq("id", user.id)
                .single();

            if (userProfile?.role === "tutor") {
                setRole("tutor");
                const { data: tutorProfile } = await supabase
                    .from("tutor_profiles")
                    .select("id, show_analytics")
                    .eq("user_id", user.id)
                    .single();
                
                if (tutorProfile) {
                    setTutorProfileId(tutorProfile.id);
                    setShowAnalytics(tutorProfile.show_analytics !== false);
                }
            }
        };
        fetchSettings();
    }, []);

    const handleToggleAnalytics = async () => {
        if (!tutorProfileId || updating) return;
        setUpdating(true);
        const newValue = !showAnalytics;
        setShowAnalytics(newValue);
        
        const supabase = createClient();
        const { error } = await supabase
            .from("tutor_profiles")
            .update({ show_analytics: newValue })
            .eq("id", tutorProfileId);
            
        if (error) {
            setShowAnalytics(!newValue);
            console.error("Failed to update settings", error);
        }
        setUpdating(false);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    return (
        <div className="px-6 py-8 md:px-10 md:py-10 max-w-[720px]">
            <div className="mb-8">
                <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                    Settings
                </h1>
                <p className="mt-1 text-text-secondary">
                    Manage your account settings.
                </p>
            </div>

            <div className="space-y-6">
                {/* Account section */}
                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">
                        Account
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3 border-b border-border">
                            <div>
                                <div className="text-sm font-medium text-text-primary">
                                    Edit Profile
                                </div>
                                <div className="text-xs text-text-secondary">
                                    Update your details and preferences
                                </div>
                            </div>
                            <a
                                href="/profile/edit"
                                className="text-sm text-accent font-medium hover:underline"
                            >
                                Edit →
                            </a>
                        </div>

                        <div className="flex items-center justify-between py-3">
                            <div>
                                <div className="text-sm font-medium text-text-primary">
                                    Notifications
                                </div>
                                <div className="text-xs text-text-secondary">
                                    Email notifications for sessions and payments
                                </div>
                            </div>
                            <span className="text-xs text-text-tertiary">Coming soon</span>
                        </div>
                    </div>
                </div>

                {/* Privacy section (Tutors Only) */}
                {role === "tutor" && (
                    <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">
                            Privacy Controls
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <div className="text-sm font-medium text-text-primary">
                                        Show Activity Indicator on Public Profile
                                    </div>
                                    <div className="text-xs text-text-secondary mt-1">
                                        When enabled, students will see a trend graph of your profile views and a recently updated badge. No exact numbers are shown.
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleAnalytics}
                                    disabled={updating}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${showAnalytics ? 'bg-accent' : 'bg-bg-tertiary'}`}
                                    role="switch"
                                    aria-checked={showAnalytics}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showAnalytics ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Danger zone */}
                <div className="rounded-[var(--radius-xl)] border border-error/20 bg-bg-white p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-4">
                        Danger Zone
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-text-primary">
                                Log out
                            </div>
                            <div className="text-xs text-text-secondary">
                                Sign out of your account on this device
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="rounded-[var(--radius-md)] border border-error/30 px-4 py-2 text-sm font-medium text-error transition-base hover:bg-error-light disabled:opacity-50 cursor-pointer"
                        >
                            {loggingOut ? "Logging out..." : "Log out"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
