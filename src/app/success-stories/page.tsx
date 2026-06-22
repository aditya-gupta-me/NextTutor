import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PageHero from "@/components/ui/PageHero";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: "Success Stories — NextTutor",
    description:
        "Read real success stories from NextTutor's community of students, parents, and tutors. Discover how NextTutor is making a difference.",
};

export default async function SuccessStoriesPage() {
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
                    title="Success Stories"
                    subtitle="Real stories from real people. See how NextTutor is helping students learn and tutors grow."
                    breadcrumb="Success Stories"
                />

                {/* Coming Soon State */}
                <section className="bg-bg-primary py-20 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="mx-auto max-w-2xl">
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-10 md:p-14 text-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-light text-4xl mx-auto mb-6">
                                    📖
                                </div>
                                <h2 className="font-serif text-2xl font-bold text-text-primary mb-3">
                                    Stories Coming Soon
                                </h2>
                                <p className="text-sm leading-relaxed text-text-secondary max-w-md mx-auto mb-2">
                                    We&apos;re collecting stories from our community — real
                                    experiences from students who found the right tutor, and tutors
                                    who grew their teaching practice through NextTutor.
                                </p>
                                <p className="text-sm leading-relaxed text-text-secondary max-w-md mx-auto">
                                    No invented testimonials. When our first stories are ready,
                                    they&apos;ll appear right here.
                                </p>
                            </div>
                        </div>

                        {/* Future Content Slots (empty grid for when stories are added) */}
                        <div className="mt-16">
                            <div className="mx-auto max-w-xl text-center mb-10">
                                <h2 className="font-serif text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                                    What to Expect
                                </h2>
                                <p className="mt-3 text-text-secondary">
                                    Here&apos;s what we&apos;re working on sharing with you.
                                </p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-3 stagger-children">
                                {[
                                    {
                                        icon: "🎓",
                                        title: "Student Journeys",
                                        desc: "How students found the right tutor and improved their learning outcomes.",
                                    },
                                    {
                                        icon: "👨‍🏫",
                                        title: "Tutor Spotlights",
                                        desc: "Profiles of tutors who are making a real difference in their students' lives.",
                                    },
                                    {
                                        icon: "📊",
                                        title: "Platform Milestones",
                                        desc: "Key achievements and growth of the NextTutor community.",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-[var(--radius-xl)] border border-dashed border-border bg-bg-white/60 p-8 text-center"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-bg-secondary text-xl mx-auto mb-4">
                                            {item.icon}
                                        </div>
                                        <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-text-tertiary">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-bg-secondary py-24 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12 text-center">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                            Want to share your story?
                        </h2>
                        <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto">
                            If NextTutor has made a difference for you — as a student, parent, or
                            tutor — we&apos;d love to hear about it.
                        </p>
                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <Link
                                href="/contact"
                                className="w-full rounded-[var(--radius-full)] bg-accent px-8 py-3.5 text-center text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)] sm:w-auto"
                            >
                                Share Your Story
                            </Link>
                            <Link
                                href="/tutors"
                                className="w-full rounded-[var(--radius-full)] border border-border bg-bg-white px-8 py-3.5 text-center text-base font-medium text-text-primary shadow-[var(--shadow-xs)] transition-base hover:bg-bg-secondary sm:w-auto"
                            >
                                Find a Tutor
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
