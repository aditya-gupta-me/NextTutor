"use client";

import { useState } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface InlineAlertProps {
    variant: AlertVariant;
    message: string;
    dismissible?: boolean;
    className?: string;
}

const VARIANT_CONFIG: Record<
    AlertVariant,
    { icon: string; stripe: string; iconBg: string; text: string; bg: string; border: string }
> = {
    success: {
        icon: "✓",
        stripe: "bg-success",
        iconBg: "bg-success",
        text: "text-success",
        bg: "bg-success-light",
        border: "border-success/15",
    },
    error: {
        icon: "✕",
        stripe: "bg-error",
        iconBg: "bg-error",
        text: "text-error",
        bg: "bg-error-light",
        border: "border-error/15",
    },
    warning: {
        icon: "⚠",
        stripe: "bg-warning",
        iconBg: "bg-warning",
        text: "text-warning",
        bg: "bg-warning-light",
        border: "border-warning/15",
    },
    info: {
        icon: "ℹ",
        stripe: "bg-accent",
        iconBg: "bg-accent",
        text: "text-accent",
        bg: "bg-accent-light",
        border: "border-accent/15",
    },
};

export default function InlineAlert({
    variant,
    message,
    dismissible = false,
    className = "",
}: InlineAlertProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const cfg = VARIANT_CONFIG[variant];

    return (
        <div
            role="alert"
            className={`flex overflow-hidden rounded-[var(--radius-md)] border ${cfg.border} ${cfg.bg} animate-fade-in-up ${className}`}
        >
            {/* Left stripe */}
            <div className={`w-[3px] shrink-0 ${cfg.stripe}`} />

            {/* Content */}
            <div className="flex flex-1 items-center gap-2.5 px-3.5 py-2.5">
                <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${cfg.iconBg}`}
                >
                    {cfg.icon}
                </span>
                <p className={`flex-1 text-sm font-medium ${cfg.text}`}>
                    {message}
                </p>
                {dismissible && (
                    <button
                        onClick={() => setDismissed(true)}
                        className={`shrink-0 text-sm ${cfg.text} opacity-60 hover:opacity-100 transition-base`}
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
