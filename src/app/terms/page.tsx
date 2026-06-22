import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PageHero from "@/components/ui/PageHero";
import LegalDocument from "@/components/ui/LegalDocument";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: "Terms of Service — NextTutor",
    description:
        "Read NextTutor's Terms of Service. Understand your rights and responsibilities when using our tutor discovery and booking platform.",
};

const sections = [
    {
        id: "definitions",
        title: "1. Definitions",
        content: (
            <>
                <p>In these Terms of Service, the following terms have the meanings set out below:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>
                        <strong>&quot;Platform&quot;</strong> refers to the NextTutor website, application,
                        and all related services operated by PMG Pvt. Ltd.
                    </li>
                    <li>
                        <strong>&quot;User&quot;</strong> refers to any person who accesses or uses the
                        Platform, including Students and Tutors.
                    </li>
                    <li>
                        <strong>&quot;Student&quot;</strong> refers to a User who uses the Platform to find
                        and book sessions with Tutors.
                    </li>
                    <li>
                        <strong>&quot;Tutor&quot;</strong> refers to a User who creates a profile on the
                        Platform to offer tutoring services.
                    </li>
                    <li>
                        <strong>&quot;Services&quot;</strong> refers to the tutor discovery, profile
                        management, session booking, and related features provided by the Platform.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "acceptance",
        title: "2. Acceptance of Terms",
        content: (
            <>
                <p>
                    By accessing or using NextTutor, you agree to be bound by these Terms of
                    Service and our Privacy Policy. If you do not agree to these terms, you may
                    not use the Platform.
                </p>
                <p>
                    If you are using the Platform on behalf of a minor (under 18 years of age),
                    you represent that you are the parent or legal guardian and you agree to these
                    terms on their behalf.
                </p>
            </>
        ),
    },
    {
        id: "account-registration",
        title: "3. Account Registration",
        content: (
            <>
                <p>To use certain features of the Platform, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain the accuracy of your information and update it as needed</li>
                    <li>Keep your authentication credentials secure and confidential</li>
                    <li>
                        Accept responsibility for all activities that occur under your account
                    </li>
                    <li>
                        Notify us immediately if you suspect unauthorized use of your account
                    </li>
                </ul>
                <p>
                    We reserve the right to suspend or terminate accounts that contain inaccurate
                    information or violate these terms.
                </p>
            </>
        ),
    },
    {
        id: "platform-services",
        title: "4. Platform Services *",
        content: (
            <>
                <p>
                    NextTutor is a <strong>marketplace platform</strong> that connects Students
                    with Tutors. We facilitate discovery and communication, but we are not a party
                    to any tutoring arrangement between Students and Tutors.
                </p>
                <p>Important clarifications:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>
                        NextTutor does not employ Tutors. Tutors are independent service providers.
                    </li>
                    <li>
                        We do not guarantee the quality, safety, or legality of tutoring services
                        offered through the Platform.
                    </li>
                    <li>
                        We are not responsible for any disputes between Students and Tutors,
                        including payment disputes, scheduling conflicts, or quality of instruction.
                    </li>
                    <li>
                        While we verify Tutor identities and credentials, verification does not
                        constitute an endorsement or guarantee.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "tutor-responsibilities",
        title: "5. Tutor Responsibilities",
        content: (
            <>
                <p>As a Tutor on the Platform, you agree to:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>
                        Provide accurate information about your qualifications, subjects, and
                        experience
                    </li>
                    <li>Set fair and transparent pricing on your profile</li>
                    <li>Honour confirmed session bookings or provide reasonable notice of cancellation</li>
                    <li>Maintain professional conduct with all Students and parents</li>
                    <li>Comply with all applicable laws and regulations related to tutoring services</li>
                    <li>Not use the Platform to engage in any unlawful or inappropriate activities</li>
                </ul>
                <p>
                    Tutors are solely responsible for their tax obligations and compliance with
                    local regulations regarding private tutoring.
                </p>
            </>
        ),
    },
    {
        id: "student-responsibilities",
        title: "6. Student Responsibilities",
        content: (
            <>
                <p>As a Student on the Platform, you agree to:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Provide accurate information in your profile</li>
                    <li>Honour confirmed session bookings or cancel with reasonable notice</li>
                    <li>
                        Leave honest and fair reviews based on your actual experience with a Tutor
                    </li>
                    <li>Make timely payments as agreed with your Tutor</li>
                    <li>
                        Not use the Platform to harass, defame, or engage in abusive behaviour
                        toward Tutors
                    </li>
                    <li>
                        Not attempt to manipulate reviews, ratings, or profile view counts
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: "payments",
        title: "7. Payments & Fees *",
        content: (
            <>
                <p>
                    NextTutor currently does not charge any fees, commissions, or service charges
                    to Students or Tutors. The Platform is free to use.
                </p>
                <p>
                    Payment for tutoring services is arranged directly between Students and Tutors.
                    NextTutor is not responsible for payment collection, disputes, or refunds
                    between parties.
                </p>
                <p>
                    We reserve the right to introduce fees or premium features in the future. Users
                    will be given advance notice of any such changes, and continued use of paid
                    features will constitute acceptance of the applicable fees.
                </p>
            </>
        ),
    },
    {
        id: "content-ip",
        title: "8. Content & Intellectual Property",
        content: (
            <>
                <p>
                    <strong>User Content:</strong> By posting content on the Platform (including
                    profile information, reviews, FAQs, and profile photos), you grant NextTutor a
                    non-exclusive, worldwide, royalty-free licence to display, distribute, and use
                    that content in connection with the Platform&apos;s services.
                </p>
                <p>
                    <strong>Platform Content:</strong> The NextTutor name, logo, design system, and
                    all original content created by the Platform are the intellectual property of
                    PMG Pvt. Ltd. You may not copy, modify, or distribute Platform content without
                    prior written permission.
                </p>
                <p>
                    You retain ownership of your User Content but are responsible for ensuring that
                    it does not infringe on the intellectual property rights of others.
                </p>
            </>
        ),
    },
    {
        id: "prohibited-activities",
        title: "9. Prohibited Activities",
        content: (
            <>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Create fake accounts, profiles, or reviews</li>
                    <li>Use bots, scrapers, or automated tools to access the Platform</li>
                    <li>Attempt to inflate profile views, ratings, or other metrics artificially</li>
                    <li>
                        Circumvent the Platform to avoid fees if/when they are introduced
                    </li>
                    <li>Upload malicious content, spam, or inappropriate material</li>
                    <li>Impersonate another person or misrepresent your affiliation</li>
                    <li>
                        Use the Platform for any purpose unrelated to tutoring services
                    </li>
                    <li>Interfere with the Platform&apos;s operation or security</li>
                </ul>
                <p>
                    Violation of these prohibitions may result in immediate account suspension or
                    termination.
                </p>
            </>
        ),
    },
    {
        id: "limitation-of-liability",
        title: "10. Limitation of Liability *",
        content: (
            <>
                <p>
                    To the maximum extent permitted by applicable law, NextTutor and PMG Pvt. Ltd.
                    shall not be liable for:
                </p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Any indirect, incidental, special, or consequential damages</li>
                    <li>
                        Loss of profits, data, or goodwill arising from use of the Platform
                    </li>
                    <li>
                        The conduct, quality, or reliability of any Tutor or Student
                    </li>
                    <li>
                        Any interactions, disputes, or transactions between Users
                    </li>
                    <li>
                        Interruptions, errors, or unavailability of the Platform
                    </li>
                </ul>
                <p>
                    The Platform is provided &quot;as is&quot; and &quot;as available&quot; without
                    warranties of any kind, either express or implied.
                </p>
            </>
        ),
    },
    {
        id: "termination",
        title: "11. Termination",
        content: (
            <>
                <p>
                    You may terminate your account at any time by contacting us at{" "}
                    <a href="mailto:noreply.nexttutor@gmail.com" className="text-accent hover:underline">
                        noreply.nexttutor@gmail.com
                    </a>
                    .
                </p>
                <p>We may suspend or terminate your account if you:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Violate these Terms of Service</li>
                    <li>Engage in fraudulent, abusive, or illegal activity</li>
                    <li>Provide false or misleading information</li>
                    <li>Fail verification checks (for Tutors)</li>
                </ul>
                <p>
                    Upon termination, your right to use the Platform ceases immediately. Provisions
                    that by their nature should survive termination (including limitation of
                    liability, intellectual property, and dispute resolution) will continue to
                    apply.
                </p>
            </>
        ),
    },
    {
        id: "dispute-resolution",
        title: "12. Dispute Resolution & Governing Law *",
        content: (
            <>
                <p>
                    These Terms shall be governed by and construed in accordance with the laws of
                    India.
                </p>
                <p>
                    Any disputes arising from or relating to these Terms or use of the Platform
                    shall first be attempted to be resolved through good-faith negotiation. If
                    resolution cannot be reached, disputes shall be subject to the exclusive
                    jurisdiction of the courts in New Delhi, India.
                </p>
            </>
        ),
    },
    {
        id: "changes",
        title: "13. Changes to These Terms",
        content: (
            <>
                <p>
                    We may modify these Terms of Service from time to time. We will notify Users of
                    material changes by posting a notice on the Platform or sending an email
                    notification at least 14 days before the changes take effect.
                </p>
                <p>
                    Your continued use of the Platform after the effective date of revised Terms
                    constitutes your acceptance of the changes. If you do not agree to the revised
                    Terms, you should stop using the Platform and close your account.
                </p>
            </>
        ),
    },
    {
        id: "contact",
        title: "14. Contact",
        content: (
            <>
                <p>For questions about these Terms of Service, please contact us:</p>
                <ul className="list-none space-y-1.5">
                    <li>
                        <strong>Email:</strong>{" "}
                        <a href="mailto:noreply.nexttutor@gmail.com" className="text-accent hover:underline">
                            noreply.nexttutor@gmail.com
                        </a>
                    </li>
                    <li>
                        <strong>Entity:</strong> PMG Pvt. Ltd.
                    </li>
                    <li>
                        <strong>Support Hours:</strong> Monday – Saturday, 11 AM – 5 PM IST
                    </li>
                </ul>
            </>
        ),
    },
];

export default async function TermsPage() {
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
                    title="Terms of Service"
                    subtitle="Please read these terms carefully before using NextTutor."
                    breadcrumb="Terms of Service"
                />

                <section className="bg-bg-primary py-12 md:py-16">
                    <LegalDocument
                        title="Terms of Service"
                        lastUpdated="June 22, 2026"
                        sections={sections}
                    />
                </section>
            </main>

            <Footer />
        </>
    );
}
