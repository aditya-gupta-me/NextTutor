import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PageHero from "@/components/ui/PageHero";
import { createClient } from "@/lib/supabase/server";
import FaqContent from "./FaqContent";

export const metadata: Metadata = {
    title: "FAQs — NextTutor",
    description:
        "Find answers to common questions about NextTutor — how to find tutors, create a profile, book sessions, manage payments, and more.",
};

export default async function FaqsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const isLoggedIn = !!user;

    return (
        <>
            <Navbar isLoggedIn={isLoggedIn} />

            <main>
                <PageHero
                    title="Frequently Asked Questions"
                    subtitle="Everything you need to know about using NextTutor. Can't find your answer? Reach out to us."
                    breadcrumb="FAQs"
                />

                {/* FAQ Content */}
                <section className="bg-bg-primary py-20 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <FaqContent />
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-bg-secondary py-20 md:py-24">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12 text-center">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                            Still have questions?
                        </h2>
                        <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto">
                            We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
                        </p>
                        <div className="mt-8">
                            <Link
                                href="/contact"
                                className="inline-block rounded-[var(--radius-full)] bg-accent px-8 py-3.5 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)]"
                            >
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
