"use client";

import { useState } from "react";
import FaqAccordion from "@/components/ui/FaqAccordion";
import type { FaqItem } from "@/components/ui/FaqAccordion";

const categories = ["General", "For Students", "For Tutors", "Payments", "Account"] as const;
type Category = (typeof categories)[number];

const faqData: Record<Category, FaqItem[]> = {
    General: [
        {
            question: "What is NextTutor?",
            answer: "NextTutor is a platform that connects students and parents with verified private tutors in their neighbourhood. Browse tutor profiles, read real student reviews, compare pricing, and book sessions — all in one place. We currently operate in Delhi, Noida, Uttar Pradesh, and West Bengal.",
        },
        {
            question: "Is NextTutor free to use?",
            answer: "Yes! NextTutor is completely free for both students and tutors. There are no sign-up fees, no commissions, and no hidden charges. Tutors set their own pricing, and students pay tutors directly.",
        },
        {
            question: "Which cities does NextTutor support?",
            answer: "We currently operate in Delhi, Noida, Uttar Pradesh, and West Bengal. We're expanding to more cities soon. If you'd like NextTutor in your city, let us know through our contact page!",
        },
        {
            question: "How is NextTutor different from other tutoring platforms?",
            answer: "Unlike most platforms, we don't take commissions from tutors or inflate pricing. Every tutor is individually verified, and all reviews come from real students who've actually taken sessions. We're local-first — focused on helping you find great tutors near you, not matching you with someone across the country.",
        },
    ],
    "For Students": [
        {
            question: "How do I find a tutor?",
            answer: "Visit the 'Find a Tutor' page to browse all verified tutors. You can filter by subject, location, and rating. Each tutor has a detailed profile with their qualifications, subjects, pricing, FAQs, and real student reviews.",
        },
        {
            question: "How does booking a session work?",
            answer: "Once you find a tutor you like, click 'Start Learning' on their profile to request a session. Choose your preferred schedule, and the tutor will confirm the booking. You'll get notifications about session updates.",
        },
        {
            question: "Can I leave a review for my tutor?",
            answer: "Yes! After you've taken sessions with a tutor, you can leave an honest review on their profile. Reviews are only available to students who have actually booked sessions, so every review is genuine.",
        },
        {
            question: "What if I'm not happy with a tutor?",
            answer: "You're never locked in. If a tutor isn't the right fit, you can stop sessions at any time and find a new tutor. We encourage you to leave an honest review so other students can make informed decisions.",
        },
        {
            question: "Do I need to create an account to browse tutors?",
            answer: "No! You can browse all tutor profiles, view their qualifications, subjects, and pricing without an account. You'll only need to sign up when you want to book a session or leave a review.",
        },
    ],
    "For Tutors": [
        {
            question: "How do I create a tutor profile?",
            answer: "Sign up on NextTutor and select 'I'm a Tutor' during onboarding. Fill in your subjects, qualifications, bio, pricing, and location. Your profile becomes a professional, shareable page — better than any pamphlet or WhatsApp status.",
        },
        {
            question: "Does NextTutor charge a commission?",
            answer: "No. NextTutor is completely free for tutors. We don't take any commission or percentage from your earnings. You set your own prices, and students pay you directly.",
        },
        {
            question: "How does tutor verification work?",
            answer: "After creating your profile, our team reviews your information and credentials. Once verified, you'll get a 'Verified' badge on your profile, which helps build trust with parents and students.",
        },
        {
            question: "Can I control what's visible on my public profile?",
            answer: "Yes. You have control over your profile information, including your bio, subjects, pricing, and FAQs. You can also toggle the visibility of your activity analytics from the Settings page.",
        },
        {
            question: "How do students find me?",
            answer: "Students can discover your profile through our search page by filtering for subjects and location. Your profile is also SEO-friendly, meaning it can appear in Google search results when students search for tutors in your area.",
        },
    ],
    Payments: [
        {
            question: "What payment methods are accepted?",
            answer: "Payment arrangements are made directly between students and tutors. NextTutor provides transparent pricing on tutor profiles so both parties know the fees upfront. Tutors and students can agree on their preferred payment method (UPI, cash, bank transfer, etc.).",
        },
        {
            question: "Are there any platform fees?",
            answer: "No. NextTutor does not charge any platform fees, commissions, or service charges to students or tutors. The price you see on a tutor's profile is what you pay directly to the tutor.",
        },
        {
            question: "How are refunds handled?",
            answer: "Since payments are made directly between students and tutors, refund policies are set by individual tutors. We recommend checking a tutor's FAQs or discussing cancellation and refund terms before booking your first session.",
        },
    ],
    Account: [
        {
            question: "How do I sign up?",
            answer: "Click 'Get Started' and enter your email or phone number. You'll receive a verification code to complete your registration. Then choose whether you're a student or tutor and fill in your profile.",
        },
        {
            question: "Can I change my email address?",
            answer: "Currently, email changes need to be handled through our support team. Please contact us at noreply.nexttutor@gmail.com with your request.",
        },
        {
            question: "How do I delete my account?",
            answer: "Please contact us at noreply.nexttutor@gmail.com to request account deletion. We'll process your request and permanently delete your data within 30 days, in accordance with our privacy policy.",
        },
        {
            question: "I forgot my password. How do I reset it?",
            answer: "NextTutor uses passwordless authentication via email or phone OTP. Simply click 'Log in', enter your email or phone number, and we'll send you a one-time code. No password needed!",
        },
    ],
};

export default function FaqContent() {
    const [activeCategory, setActiveCategory] = useState<Category>("General");

    return (
        <>
            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`rounded-[var(--radius-full)] px-4 py-2 text-sm font-medium transition-base cursor-pointer ${
                            activeCategory === cat
                                ? "bg-accent text-white shadow-[var(--shadow-sm)]"
                                : "bg-bg-white border border-border text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Accordion */}
            <div className="mx-auto max-w-3xl">
                <FaqAccordion items={faqData[activeCategory]} />
            </div>
        </>
    );
}
