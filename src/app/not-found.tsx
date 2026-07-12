import Link from "next/link";
import { Metadata } from "next";
import GoBackButton from "@/components/ui/GoBackButton";

export const metadata: Metadata = {
    title: "404 - Page Not Found | NextTutor",
    description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center">
            {/* Visual Element */}
            <div className="relative mb-8 flex justify-center items-center">
                <h1 className="font-serif text-[120px] leading-none md:text-[180px] font-bold text-accent opacity-10 select-none">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span 
                        className="text-6xl md:text-7xl transition-transform duration-700 hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100" 
                        aria-hidden="true"
                    >
                        🧭
                    </span>
                </div>
            </div>

            {/* Content */}
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Lost your way?
            </h2>
            <p className="max-w-md text-text-secondary mb-10 leading-relaxed text-base md:text-lg">
                We couldn&apos;t find the page you&apos;re looking for. It might have been removed, renamed, or is temporarily unavailable.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                <GoBackButton className="flex w-full sm:w-auto items-center justify-center rounded-[var(--radius-md)] border border-border bg-bg-white px-6 py-3 text-sm font-medium text-text-primary transition-base hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary shadow-[var(--shadow-xs)] cursor-pointer" />
                
                <Link
                    href="/"
                    className="flex w-full sm:w-auto items-center justify-center rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-medium text-white transition-base hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary shadow-sm cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                        aria-hidden="true"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Return Home
                </Link>

                <Link
                    href="/contact"
                    className="flex w-full sm:w-auto items-center justify-center rounded-[var(--radius-md)] border border-transparent px-6 py-3 text-sm font-medium text-text-secondary transition-base hover:text-text-primary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 focus:ring-offset-bg-primary cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                        aria-hidden="true"
                    >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Contact Support
                </Link>
            </div>
        </div>
    );
}
