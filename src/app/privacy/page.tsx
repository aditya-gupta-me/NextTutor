import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import PageHero from "@/components/ui/PageHero";
import LegalDocument from "@/components/ui/LegalDocument";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
    title: "Privacy Policy — NextTutor",
    description:
        "Read NextTutor's Privacy Policy. Learn how we collect, use, and protect your personal information when you use our platform.",
};

const sections = [
    {
        id: "information-we-collect",
        title: "1. Information We Collect",
        content: (
            <>
                <p>We collect the following types of information when you use NextTutor:</p>
                <p>
                    <strong>Personal Information You Provide:</strong> When you create an account,
                    we collect your name, email address, phone number, and role (student or tutor).
                    Tutors additionally provide qualifications, subjects, bio, location, pricing,
                    and optionally a profile photo and government-issued ID for verification.
                </p>
                <p>
                    <strong>Usage Data:</strong> We automatically collect information about how you
                    use the platform, including pages visited, features used, session booking
                    activity, and profile views (for tutors). This data is collected to improve
                    the platform experience.
                </p>
                <p>
                    <strong>Device Information:</strong> We may collect device type, browser type,
                    operating system, and IP address for security, analytics, and anti-abuse
                    purposes. IP addresses are hashed and never stored in raw form.
                </p>
            </>
        ),
    },
    {
        id: "how-we-use",
        title: "2. How We Use Your Information",
        content: (
            <>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Provide, maintain, and improve the NextTutor platform</li>
                    <li>Create and manage your account</li>
                    <li>Display tutor profiles to students searching for tutors</li>
                    <li>Facilitate session booking between students and tutors</li>
                    <li>Send transactional notifications (booking confirmations, session updates)</li>
                    <li>Verify tutor identities and qualifications</li>
                    <li>Provide analytics to tutors about their profile performance</li>
                    <li>Detect and prevent fraud, abuse, and security incidents</li>
                    <li>Comply with legal obligations</li>
                </ul>
            </>
        ),
    },
    {
        id: "information-sharing",
        title: "3. Information Sharing & Disclosure *",
        content: (
            <>
                <p>
                    We do not sell your personal information. We may share your information in the
                    following limited circumstances:
                </p>
                <p>
                    <strong>Public Profile Information:</strong> Tutor profiles (name, subjects,
                    qualifications, bio, pricing, location, reviews) are publicly visible to all
                    visitors. Students&apos; names and review content are visible on tutor profiles.
                </p>
                <p>
                    <strong>Service Providers:</strong> We use third-party services including
                    Supabase (database and authentication), Vercel (hosting), and Google Maps
                    (location services). These providers have access to data only as necessary to
                    perform their services and are bound by their own privacy policies.
                </p>
                <p>
                    <strong>Legal Requirements:</strong> We may disclose information if required by
                    law, court order, or government regulation, or if we believe disclosure is
                    necessary to protect our rights, safety, or the safety of others.
                </p>
                <p>
                    <strong>Business Transfers:</strong> In the event of a merger, acquisition, or
                    sale of assets, user information may be transferred as part of the transaction.
                    We will notify users of any such change.
                </p>
            </>
        ),
    },
    {
        id: "data-security",
        title: "4. Data Security",
        content: (
            <>
                <p>
                    We implement appropriate technical and organizational measures to protect your
                    personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Encryption of data in transit (HTTPS/TLS)</li>
                    <li>Secure authentication via one-time passwords (OTP)</li>
                    <li>Row-level security policies in our database</li>
                    <li>Hashing of sensitive identifiers (IP addresses, fingerprints)</li>
                    <li>Regular security reviews and access controls</li>
                </ul>
                <p>
                    While we strive to protect your information, no method of electronic
                    transmission or storage is 100% secure. We cannot guarantee absolute security.
                </p>
            </>
        ),
    },
    {
        id: "your-rights",
        title: "5. Your Rights *",
        content: (
            <>
                <p>Depending on your jurisdiction, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>
                        <strong>Access:</strong> Request a copy of the personal data we hold about
                        you
                    </li>
                    <li>
                        <strong>Correction:</strong> Update or correct inaccurate personal
                        information through your profile settings
                    </li>
                    <li>
                        <strong>Deletion:</strong> Request deletion of your account and associated
                        data by contacting us
                    </li>
                    <li>
                        <strong>Data Portability:</strong> Request your data in a structured,
                        commonly used format
                    </li>
                    <li>
                        <strong>Objection:</strong> Object to processing of your personal data for
                        certain purposes
                    </li>
                </ul>
                <p>
                    To exercise any of these rights, please contact us at{" "}
                    <a href="mailto:noreply.nexttutor@gmail.com" className="text-accent hover:underline">
                        noreply.nexttutor@gmail.com
                    </a>
                    . We will respond to your request within 30 days.
                </p>
            </>
        ),
    },
    {
        id: "cookies",
        title: "6. Cookies & Tracking",
        content: (
            <>
                <p>
                    NextTutor uses essential cookies for authentication and session management.
                    These are strictly necessary for the platform to function and cannot be
                    disabled.
                </p>
                <p>
                    We do not use third-party advertising cookies or tracking pixels. We do not
                    share browsing data with advertisers.
                </p>
                <p>
                    For profile view analytics, we use anonymized fingerprints (one-way hashed
                    combination of IP and user-agent) to prevent duplicate counting. These
                    fingerprints cannot be used to identify individual users and are automatically
                    deleted after 90 days.
                </p>
            </>
        ),
    },
    {
        id: "childrens-privacy",
        title: "7. Children's Privacy *",
        content: (
            <>
                <p>
                    NextTutor is designed to connect students with tutors. Students under the age
                    of 18 should use the platform with parental or guardian consent and supervision.
                </p>
                <p>
                    We do not knowingly collect personal information from children under 13 without
                    parental consent. If you believe a child under 13 has provided us with personal
                    information without parental consent, please contact us and we will promptly
                    delete such information.
                </p>
            </>
        ),
    },
    {
        id: "data-retention",
        title: "8. Data Retention",
        content: (
            <>
                <p>We retain your personal information for as long as your account is active or as
                    needed to provide services. Specifically:</p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>Account data is retained until you request deletion</li>
                    <li>Raw profile view events are automatically purged after 90 days</li>
                    <li>Aggregated analytics data (no personal identifiers) is retained indefinitely</li>
                    <li>Reviews remain visible even after account deletion to maintain platform integrity, though the reviewer name will be anonymized</li>
                </ul>
                <p>
                    Upon account deletion request, we will delete your personal data within 30 days,
                    except where we are required to retain it for legal or regulatory purposes.
                </p>
            </>
        ),
    },
    {
        id: "changes",
        title: "9. Changes to This Policy",
        content: (
            <>
                <p>
                    We may update this Privacy Policy from time to time to reflect changes in our
                    practices or applicable laws. We will notify users of material changes by
                    posting a notice on the platform or sending an email notification.
                </p>
                <p>
                    Your continued use of NextTutor after changes are posted constitutes your
                    acceptance of the updated policy.
                </p>
            </>
        ),
    },
    {
        id: "contact",
        title: "10. Contact Us",
        content: (
            <>
                <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy
                    or our data practices, please contact us:
                </p>
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

export default async function PrivacyPage() {
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
                    title="Privacy Policy"
                    subtitle="How we collect, use, and protect your information."
                    breadcrumb="Privacy Policy"
                />

                <section className="bg-bg-primary py-12 md:py-16">
                    <LegalDocument
                        title="Privacy Policy"
                        lastUpdated="June 22, 2026"
                        sections={sections}
                    />
                </section>
            </main>

            <Footer />
        </>
    );
}
