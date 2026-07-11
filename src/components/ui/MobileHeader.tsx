"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Cog, LoaderLinesAlt, Power } from "@boxicons/react";

interface MobileHeaderProps {
    avatarUrl: string | null;
    name: string;
    initials: string;
    role: string;
}

export default function MobileHeader({ avatarUrl, name, initials, role }: MobileHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            setLoggingOut(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-white shrink-0 relative z-30">
            {/* Logo */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-base font-bold text-text-primary"
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-xs font-bold text-white">
                    T
                </span>
                <span className="font-serif">NextTutor</span>
            </Link>

            {/* Avatar Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-base hover:opacity-90 cursor-pointer"
                >
                    {avatarUrl ? (
                        <Image src={avatarUrl} alt={`${name} avatar`} width={32} height={32} className="h-full w-full object-cover" />
                    ) : (
                        initials
                    )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-bg-white p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* User Summary Info */}
                        <div className="px-3 py-2.5 border-b border-border mb-1.5">
                            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Logged in as</p>
                            <p className="text-sm font-semibold text-text-primary truncate mt-0.5">{name}</p>
                            <p className="text-[10px] text-accent font-medium uppercase mt-0.5 bg-accent-light px-1.5 py-0.5 rounded-full inline-block">
                                {role}
                            </p>
                        </div>

                        {/* Menu Options */}
                        <div className="space-y-0.5">
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary transition-base hover:bg-bg-secondary hover:text-text-primary"
                            >
                                <User size="xs" className="text-text-tertiary" />
                                My Profile
                            </Link>

                            <Link
                                href="/settings"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-text-secondary transition-base hover:bg-bg-secondary hover:text-text-primary"
                            >
                                <Cog size="xs" className="text-text-tertiary" />
                                Settings
                            </Link>
                        </div>

                        <hr className="border-border my-1.5" />

                        {/* Logout Option */}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-base hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loggingOut ? (
                                <>
                                    <LoaderLinesAlt size="xs" className="animate-spin" />
                                    Logging out...
                                </>
                            ) : (
                                <>
                                    <Power size="xs" />
                                    Log Out
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
