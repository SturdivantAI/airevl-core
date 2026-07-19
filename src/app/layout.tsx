/**
 * Root Layout
 * Google Fonts (Hanken Grotesk, Inter, JetBrains Mono)
 * BackgroundCanvasWrapper mounted globally; shell chrome delegated to route-group layouts.
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

import { BackgroundCanvasWrapper } from "@/components/canvas/BackgroundCanvasWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
  weight: ["600", "700", "900"],
});

export const metadata: Metadata = {
  title: "AiRevl — Zero-Trust AI Infrastructure",
  description:
    "Global Intelligence. Domestic Sovereignty. Hardened, zero-trust AI infrastructure engineered for Nigeria's 2027 data localization landscape.",
  keywords: [
    "AiRevl",
    "AI Infrastructure",
    "CBN Data Localization",
    "NDPA 2023",
    "Zero-Trust",
    "Nigeria Fintech",
  ],
  openGraph: {
    title: "AiRevl — Zero-Trust AI Infrastructure",
    description: "Hardened, zero-trust AI infrastructure engineered for Nigeria's 2027 data localization landscape.",
    url: "https://www.airevl.ai",
    siteName: "AiRevl",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AiRevl — Zero-Trust AI Infrastructure",
    description: "Global Intelligence. Domestic Sovereignty.",
    site: "@AirevlAi",
  },
  metadataBase: new URL("https://www.airevl.ai"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable} ${hankenGrotesk.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#050508] text-on-surface font-body-md text-body-md antialiased h-screen w-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
        {/* Living background — procedural starfield + wave grid, globally mounted */}
        <BackgroundCanvasWrapper />

        {/* Route-group layouts provide their own shell chrome */}
        {children}
      </body>
    </html>
  );
}
