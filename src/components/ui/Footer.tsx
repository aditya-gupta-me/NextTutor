import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-bg-secondary">
            <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-bold">
                                T
                            </div>
                            <span className="text-lg font-semibold text-text-primary tracking-tight">
                                NextTutor
                            </span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Find trusted private tutors near you. Browse profiles, read reviews, and
                            book sessions — all in one place.
                        </p>
                    </div>

                    {/* For Students */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-text-primary">
                            For Students
                        </h4>
                        <ul className="flex flex-col gap-2">
                            <li>
                                <Link
                                    href="/tutors"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Find a Tutor
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#how-it-works"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/faqs"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    FAQs
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Tutors */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-text-primary">For Tutors</h4>
                        <ul className="flex flex-col gap-2">
                            <li>
                                <Link
                                    href="/continue"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Create Your Profile
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#for-tutors"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Why NextTutor?
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/success-stories"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Success Stories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-text-primary">Company</h4>
                        <ul className="flex flex-col gap-2">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-sm text-text-secondary transition-base hover:text-text-primary"
                                >
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 border-t border-border pt-6 flex flex-col items-center gap-2 md:flex-row md:justify-between">
                    <p className="text-xs text-text-tertiary">
                        © 2026 NextTutor. All rights reserved.
                    </p>
                    <p className="text-xs text-text-tertiary">Made with care in India 🇮🇳</p>
                </div>
            </div>
        </footer>
    );
}
