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
import { AnalyticsGate } from "@/components/layout/AnalyticsGate";

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
  title: "AiRevl — AI Agents, Training and Consultancy",
  description:
    "AiRevl designs, builds and governs AI agents for organisations worldwide, and trains your people to run them. The Agentic Approach!",
  keywords: [
    "AiRevl",
    "AI agents",
    "Agentic AI",
    "AI automation",
    "AI training",
    "AI consultancy",
    "AI governance",
    "Zero-Trust",
    "NDPA 2023",
  ],
  openGraph: {
    title: "AiRevl — The Agentic Approach!",
    description: "Put AI agents to work. Keep humans in charge. Custom agents, hands-on training and expert consultancy.",
    url: "https://www.airevl.ai",
    siteName: "AiRevl",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AiRevl — The Agentic Approach!",
    description: "Put AI agents to work. Keep humans in charge. Custom agents, hands-on training and expert consultancy.",
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

        {/* Analytics — disabled until counsel sign-off on consent mechanics */}
        <AnalyticsGate />

        {/* Route-group layouts provide their own shell chrome */}
        {children}
      </body>
    </html>
  );
}
