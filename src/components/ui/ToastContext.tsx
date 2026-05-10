"use client";

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";
import ToastContainer, { type ToastData, type ToastVariant } from "./Toast";

interface ToastAPI {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback(
        (variant: ToastVariant, message: string, duration?: number) => {
            const id = `toast-${++counter}-${Date.now()}`;
            setToasts((prev) => [...prev, { id, variant, message, duration }]);
        },
        []
    );

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    const api: ToastAPI = {
        success: (msg, dur) => addToast("success", msg, dur),
        error: (msg, dur) => addToast("error", msg, dur),
        warning: (msg, dur) => addToast("warning", msg, dur),
        info: (msg, dur) => addToast("info", msg, dur),
        dismiss,
        dismissAll,
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast(): ToastAPI {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a <ToastProvider>");
    }
    return ctx;
}
