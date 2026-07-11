import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import { ToastProvider } from "@/components/ui/ToastContext";
import "./globals.css";

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

const lora = Lora({
    variable: "--font-lora",
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    ),
    title: "NextTutor — Find Trusted Tutors Near You",
    description:
        "Discover verified private tutors in your neighbourhood. Browse profiles, read reviews, book sessions, and manage payments — all in one place.",
    keywords: [
        "private tutor",
        "tutor near me",
        "home tuition",
        "tutor discovery",
        "Delhi tutor",
        "Noida tutor",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
            </head>
            <body className={`${dmSans.variable} ${lora.variable} font-sans antialiased`}>
                <ToastProvider>{children}</ToastProvider>
                <Analytics />
            </body>
        </html>
    );
}
