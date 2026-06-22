import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PageHero from "@/components/ui/PageHero";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: "About Us — NextTutor",
    description:
        "Learn about NextTutor's mission to connect students with trusted, verified private tutors in their neighbourhood. Our story, values, and vision.",
};

export default async function AboutPage() {
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
                    title="About NextTutor"
                    subtitle="We're building a better way for students and tutors to find each other — no WhatsApp groups, no guesswork, no awkward conversations."
                    breadcrumb="About Us"
                />

                {/* ========== MISSION & VISION ========== */}
                <section className="bg-bg-primary py-20 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Mission */}
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8 md:p-10">
                                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent-light text-xl mb-5">
                                    🎯
                                </div>
                                <h2 className="font-serif text-2xl font-bold text-text-primary mb-3">
                                    Our Mission
                                </h2>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    To make finding a great tutor as simple as searching online — 
                                    transparent, trustworthy, and accessible to every family. We believe 
                                    every student deserves access to quality education, and every tutor 
                                    deserves a professional platform to showcase their skills.
                                </p>
                            </div>

                            {/* Vision */}
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8 md:p-10">
                                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-success-light text-xl mb-5">
                                    🌱
                                </div>
                                <h2 className="font-serif text-2xl font-bold text-text-primary mb-3">
                                    Our Vision
                                </h2>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    A world where choosing a tutor feels as natural as choosing a 
                                    restaurant — browse real reviews, compare profiles, and make a 
                                    confident decision. Starting with Delhi, Noida, Uttar Pradesh, and 
                                    West Bengal, and growing city by city across India.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== OUR STORY ========== */}
                <section className="bg-bg-secondary py-20 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="mx-auto max-w-3xl">
                            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15] text-center mb-10">
                                Our Story
                            </h2>
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8 md:p-10">
                                <div className="space-y-5 text-sm leading-relaxed text-text-secondary">
                                    <p>
                                        It started with a familiar problem. A parent in Noida needed a 
                                        math tutor for their daughter. They posted in three WhatsApp groups, 
                                        got twelve replies, called seven people, met four, and finally 
                                        settled on one — only to find out after two weeks that it wasn&apos;t 
                                        the right fit. The whole process took a month.
                                    </p>
                                    <p>
                                        On the other side, a qualified tutor in the same neighbourhood was 
                                        struggling to find students. No website, no online presence — just 
                                        word-of-mouth and hand-printed pamphlets that got lost in the stack 
                                        of flyers at the local shop.
                                    </p>
                                    <p>
                                        We thought: why is this so hard? You can find a restaurant, a 
                                        plumber, even a dog walker online in seconds. But finding a trusted 
                                        tutor for your child? That still relies on asking ten people and 
                                        hoping for the best.
                                    </p>
                                    <p className="font-medium text-text-primary">
                                        NextTutor was built to fix that. A simple platform where tutors 
                                        get a professional, shareable profile — and students get transparent 
                                        information to make the right choice. No commissions, no middlemen, 
                                        no games.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== WHY CHOOSE US ========== */}
                <section className="bg-bg-primary py-20 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="mx-auto max-w-xl text-center mb-14">
                            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                                Why Choose NextTutor
                            </h2>
                            <p className="mt-4 text-lg text-text-secondary">
                                Built different — because you deserve better than a WhatsApp forward.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 stagger-children">
                            {[
                                {
                                    icon: "✅",
                                    title: "Verified Tutors",
                                    desc: "Every tutor goes through a verification process. You see their qualifications, real reviews, and teaching style before making a decision.",
                                },
                                {
                                    icon: "💰",
                                    title: "Transparent Pricing",
                                    desc: "No hidden fees, no commissions. Tutors set their own prices, and you see them upfront on every profile. What you see is what you pay.",
                                },
                                {
                                    icon: "📍",
                                    title: "Local-First",
                                    desc: "Find tutors in your neighbourhood. See how far they are, their service radius, and whether they come to your home or teach at theirs.",
                                },
                                {
                                    icon: "⭐",
                                    title: "Real Reviews",
                                    desc: "No fake testimonials. Only students who've actually taken sessions can leave reviews. You get the unfiltered truth.",
                                },
                                {
                                    icon: "📊",
                                    title: "Smart Dashboard",
                                    desc: "Tutors get a professional dashboard to manage students, sessions, payments, and analytics. Students get a clean booking experience.",
                                },
                                {
                                    icon: "🔒",
                                    title: "Privacy First",
                                    desc: "Your data stays yours. We don't sell personal information, and tutors control exactly what's visible on their public profiles.",
                                },
                            ].map((value) => (
                                <div
                                    key={value.title}
                                    className="card-hover rounded-[var(--radius-xl)] border border-border bg-bg-white p-8"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-bg-secondary border border-border text-lg shadow-[var(--shadow-xs)] mb-4">
                                        {value.icon}
                                    </div>
                                    <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                                        {value.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-text-secondary">
                                        {value.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========== CTA ========== */}
                <section className="bg-bg-secondary py-24 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12 text-center">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                            Ready to get started?
                        </h2>
                        <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto">
                            Whether you&apos;re looking for a tutor or looking to teach — NextTutor 
                            is free to join.
                        </p>
                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <Link
                                href="/tutors"
                                className="w-full rounded-[var(--radius-full)] bg-accent px-8 py-3.5 text-center text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)] sm:w-auto"
                            >
                                Find a Tutor
                            </Link>
                            <Link
                                href={isLoggedIn ? "/profile/edit" : "/continue"}
                                className="w-full rounded-[var(--radius-full)] border border-border bg-bg-white px-8 py-3.5 text-center text-base font-medium text-text-primary shadow-[var(--shadow-xs)] transition-base hover:bg-bg-secondary sm:w-auto"
                            >
                                {isLoggedIn ? "Edit Your Profile" : "I'm a Tutor"}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
