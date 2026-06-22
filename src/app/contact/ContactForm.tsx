"use client";

import { useState } from "react";
import Link from "next/link";

const subjectOptions = [
    "General Inquiry",
    "Student Support",
    "Tutor Support",
    "Report an Issue",
    "Feature Request",
    "Partnership Inquiry",
    "Other",
];

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Open mailto with pre-filled content
        const mailtoSubject = encodeURIComponent(
            `[NextTutor] ${formData.subject || "General Inquiry"}`
        );
        const mailtoBody = encodeURIComponent(
            `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
        );
        window.open(
            `mailto:noreply.nexttutor@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`,
            "_self"
        );
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-8 md:p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-light text-2xl mx-auto mb-4">
                    ✉️
                </div>
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
                    Email client opened!
                </h3>
                <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
                    Your email app should have opened with a pre-filled message. If it didn&apos;t,
                    you can email us directly at{" "}
                    <a
                        href="mailto:noreply.nexttutor@gmail.com"
                        className="text-accent hover:underline"
                    >
                        noreply.nexttutor@gmail.com
                    </a>
                </p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-text-primary transition-base hover:bg-bg-secondary cursor-pointer"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[var(--radius-xl)] border border-border bg-bg-white p-6 md:p-8"
        >
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-6">
                Send us a message
            </h2>

            <div className="space-y-5">
                {/* Name */}
                <div>
                    <label
                        htmlFor="contact-name"
                        className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                        Your Name
                    </label>
                    <input
                        id="contact-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="form-input"
                        placeholder="Enter your full name"
                    />
                </div>

                {/* Email */}
                <div>
                    <label
                        htmlFor="contact-email"
                        className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                        Email Address
                    </label>
                    <input
                        id="contact-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="form-input"
                        placeholder="you@example.com"
                    />
                </div>

                {/* Subject */}
                <div>
                    <label
                        htmlFor="contact-subject"
                        className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                        Subject
                    </label>
                    <select
                        id="contact-subject"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="form-input cursor-pointer"
                    >
                        <option value="" disabled>
                            Select a topic
                        </option>
                        {subjectOptions.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Message */}
                <div>
                    <label
                        htmlFor="contact-message"
                        className="block text-sm font-medium text-text-primary mb-1.5"
                    >
                        Message
                    </label>
                    <textarea
                        id="contact-message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="form-input resize-none"
                        placeholder="Tell us how we can help..."
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-[var(--radius-md)] bg-accent px-5 py-3 text-sm font-medium text-white shadow-[var(--shadow-xs)] transition-base hover:bg-accent-hover hover:shadow-[var(--shadow-sm)] cursor-pointer"
                >
                    Send Message
                </button>
            </div>

            <p className="mt-4 text-xs text-text-tertiary text-center">
                Or check our{" "}
                <Link href="/faqs" className="text-accent hover:underline">
                    FAQs
                </Link>{" "}
                for instant answers.
            </p>
        </form>
    );
}
