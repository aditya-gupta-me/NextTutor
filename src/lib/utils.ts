import { type ClassValue, clsx } from "clsx";

/**
 * Merge class names. Lightweight alternative to cn() since we're not using
 * tailwind-merge (keeping deps minimal).
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/** Generate URL-friendly slug from name + subject + city */
export function generateSlug(name: string, subject: string, city: string): string {
    const raw = `${name}-${subject}-${city}`;
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/** Format Indian currency */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Format relative time ("2 days ago", "just now") */
export function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Truncate text with ellipsis */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length).trimEnd() + "…";
}
