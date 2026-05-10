import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-bg-primary flex flex-col">
            {/* Minimal header */}
            <header className="px-6 py-5">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-lg font-bold text-text-primary"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-accent text-sm font-bold text-white">
                        T
                    </span>
                    <span className="font-serif">NextTutor</span>
                </Link>
            </header>

            {/* Centered content */}
            <main className="flex-1 flex items-center justify-center px-6 pb-16">
                <div className="w-full max-w-[420px]">{children}</div>
            </main>

            {/* Minimal footer */}
            <footer className="px-6 py-4 text-center text-xs text-text-tertiary">
                © {new Date().getFullYear()} NextTutor. All rights reserved.
            </footer>
        </div>
    );
}
