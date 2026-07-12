"use client";

import { useRouter } from "next/navigation";

export default function GoBackButton({ className }: { className?: string }) {
    const router = useRouter();

    const handleClick = () => {
        if (window.history.length > 1 && document.referrer) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={className}
            aria-label="Go back to the previous page"
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
                <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Go Back
        </button>
    );
}
