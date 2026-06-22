"use client";

import { useState } from "react";

export interface FaqItem {
    question: string;
    answer: string;
}

interface FaqAccordionProps {
    items: FaqItem[];
}

/**
 * Collapsible FAQ accordion component.
 * Each item expands/collapses on click with a smooth transition.
 */
export default function FaqAccordion({ items }: FaqAccordionProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                    <div
                        key={index}
                        className="rounded-[var(--radius-lg)] border border-border bg-bg-white overflow-hidden transition-base"
                    >
                        <button
                            onClick={() => toggle(index)}
                            className="flex w-full items-center justify-between px-6 py-4 text-left cursor-pointer group"
                            aria-expanded={isOpen}
                        >
                            <span className="text-sm font-semibold text-text-primary pr-4 group-hover:text-accent transition-base">
                                {item.question}
                            </span>
                            <span
                                className={`shrink-0 text-text-tertiary transition-transform duration-200 ${
                                    isOpen ? "rotate-180" : ""
                                }`}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                        d="M4 6l4 4 4-4"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </button>
                        <div
                            className={`grid transition-all duration-200 ease-out ${
                                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            }`}
                        >
                            <div className="overflow-hidden">
                                <div className="px-6 pb-4 text-sm leading-relaxed text-text-secondary">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
