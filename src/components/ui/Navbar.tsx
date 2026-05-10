"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="glass-nav fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-12">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                        T
                    </div>
                    <span className="text-lg font-semibold text-text-primary tracking-tight">
                        NextTutor
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden items-center gap-8 md:flex">
                    <Link
                        href="#features"
                        className="text-sm font-medium text-text-secondary transition-base hover:text-text-primary"
                    >
                        Features
                    </Link>
                    <Link
                        href="#how-it-works"
                        className="text-sm font-medium text-text-secondary transition-base hover:text-text-primary"
                    >
                        How It Works
                    </Link>
                    <Link
                        href="#for-tutors"
                        className="text-sm font-medium text-text-secondary transition-base hover:text-text-primary"
                    >
                        For Tutors
                    </Link>
                </div>

                {/* Desktop CTA */}
                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/continue"
                        className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-text-secondary transition-base hover:bg-bg-tertiary hover:text-text-primary"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/continue"
                        className="rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-sm)]"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    className="flex flex-col gap-[5px] md:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span
                        className={`block h-[2px] w-5 bg-text-primary transition-base origin-center ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""
                            }`}
                    />
                    <span
                        className={`block h-[2px] w-5 bg-text-primary transition-base ${mobileOpen ? "opacity-0" : ""
                            }`}
                    />
                    <span
                        className={`block h-[2px] w-5 bg-text-primary transition-base origin-center ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""
                            }`}
                    />
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-border bg-bg-primary px-6 py-4 md:hidden animate-fade-in-up">
                    <div className="flex flex-col gap-3">
                        <Link
                            href="#features"
                            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-text-secondary transition-base hover:bg-bg-tertiary"
                            onClick={() => setMobileOpen(false)}
                        >
                            Features
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-text-secondary transition-base hover:bg-bg-tertiary"
                            onClick={() => setMobileOpen(false)}
                        >
                            How It Works
                        </Link>
                        <Link
                            href="#for-tutors"
                            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-text-secondary transition-base hover:bg-bg-tertiary"
                            onClick={() => setMobileOpen(false)}
                        >
                            For Tutors
                        </Link>
                        <hr className="border-border" />
                        <Link
                            href="/continue"
                            className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-text-secondary transition-base hover:bg-bg-tertiary"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/continue"
                            className="rounded-[var(--radius-md)] bg-accent px-3 py-2 text-center text-sm font-medium text-white transition-base hover:bg-accent-hover"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
