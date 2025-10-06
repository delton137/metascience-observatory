import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SanityLive } from "@/sanity/lib/live";
import { SiteNav } from "@/components/SiteNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Metascience Observatory",
  description:
    "Mapping rigor and reproducibility with AI. Research, data, and tools for better science.",
  openGraph: {
    title: "Metascience Observatory",
    description:
      "Mapping rigor and reproducibility with AI. Research, data, and tools for better science.",
    url: "https://metascienceobservatory.org",
    siteName: "Metascience Observatory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Metascience Observatory",
    description:
      "Mapping rigor and reproducibility with AI. Research, data, and tools for better science.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SanityLive />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
