"use client";

import { useEffect, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastData {
    id: string;
    variant: ToastVariant;
    message: string;
    duration?: number; // ms, default 4000
}

const VARIANT_CONFIG: Record<
    ToastVariant,
    { icon: string; stripe: string; bg: string; text: string; progress: string }
> = {
    success: {
        icon: "✓",
        stripe: "bg-success",
        bg: "bg-success-light",
        text: "text-success",
        progress: "bg-success",
    },
    error: {
        icon: "✕",
        stripe: "bg-error",
        bg: "bg-error-light",
        text: "text-error",
        progress: "bg-error",
    },
    warning: {
        icon: "⚠",
        stripe: "bg-warning",
        bg: "bg-warning-light",
        text: "text-warning",
        progress: "bg-warning",
    },
    info: {
        icon: "ℹ",
        stripe: "bg-accent",
        bg: "bg-accent-light",
        text: "text-accent",
        progress: "bg-accent",
    },
};

/* ── Single Toast ── */
function ToastItem({
    toast,
    index,
    onDismiss,
}: {
    toast: ToastData;
    index: number;
    onDismiss: (id: string) => void;
}) {
    const cfg = VARIANT_CONFIG[toast.variant];
    const duration = toast.duration ?? 4000;
    const [exiting, setExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const startRef = useRef(Date.now());
    const rafRef = useRef<number>(0);

    // Countdown progress bar
    useEffect(() => {
        const tick = () => {
            const elapsed = Date.now() - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining <= 0) {
                dismiss();
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [duration]);

    const dismiss = () => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 280);
    };

    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{
                transform: `translateY(-${index * 4}px) scale(${1 - index * 0.02})`,
                zIndex: 50 - index,
                opacity: exiting ? 0 : 1,
                animationName: exiting ? "toast-exit" : "toast-enter",
                animationDuration: exiting ? "280ms" : "320ms",
                animationTimingFunction: exiting
                    ? "ease-in"
                    : "cubic-bezier(0.34, 1.56, 0.64, 1)",
                animationFillMode: exiting ? "forwards" : "both",
                animationDelay: exiting ? "0ms" : `${index * 60}ms`,
            }}
            className="pointer-events-auto relative flex w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-white shadow-[var(--shadow-md)]"
        >
            {/* Left color stripe */}
            <div className={`w-[4px] shrink-0 ${cfg.stripe}`} />

            {/* Content */}
            <div className="flex flex-1 items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${cfg.stripe}`}
                >
                    {cfg.icon}
                </span>

                {/* Message */}
                <p className="flex-1 text-sm font-medium text-text-primary leading-snug pt-0.5">
                    {toast.message}
                </p>

                {/* Dismiss */}
                <button
                    onClick={dismiss}
                    className="shrink-0 mt-0.5 text-text-tertiary hover:text-text-primary transition-base text-sm leading-none"
                    aria-label="Dismiss"
                >
                    ×
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-[4px] right-0 h-[2px] bg-bg-tertiary">
                <div
                    className={`h-full ${cfg.progress} transition-none`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

/* ── Toast Container ── */
export default function ToastContainer({
    toasts,
    onDismiss,
}: {
    toasts: ToastData[];
    onDismiss: (id: string) => void;
}) {
    if (toasts.length === 0) return null;

    // Show max 5, most recent on top
    const visible = toasts.slice(-5).reverse();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse items-end gap-3 pointer-events-none">
            {visible.map((t, i) => (
                <ToastItem
                    key={t.id}
                    toast={t}
                    index={i}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
}
