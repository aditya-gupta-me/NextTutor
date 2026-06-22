import Link from "next/link";

interface LegalSection {
    id: string;
    title: string;
    content: React.ReactNode;
}

interface LegalDocumentProps {
    title: string;
    lastUpdated: string;
    sections: LegalSection[];
}

/**
 * Wrapper component for legal pages (Privacy Policy, Terms of Service).
 * Renders a table of contents sidebar + content sections.
 * Includes a legal review banner at the top.
 */
export default function LegalDocument({ title, lastUpdated, sections }: LegalDocumentProps) {
    return (
        <div className="mx-auto max-w-[1200px] px-6 md:px-12 py-12 md:py-16">
            {/* Legal Review Banner */}
            <div className="rounded-[var(--radius-lg)] border border-warning/30 bg-warning-light px-5 py-4 mb-8">
                <div className="flex items-start gap-3">
                    <span className="text-warning text-lg shrink-0">⚠️</span>
                    <div>
                        <p className="text-sm font-semibold text-text-primary">
                            Legal Review Notice
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                            This document provides a general framework and may require professional
                            legal review and customization before production use. Sections marked
                            with an asterisk (*) may need business-specific adjustments.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[220px_1fr] items-start">
                {/* Table of Contents — sticky sidebar */}
                <nav className="hidden lg:block sticky top-24">
                    <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                        Contents
                    </h3>
                    <ul className="space-y-1.5">
                        {sections.map((section) => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className="block text-sm text-text-secondary hover:text-accent transition-base py-0.5"
                                >
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Document Content */}
                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-10">
                    <h1 className="font-serif text-2xl font-bold text-text-primary md:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm text-text-tertiary">
                        Last updated: {lastUpdated}
                    </p>
                    <hr className="border-border my-6" />

                    <div className="space-y-10">
                        {sections.map((section) => (
                            <section key={section.id} id={section.id} className="scroll-mt-24">
                                <h2 className="font-serif text-lg font-semibold text-text-primary mb-3">
                                    {section.title}
                                </h2>
                                <div className="text-sm leading-relaxed text-text-secondary space-y-3">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>

                    <hr className="border-border my-8" />
                    <div className="text-sm text-text-secondary">
                        <p>
                            If you have any questions about this document, please{" "}
                            <Link href="/contact" className="text-accent hover:underline">
                                contact us
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
