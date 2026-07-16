/**
 * T4.1 — Hero Dashboard (Screen 1)
 * Route: /
 * ShaderBackground + AICore3D + status badge + metric cards + contact section
 * Source: .kiro/DESIGN.md §9 Screen 1
 */

"use client";

import dynamic from "next/dynamic";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Footer } from "@/components/layout/Footer";
import { heroHeadline } from "@/lib/brand";

const AICore3D = dynamic(() => import("@/components/canvas/AICore3D"), {
  ssr: false,
});

export default function HeroDashboard() {
  return (
    <div className="relative flex flex-col items-center justify-between p-6 md:p-8 min-h-full">
      {/* 3D Scene */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-90">
        <div className="w-[500px] h-[500px] md:w-[700px] md:h-[700px]">
          <AICore3D />
        </div>
      </div>

      {/* Foreground overlays */}
      <div className="relative z-10 w-full flex flex-col justify-between h-full gap-8">
        {/* Top status bar */}
        <div className="flex justify-between items-start w-full">
          <GlassPanel className="px-4 py-2 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span className="font-data-mono text-data-mono text-primary-container">CORE_ACTIVE</span>
            <span className="text-on-surface-variant opacity-50 mx-2">|</span>
            <span className="font-data-mono text-[10px] text-on-surface-variant tracking-widest">UPLINK STABLE</span>
          </GlassPanel>
          <GlassPanel className="px-4 py-2 text-right">
            <span className="font-data-mono text-[10px] text-on-surface-variant block uppercase tracking-widest">System Load</span>
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-white">42.8%</span>
          </GlassPanel>
        </div>

        {/* Hero headline */}
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <h1 className="font-display-lg text-[28px] md:text-display-lg text-white max-w-3xl leading-tight tracking-tight">
            {heroHeadline}
          </h1>
        </div>

        {/* Bottom section */}
        <div className="w-full space-y-6">
          {/* Metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Neural Sync */}
            <GlassPanel hoverable className="p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="flex justify-between items-center mb-4">
                <span className="font-data-mono text-data-mono text-on-surface-variant uppercase tracking-wider">Neural Sync</span>
                <span className="material-symbols-outlined text-primary-container opacity-70">psychology</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display-lg text-display-lg text-white">99.4</span>
                <span className="font-data-mono text-data-mono text-primary-container">%</span>
              </div>
              <div className="w-full h-12 relative">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                  <path d="M0 30 Q 20 25, 40 10 T 80 15 T 100 5" fill="none" stroke="#00f0ff" strokeWidth="2" className="opacity-80" />
                  <path d="M0 30 Q 20 25, 40 10 T 80 15 T 100 5 L 100 40 L 0 40 Z" fill="url(#grad-hero)" className="opacity-20" />
                  <defs>
                    <linearGradient id="grad-hero" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </GlassPanel>

            {/* Protocol Status */}
            <GlassPanel hoverable className="p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="font-data-mono text-data-mono text-on-surface-variant uppercase tracking-wider">Protocol Status</span>
                <span className="material-symbols-outlined text-primary-container opacity-70">memory</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display-lg text-[36px] text-white font-bold">OPTIMAL</span>
              </div>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-data-mono text-[12px] text-on-surface-variant">Encryption</span>
                  <span className="text-[14px] text-white">Quantum-AES</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="font-data-mono text-[12px] text-on-surface-variant">Integrity</span>
                  <span className="text-[14px] text-primary-container">Verified</span>
                </div>
              </div>
            </GlassPanel>

            {/* Network Latency */}
            <GlassPanel hoverable className="p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <span className="font-data-mono text-data-mono text-on-surface-variant uppercase tracking-wider">Network Latency</span>
                <span className="material-symbols-outlined text-primary-container opacity-70">router</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-display-lg text-display-lg text-white">12</span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">ms</span>
              </div>
              <div className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between text-[10px] font-data-mono text-on-surface-variant mb-1">
                    <span>Node Alpha</span><span>8ms</span>
                  </div>
                  <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container w-[20%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-data-mono text-on-surface-variant mb-1">
                    <span>Node Beta</span><span>16ms</span>
                  </div>
                  <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-outline-variant w-[40%]" />
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
