/**
 * T4.7 — Root Layout
 * Google Fonts (Hanken Grotesk, Inter, JetBrains Mono)
 * SideNavBar + TopAppBar + ShaderBackground
 * Source of truth: .kiro/DESIGN.md
 */

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

import { SideNavBar } from "@/components/layout/SideNavBar";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { ShaderBackgroundWrapper } from "@/components/canvas/ShaderBackgroundWrapper";

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
      <body className="bg-[#050508] text-on-surface font-body-md text-body-md antialiased h-screen w-screen overflow-hidden flex selection:bg-primary-container selection:text-on-primary-container">
        {/* Ambient shader background */}
        <ShaderBackgroundWrapper />

        {/* SideNavBar — fixed left, hidden on mobile */}
        <SideNavBar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col ml-0 md:ml-64 relative z-10 w-full h-full overflow-hidden">
          <TopAppBar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
