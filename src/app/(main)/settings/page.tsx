"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

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
                            className="rounded-[var(--radius-md)] border border-error/30 px-4 py-2 text-sm font-medium text-error transition-base hover:bg-error-light disabled:opacity-50"
                        >
                            {loggingOut ? "Logging out..." : "Log out"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
