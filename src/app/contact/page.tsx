import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PageHero from "@/components/ui/PageHero";
import { createClient } from "@/lib/supabase/server";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us — NextTutor",
    description:
        "Get in touch with the NextTutor team. Whether you have a question, need support, or want to share feedback — we're here to help.",
};

export default async function ContactPage() {
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
                    title="Get in Touch"
                    subtitle="Have a question, suggestion, or need help? We'd love to hear from you."
                    breadcrumb="Contact Us"
                />

                {/* Contact Content */}
                <section className="bg-bg-primary py-20 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
                            {/* Left — Contact Form */}
                            <ContactForm />

                            {/* Right — Info Sidebar */}
                            <div className="space-y-6">
                                {/* Email */}
                                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-light text-lg">
                                            ✉️
                                        </div>
                                        <h3 className="text-sm font-semibold text-text-primary">
                                            Email Us
                                        </h3>
                                    </div>
                                    <a
                                        href="mailto:noreply.nexttutor@gmail.com"
                                        className="text-sm text-accent hover:underline"
                                    >
                                        noreply.nexttutor@gmail.com
                                    </a>
                                    <p className="mt-1 text-xs text-text-tertiary">
                                        We typically respond within 24 hours.
                                    </p>
                                </div>

                                {/* Support Hours */}
                                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-success-light text-lg">
                                            🕐
                                        </div>
                                        <h3 className="text-sm font-semibold text-text-primary">
                                            Support Hours
                                        </h3>
                                    </div>
                                    <div className="space-y-1.5 text-sm text-text-secondary">
                                        <div className="flex justify-between">
                                            <span>Monday – Saturday</span>
                                            <span className="font-medium text-text-primary">
                                                11 AM – 5 PM IST
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sunday</span>
                                            <span className="text-text-tertiary">Closed</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Links */}
                                <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-warning-light text-lg">
                                            💡
                                        </div>
                                        <h3 className="text-sm font-semibold text-text-primary">
                                            Quick Links
                                        </h3>
                                    </div>
                                    <ul className="space-y-2">
                                        <li>
                                            <Link
                                                href="/faqs"
                                                className="text-sm text-text-secondary hover:text-accent transition-base"
                                            >
                                                → Browse FAQs
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/tutors"
                                                className="text-sm text-text-secondary hover:text-accent transition-base"
                                            >
                                                → Find a Tutor
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                href="/about"
                                                className="text-sm text-text-secondary hover:text-accent transition-base"
                                            >
                                                → About NextTutor
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-bg-secondary py-20 md:py-24">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12 text-center">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                            Looking for instant answers?
                        </h2>
                        <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto">
                            Check our FAQs — most questions are already answered there.
                        </p>
                        <div className="mt-8">
                            <Link
                                href="/faqs"
                                className="inline-block rounded-[var(--radius-full)] bg-accent px-8 py-3.5 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)]"
                            >
                                Browse FAQs
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
