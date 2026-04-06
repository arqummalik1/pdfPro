import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import WebVitalsTracker from "@/components/WebVitalsTracker";
import { CORE_SEO_KEYWORDS, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-albert-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "mydearPDF - Merge PDF, Compress PDF, Split & Sign PDFs Online Free",
  description:
    "Merge PDF and Compress PDF online for free with mydearPDF. Fast, secure, no signup PDF tools to split, sign, rotate, watermark, and unlock PDFs. A product of Audentix.",
  keywords: CORE_SEO_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "mydearPDF",
    title: "mydearPDF - Merge PDF, Compress PDF, Split & Sign PDFs Online Free",
    description:
      "Free PDF tools for merge pdf, compress pdf, split, rotate, sign, watermark, and unlock workflows.",
  },
  twitter: {
    card: "summary_large_image",
    title: "mydearPDF - Free PDF Tools",
    description:
      "Merge PDF and Compress PDF online with secure, free tools. No signup required. Powered by Audentix.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${albertSans.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AnalyticsTracker />
        <WebVitalsTracker />
        {children}
      </body>
    </html>
  );
}
