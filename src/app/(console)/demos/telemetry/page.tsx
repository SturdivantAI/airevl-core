/**
 * Telemetry Console / FM-in-the-Pocket (Screen 3)
 * Route: /demos/telemetry
 * Status bar + hero widgets (relocated from marketing home per Ticket 002)
 * + 3-panel layout: left data panel + center facility schematic + right data panel
 */

import type { Metadata } from "next";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { supabase } from "@/lib/supabase";
import { seoRoutes } from "@/lib/seo";

const meta = seoRoutes["/demos/telemetry"];
export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  openGraph: { title: meta.title, description: meta.description },
};

export const dynamic = "force-dynamic"; // render on demand, not at build time

async function getData() {
  const [packetsRes, nodesRes] = await Promise.all([
    supabase.from("telemetry_packets").select("*").order("timestamp", { ascending: false }).limit(20),
    supabase.from("telemetry_nodes").select("*"),
  ]);
  return {
    packets: packetsRes.data ?? [],
    nodes: nodesRes.data ?? [],
  };
}

export default async function TelemetryConsole() {
  const { packets, nodes } = await getData();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Status bar + hero metric widgets (relocated from marketing home) */}
      <div className="p-gutter space-y-4">
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
                <path d="M0 30 Q 20 25, 40 10 T 80 15 T 100 5 L 100 40 L 0 40 Z" fill="url(#grad-tele)" className="opacity-20" />
                <defs>
                  <linearGradient id="grad-tele" x1="0" x2="0" y1="0" y2="1">
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
      </div>

      {/* 3-panel facility layout */}
      <div className="flex flex-1 p-gutter gap-gutter overflow-hidden min-h-[500px]">
      {/* Left data panel */}
      <div className="w-72 flex flex-col gap-4 shrink-0 hidden lg:flex">
        {/* Power Consumption */}
        <GlassPanel className="p-6 flex-1 overflow-hidden flex flex-col">
          <h3 className="font-label-caps text-label-caps text-primary-container mb-4 flex justify-between items-center border-b border-white/5 pb-2">
            Power Consumption
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#00f0ff]" />
          </h3>
          <div className="overflow-y-auto pr-2 space-y-3 flex-1 font-data-mono text-data-mono text-sm">
            {packets
              .filter((p) => p.metric === "power_consumption")
              .map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-on-surface-variant">{p.sector}</span>
                  <span className={p.status === "critical" ? "text-error" : "text-primary-container"}>
                    {p.value} {p.unit}
                  </span>
                </div>
              ))}
          </div>
        </GlassPanel>

        {/* Oxygen Saturation */}
        <GlassPanel className="p-6 flex-1 flex flex-col">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 flex justify-between items-center border-b border-white/5 pb-2">
            Oxygen Saturation
            <span className="text-xs text-primary-fixed-dim">98% OPTIMAL</span>
          </h3>
          <div className="flex-1 flex items-end gap-1 px-1">
            {[60, 75, 65, 85, 95, 90, 70].map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t ${i === 4 ? "bg-primary-container shadow-[0_0_10px_rgba(0,240,255,0.5)]" : "bg-primary-fixed-dim/40"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Center facility schematic */}
      <GlassPanel active className="flex-1 relative overflow-hidden flex flex-col">
        {/* Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-surface-dim/80 to-transparent">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-white">Facility Schematic</h2>
            <p className="font-data-mono text-data-mono text-primary-container opacity-80 mt-1">Real-time Node Status</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-surface-container/80 border border-white/10 rounded font-label-caps text-label-caps text-on-surface-variant backdrop-blur">LIVE</span>
            <span className="px-3 py-1 bg-primary-container/20 border border-primary-container/50 rounded font-label-caps text-label-caps text-primary-container backdrop-blur">SECURE</span>
          </div>
        </div>

        {/* Node visualization */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center">
          {/* SVG connecting lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-30">
            <line x1="25%" y1="33%" x2="75%" y2="50%" stroke="#00f0ff" strokeDasharray="4" strokeWidth="1" />
            <line x1="25%" y1="33%" x2="66%" y2="75%" stroke="#00f0ff" strokeWidth="1" />
          </svg>

          {/* Interactive nodes */}
          {nodes.map((node, i) => {
            const positions = [
              { top: "33%", left: "25%" },
              { bottom: "25%", right: "33%" },
              { top: "50%", right: "25%" },
              { top: "60%", left: "40%" },
            ];
            const pos = positions[i] || positions[0];
            const isCritical = node.status === "critical";

            return (
              <div key={node.id} className="absolute group" style={pos}>
                <div
                  className={`w-4 h-4 rounded-full cursor-pointer z-20 relative animate-pulse ${
                    isCritical ? "bg-error" : "bg-primary-container"
                  }`}
                  style={isCritical ? { animationDuration: "0.5s" } : undefined}
                />
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-surface-container/90 border border-primary-container/50 p-2 rounded hidden group-hover:block w-36 backdrop-blur-sm z-30">
                  <p className={`font-label-caps text-label-caps text-xs ${isCritical ? "text-error" : "text-primary-container"}`}>
                    {node.name}
                  </p>
                  <p className="font-data-mono text-data-mono text-[10px] text-white">
                    Status: {node.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end z-10 bg-gradient-to-t from-surface-dim/90 to-transparent">
          <div className="font-data-mono text-data-mono text-sm text-on-surface-variant flex gap-6">
            <span>LAT: 6.4541</span>
            <span>LONG: 3.3947</span>
            <span>DEPTH: 1200m</span>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded glass-panel flex items-center justify-center text-on-surface-variant hover:text-primary-container transition-all">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <button className="w-10 h-10 rounded glass-panel flex items-center justify-center text-on-surface-variant hover:text-primary-container transition-all">
              <span className="material-symbols-outlined">zoom_out</span>
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Right data panel */}
      <div className="w-72 flex flex-col gap-4 shrink-0 hidden lg:flex">
        <GlassPanel className="p-6 h-full overflow-hidden flex flex-col">
          <h3 className="font-label-caps text-label-caps text-secondary-fixed-dim mb-4 flex justify-between items-center border-b border-white/5 pb-2">
            Neural Link Load
            <span className="material-symbols-outlined text-sm">wifi_tethering</span>
          </h3>
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 mt-2">
            {[
              { name: "Cluster Omega", percent: 84, color: "bg-secondary-container", glow: "shadow-[0_0_8px_rgba(87,27,193,0.8)]" },
              { name: "Synapse Array 1", percent: 42, color: "bg-primary-container", glow: "shadow-[0_0_8px_rgba(0,240,255,0.6)]" },
              { name: "Deep Core Processing", percent: 97, color: "bg-error animate-pulse", glow: "shadow-[0_0_8px_rgba(255,180,171,0.8)]" },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between font-data-mono text-data-mono text-sm mb-1">
                  <span className="text-white">{item.name}</span>
                  <span className={item.percent > 90 ? "text-error" : "text-primary-container"}>{item.percent}%</span>
                </div>
                <div className="w-full bg-surface-container h-1 rounded overflow-hidden">
                  <div className={`h-full ${item.color} ${item.glow}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}

            {/* Live activity log */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Live Activity Log</h4>
              <ul className="font-data-mono text-data-mono text-[11px] space-y-2 opacity-70">
                <li><span className="text-primary-container">[SYS]</span> Handshake established with Node A</li>
                <li><span className="text-secondary-fixed-dim">[NET]</span> Packet loss detected in Sector 4</li>
                <li><span className="text-primary-container">[SYS]</span> Rerouting auxiliary power</li>
                <li><span className="text-error">[WARN]</span> Thermal threshold approaching limits</li>
                <li><span className="text-primary-container">[SYS]</span> Backup protocol initiated</li>
              </ul>
            </div>
          </div>
        </GlassPanel>
      </div>
      </div>
    </div>
  );
}
