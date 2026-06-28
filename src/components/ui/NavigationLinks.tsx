"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavLinkProps {
    href: string;
    icon: ReactNode;
    label: string;
    badge?: number;
}

export function NavLink({ href, icon, label, badge }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-base ${
                isActive
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
            }`}
        >
            <span className="relative">
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white shadow-sm">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </span>
            <span className="flex-1">{label}</span>
        </Link>
    );
}

export function MobileNavLink({ href, icon, label, badge }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 relative ${
                isActive ? "text-accent font-medium" : "text-text-secondary"
            }`}
        >
            <span className="relative">
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {badge > 9 ? "9+" : badge}
                    </span>
                )}
            </span>
            <span className="text-[10px]">{label}</span>
        </Link>
    );
}
