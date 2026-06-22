import Link from "next/link";

interface PageHeroProps {
    title: string;
    subtitle: string;
    /** Optional breadcrumb label, e.g. "About Us". If provided, breadcrumb renders as Home / label */
    breadcrumb?: string;
}

/**
 * Reusable hero section for static pages.
 * Matches the homepage hero-gradient style with centered text.
 */
export default function PageHero({ title, subtitle, breadcrumb }: PageHeroProps) {
    return (
        <section className="hero-gradient pt-32 pb-16 md:pt-40 md:pb-20">
            <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                {breadcrumb && (
                    <div className="mb-6 flex items-center justify-center gap-2 text-sm text-text-tertiary animate-fade-in-up">
                        <Link href="/" className="hover:text-text-secondary transition-base">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-text-secondary">{breadcrumb}</span>
                    </div>
                )}
                <div className="mx-auto max-w-2xl text-center">
                    <h1 className="font-serif text-4xl font-bold leading-[1.12] tracking-tight text-text-primary md:text-5xl animate-fade-in-up">
                        {title}
                    </h1>
                    <p className="mt-5 text-lg leading-relaxed text-text-secondary animate-fade-in-up">
                        {subtitle}
                    </p>
                </div>
            </div>
        </section>
    );
}
