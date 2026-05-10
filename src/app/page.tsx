import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import {
    HeroProductPreview,
    TutorProfilePreview,
    SessionPreview,
} from "@/components/illustrations/Illustrations";

export default function Home() {
    return (
        <>
            <Navbar />

            <main>
                {/* ========== HERO ========== */}
                <section className="hero-gradient pt-32 pb-20 md:pt-40 md:pb-32">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
                            {/* Copy */}
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-border bg-bg-white px-4 py-1.5 text-xs font-medium text-text-secondary shadow-[var(--shadow-xs)] animate-fade-in-up">
                                    <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
                                    Now in Delhi &amp; Noida
                                </div>

                                <h1 className="font-serif text-4xl font-bold leading-[1.12] tracking-tight text-text-primary md:text-5xl lg:text-[52px] animate-fade-in-up">
                                    Stop scrolling through{" "}
                                    <span className="gradient-text">WhatsApp groups</span>
                                </h1>

                                <p className="mt-5 max-w-lg text-lg leading-relaxed text-text-secondary mx-auto lg:mx-0 animate-fade-in-up">
                                    Find verified tutors near you, see their real reviews, and book
                                    sessions — without asking ten people for recommendations.
                                </p>

                                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start animate-fade-in-up">
                                    <Link
                                        href="/tutors"
                                        className="w-full rounded-[var(--radius-full)] bg-accent px-7 py-3.5 text-center text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)] sm:w-auto"
                                    >
                                        Find a Tutor
                                    </Link>
                                    <Link
                                        href="/continue"
                                        className="w-full rounded-[var(--radius-full)] border border-border bg-bg-white px-7 py-3.5 text-center text-base font-medium text-text-primary shadow-[var(--shadow-xs)] transition-base hover:bg-bg-secondary sm:w-auto"
                                    >
                                        I&apos;m a Tutor
                                    </Link>
                                </div>

                                <p className="mt-6 text-sm text-text-tertiary animate-fade-in-up">
                                    Free for students &amp; tutors. No credit card needed.
                                </p>
                            </div>

                            {/* Product preview */}
                            <div className="flex-1 flex justify-center animate-fade-in-up">
                                <HeroProductPreview className="w-full max-w-[380px]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== TESTIMONIAL 1 ========== */}
                <section className="bg-bg-white border-y border-border py-12 md:py-16">
                    <div className="mx-auto max-w-[700px] px-6 md:px-12 text-center">
                        <p className="text-lg italic text-text-secondary leading-relaxed md:text-xl">
                            &ldquo;I used to spend hours asking around for a good math tutor. Found
                            one on NextTutor in 10 minutes, and my daughter&apos;s grades have
                            improved since.&rdquo;
                        </p>
                        <div className="mt-4 text-sm font-medium text-text-primary">
                            Meera, Parent in Noida
                        </div>
                    </div>
                </section>

                {/* ========== BENTO FEATURES ========== */}
                <section id="features" className="bg-bg-primary py-24 md:py-32">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="mx-auto max-w-xl text-center mb-16">
                            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                                Tutoring, without the mess
                            </h2>
                            <p className="mt-4 text-lg text-text-secondary">
                                No more scattered WhatsApp threads, cash confusion, or guesswork.
                                Everything lives here.
                            </p>
                        </div>

                        {/* Bento grid */}
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 stagger-children">
                            {/* Large card — spans 2 cols on lg */}
                            <div className="card-hover rounded-[var(--radius-xl)] border border-border bg-bg-white p-8 lg:col-span-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-8">
                                    <div className="flex-1">
                                        <div className="inline-flex items-center gap-1.5 mb-3 text-sm font-medium text-accent">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                            >
                                                <circle
                                                    cx="8"
                                                    cy="6"
                                                    r="4"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    fill="none"
                                                />
                                                <path
                                                    d="M8 10v2M6 14h4"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            Search &amp; Discover
                                        </div>
                                        <h3 className="font-serif text-xl font-semibold text-text-primary md:text-2xl">
                                            Tutors who actually show up
                                        </h3>
                                        <p className="mt-3 text-sm leading-relaxed text-text-secondary max-w-sm">
                                            Every tutor is verified by our team. See their
                                            qualifications, real student reviews, subjects, pricing,
                                            and exactly how far they are from you.
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-[200px]">
                                        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-primary p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-8 w-8 rounded-full bg-accent-light flex items-center justify-center text-xs">
                                                    👩‍🏫
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-semibold text-text-primary">
                                                        Priya S.
                                                    </div>
                                                    <div className="text-[9px] text-text-tertiary">
                                                        1.2 km · ⭐ 4.9
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-8 w-8 rounded-full bg-success-light flex items-center justify-center text-xs">
                                                    👨‍🏫
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-semibold text-text-primary">
                                                        Rajiv M.
                                                    </div>
                                                    <div className="text-[9px] text-text-tertiary">
                                                        2.8 km · ⭐ 4.7
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-warning-light flex items-center justify-center text-xs">
                                                    👩‍🏫
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-semibold text-text-primary">
                                                        Ananya J.
                                                    </div>
                                                    <div className="text-[9px] text-text-tertiary">
                                                        3.1 km · ⭐ 4.8
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Small card — Book */}
                            <div className="card-hover rounded-[var(--radius-xl)] border border-border bg-bg-white p-8">
                                <div className="inline-flex items-center gap-1.5 mb-3 text-sm font-medium text-success">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <rect
                                            x="2"
                                            y="3"
                                            width="12"
                                            height="11"
                                            rx="2"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                        <path
                                            d="M2 7h12M5 2v2M11 2v2"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    Book Sessions
                                </div>
                                <h3 className="font-serif text-xl font-semibold text-text-primary">
                                    One click,
                                    <br />
                                    you&apos;re booked
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                                    Weekly recurring classes or one-time sessions. Request, get
                                    confirmed, and show up. That&apos;s it.
                                </p>
                            </div>

                            {/* Small card — FAQ */}
                            <div className="card-hover rounded-[var(--radius-xl)] border border-border bg-bg-white p-8">
                                <div className="inline-flex items-center gap-1.5 mb-3 text-sm font-medium text-[#8B5CF6]">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle
                                            cx="8"
                                            cy="8"
                                            r="6"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                        <path
                                            d="M6 6.5c0-1.1.9-2 2-2s2 .9 2 2c0 .7-.4 1.3-1 1.7-.3.2-.5.3-.5.5V9.5"
                                            stroke="currentColor"
                                            strokeWidth="1.3"
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        <circle cx="8.5" cy="11" r="0.5" fill="currentColor" />
                                    </svg>
                                    Tutor FAQs
                                </div>
                                <h3 className="font-serif text-xl font-semibold text-text-primary">
                                    Know before
                                    <br />
                                    you go
                                </h3>
                                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                                    Read tutor FAQs — teaching style, cancellation policy, materials
                                    needed. No awkward back-and-forth.
                                </p>
                            </div>

                            {/* Large card — Payments — spans 2 cols on lg */}
                            <div className="card-hover rounded-[var(--radius-xl)] border border-border bg-bg-white p-8 lg:col-span-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-8">
                                    <div className="flex-1">
                                        <div className="inline-flex items-center gap-1.5 mb-3 text-sm font-medium text-warning">
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                            >
                                                <rect
                                                    x="1"
                                                    y="4"
                                                    width="14"
                                                    height="9"
                                                    rx="2"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    fill="none"
                                                />
                                                <path
                                                    d="M1 7h14"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                            Payments
                                        </div>
                                        <h3 className="font-serif text-xl font-semibold text-text-primary md:text-2xl">
                                            No more awkward
                                            <br />
                                            fee conversations
                                        </h3>
                                        <p className="mt-3 text-sm leading-relaxed text-text-secondary max-w-sm">
                                            Transparent pricing on every profile. Pay via UPI,
                                            cards, or net banking. Automated reminders so nobody has
                                            to chase anyone.
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 w-full md:w-[200px]">
                                        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-primary p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] text-text-secondary">
                                                    March 2026
                                                </span>
                                                <span className="rounded-[var(--radius-sm)] bg-success-light px-1.5 py-0.5 text-[9px] font-medium text-success">
                                                    Paid
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-text-primary mb-1">
                                                ₹3,000
                                            </div>
                                            <div className="text-[10px] text-text-tertiary mb-3">
                                                Mathematics · Priya S.
                                            </div>
                                            <div className="h-px bg-border mb-2" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-text-secondary">
                                                    April 2026
                                                </span>
                                                <span className="rounded-[var(--radius-sm)] bg-warning-light px-1.5 py-0.5 text-[9px] font-medium text-warning">
                                                    Due in 5 days
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-text-primary mt-1">
                                                ₹3,000
                                            </div>
                                            <div className="text-[10px] text-text-tertiary">
                                                Mathematics · Priya S.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== TESTIMONIAL 2 ========== */}
                <section className="bg-bg-white border-y border-border py-12 md:py-16">
                    <div className="mx-auto max-w-[700px] px-6 md:px-12 text-center">
                        <p className="text-lg italic text-text-secondary leading-relaxed md:text-xl">
                            &ldquo;Finally a platform that treats tutors professionally. My profile
                            page looks better than my LinkedIn.&rdquo;
                        </p>
                        <div className="mt-4 text-sm font-medium text-text-primary">
                            Rajiv, Physics tutor in Delhi
                        </div>
                    </div>
                </section>

                {/* ========== HOW IT WORKS ========== */}
                <section id="how-it-works" className="bg-bg-primary py-24 md:py-32">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="mx-auto max-w-xl text-center mb-16">
                            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                                Three steps, one great tutor
                            </h2>
                            <p className="mt-4 text-lg text-text-secondary">
                                No forms, no phone tag, no &ldquo;I&apos;ll get back to you.&rdquo;
                            </p>
                        </div>

                        <div className="relative grid gap-10 md:grid-cols-3 md:gap-12 stagger-children">
                            {/* Connector */}
                            <div className="hidden md:block absolute top-7 left-[18%] right-[18%] h-[2px] bg-border z-0" />

                            {[
                                {
                                    step: "01",
                                    title: "Search your area",
                                    desc: "Enter your location and subject. See who's nearby, their ratings, pricing, and teaching style.",
                                },
                                {
                                    step: "02",
                                    title: "Request a session",
                                    desc: "Like what you see? Send a session request with your preferred time. The tutor accepts or suggests an alternative.",
                                },
                                {
                                    step: "03",
                                    title: "Start learning",
                                    desc: "Sessions are scheduled, parents are notified, and payments are tracked. Everything in one dashboard.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className="relative z-10 flex flex-col items-center text-center"
                                >
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-white border-2 border-accent text-sm font-bold text-accent shadow-[var(--shadow-sm)]">
                                        {item.step}
                                    </div>
                                    <h3 className="font-serif text-lg font-semibold text-text-primary">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-text-secondary">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========== BUILT FOR HOW YOU LEARN (tabbed section) ========== */}
                <section className="bg-bg-secondary py-24 md:py-32">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="mx-auto max-w-xl text-center mb-16">
                            <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                                Built for everyone involved
                            </h2>
                            <p className="mt-4 text-lg text-text-secondary">
                                Students, parents, and tutors. Everyone has a home here.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3 stagger-children">
                            {/* Students */}
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8">
                                <div className="text-2xl mb-4">🎓</div>
                                <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                                    For Students
                                </h3>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    Find tutors by subject, read their FAQs, check real reviews from
                                    other students. Everything you need to make the right choice.
                                </p>
                            </div>

                            {/* Parents */}
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8">
                                <div className="text-2xl mb-4">👨‍👩‍👧</div>
                                <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                                    For Parents
                                </h3>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    Get updates on your child&apos;s sessions, payment receipts, and
                                    tutor details. Stay in the loop without micromanaging.
                                </p>
                            </div>

                            {/* Tutors */}
                            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8">
                                <div className="text-2xl mb-4">📚</div>
                                <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                                    For Tutors
                                </h3>
                                <p className="text-sm leading-relaxed text-text-secondary">
                                    A free, professional profile page. Manage your students,
                                    schedule, and payments. Let us bring the students to you.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== TESTIMONIAL 3 ========== */}
                <section className="bg-bg-white border-y border-border py-12 md:py-16">
                    <div className="mx-auto max-w-[700px] px-6 md:px-12 text-center">
                        <p className="text-lg italic text-text-secondary leading-relaxed md:text-xl">
                            &ldquo;As a parent, safety is my biggest concern. I love that I get
                            updates about every session and all tutors are verified.&rdquo;
                        </p>
                        <div className="mt-4 text-sm font-medium text-text-primary">
                            Sunita, Parent of two in Greater Noida
                        </div>
                    </div>
                </section>

                {/* ========== FOR TUTORS CTA ========== */}
                <section id="for-tutors" className="bg-bg-primary py-24 md:py-32">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12">
                        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
                            {/* Mock profile preview */}
                            <div className="flex-1 flex justify-center">
                                <TutorProfilePreview className="animate-float" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-accent-light px-3 py-1 text-xs font-medium text-accent mb-5">
                                    For Tutors
                                </div>
                                <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                                    Your classroom,
                                    <br />
                                    your rules
                                </h2>
                                <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto lg:mx-0">
                                    Create a professional profile that parents trust. Set your own
                                    pricing, define your teaching style, and let students come to
                                    you.
                                </p>

                                <div className="mt-8 flex flex-col gap-5 text-left max-w-md mx-auto lg:mx-0">
                                    {[
                                        {
                                            icon: "🌐",
                                            title: "Your digital visiting card",
                                            desc: "A shareable, SEO-friendly profile page. Better than any pamphlet.",
                                        },
                                        {
                                            icon: "✅",
                                            title: "Trust with a verified badge",
                                            desc: "Get verified by our team. Parents know you're legit.",
                                        },
                                        {
                                            icon: "📊",
                                            title: "Everything in one dashboard",
                                            desc: "Students, schedules, payments, reviews — all organized.",
                                        },
                                    ].map((benefit) => (
                                        <div key={benefit.title} className="flex items-start gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-bg-white border border-border text-lg shadow-[var(--shadow-xs)]">
                                                {benefit.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-text-primary">
                                                    {benefit.title}
                                                </h4>
                                                <p className="mt-0.5 text-sm text-text-secondary">
                                                    {benefit.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex justify-center lg:justify-start">
                                    <Link
                                        href="/continue"
                                        className="rounded-[var(--radius-full)] bg-accent px-8 py-3.5 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)]"
                                    >
                                        Create Your Free Profile →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========== FINAL CTA ========== */}
                <section className="bg-bg-secondary py-24 md:py-28">
                    <div className="mx-auto max-w-[1200px] px-6 md:px-12 text-center">
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-text-primary md:text-[40px] md:leading-[1.15]">
                            The right tutor is closer
                            <br />
                            than you think
                        </h2>
                        <p className="mt-4 text-lg text-text-secondary max-w-md mx-auto">
                            Join students and parents across Delhi NCR who stopped guessing and
                            started learning.
                        </p>
                        <div className="mt-8">
                            <Link
                                href="/tutors"
                                className="inline-block rounded-[var(--radius-full)] bg-accent px-8 py-3.5 text-base font-medium text-white shadow-[var(--shadow-sm)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-md)]"
                            >
                                Get Started for Free
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
