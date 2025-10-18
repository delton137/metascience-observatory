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
  title: "The Global Metascience Observatory",
  description:
    "Mapping rigor and reproducibility using AI. ",
  icons: {
    icon: "/globe.svg",
    shortcut: "/globe.svg",
    apple: "/globe.svg",
  },
  openGraph: {
    title: "The Global Metascience Observatory",
    description:
      "Mapping rigor and reproducibility using AI. ",
    url: "https://metascienceobservatory.org",
    siteName: "The Global Metascience Observatory",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Global Metascience Observatory",
    description:
      "Mapping rigor and reproducibility using AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`antialiased`}>
        <SanityLive />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
