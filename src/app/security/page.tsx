"use client";

/**
 * T4.4 — Zero-Trust Security Log Terminal (Screen 4)
 * Route: /security
 * 12-column bento grid: 8-col terminal + 4-col sidebar
 * Source: .kiro/DESIGN.md §9 Screen 4
 */

import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Footer } from "@/components/layout/Footer";

const LOG_TEMPLATES = [
  { level: "INFO", msg: "Analyzing payload structure from port 443...", color: "text-on-surface-variant" },
  { level: "WARN", msg: "Anomalous traffic spike detected on Subnet-Delta.", color: "text-secondary-fixed-dim" },
  { level: "ALERT", msg: "Unauthorized execution attempt blocked.", color: "text-error" },
  { level: "SYS", msg: "Re-routing packets through Proxy-Gateway-C.", color: "text-primary-container" },
  { level: "DATA", msg: "Hash verification successful. 0xA9F2...4B", color: "text-outline-variant" },
];

export default function SecurityTerminal() {
  return (
    <div className="p-4 md:p-container-padding overflow-y-auto h-full">
      <PageHeader />
      <BentoGrid />
      <TelemetryTableClient />
      <Footer />
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          Zero-Trust Security Log
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Live intercept telemetry and protocol breach analysis.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-container/30 bg-primary-container/10">
          <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse-cyan" />
          <span className="font-data-mono text-data-mono text-primary-container text-[12px]">SYSTEM ACTIVE</span>
        </div>
        <button className="btn-primary px-4 py-2 rounded-lg font-label-caps text-label-caps flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export Dump
        </button>
      </div>
    </div>
  );
}

function BentoGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
      <div className="lg:col-span-8">
        <TerminalPanel />
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        <ThreatLevelPanel />
        <InterceptsPanel />
        <BreachPanel />
      </div>
    </div>
  );
}

function TerminalPanel() {
  const termRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<Array<{ time: string; level: string; msg: string; color: string }>>([
    { time: "08:14:02.102", level: "SYS", msg: "Initializing secure connection to node 7...", color: "text-primary-container" },
    { time: "08:14:02.145", level: "SYS", msg: "Handshake verified. 2048-bit encryption active.", color: "text-primary-container" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
        const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
        setLogs((prev) => [...prev.slice(-49), { time, level: template.level, msg: template.msg, color: template.color }]);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  return (
    <GlassPanel className="flex flex-col h-[500px] lg:h-[600px] border-t border-primary-container/20">
      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface-dim/50 rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">terminal</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">AiRevl // Terminal_v9.4.1</span>
        </div>
        <div className="flex gap-2">
          <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary-container text-[18px]">search</span>
          <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary-container text-[18px]">filter_list</span>
        </div>
      </div>
      <div ref={termRef} className="flex-1 log-terminal p-6 font-data-mono text-[13px] leading-relaxed text-on-surface-variant overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="log-entry py-1 log-animate">
            <span className="text-on-surface-variant/50 mr-4">{log.time}</span>
            <span className={log.color}>[{log.level}]</span>
            <span className={`ml-2 ${log.level === "ALERT" ? "text-error" : "text-on-surface"}`}>{log.msg}</span>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3 bg-surface-dim/30 rounded-b-xl">
        <span className="font-data-mono text-primary-container animate-pulse-cyan">&gt;</span>
        <input className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-data-mono text-data-mono p-0 placeholder-on-surface-variant/30" placeholder="Enter command sequence..." />
      </div>
    </GlassPanel>
  );
}

function ThreatLevelPanel() {
  return (
    <GlassPanel active className="p-6">
      <h3 className="font-label-caps text-label-caps text-on-surface mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        Global Threat Level
      </h3>
      <div className="flex items-end gap-4 mb-4">
        <span className="font-display-lg text-display-lg text-primary-container leading-none">4.2</span>
        <span className="font-data-mono text-on-surface-variant mb-1">/ 10.0 (Elevated)</span>
      </div>
      <div className="h-16 w-full chart-grid relative mt-4 border border-white/5 rounded">
        <svg className="absolute inset-0" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40" width="100%">
          <path d="M0,35 Q10,25 20,30 T40,20 T60,10 T80,15 T100,5" fill="none" stroke="#00f0ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d="M0,35 Q10,25 20,30 T40,20 T60,10 T80,15 T100,5 L100,40 L0,40 Z" fill="url(#cyan-grad-sec)" opacity="0.2" />
          <defs>
            <linearGradient id="cyan-grad-sec" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </GlassPanel>
  );
}

function InterceptsPanel() {
  const intercepts = [
    { name: "Node-Alpha-9", status: "Tracking", color: "bg-secondary-container/20 text-secondary-fixed-dim border-secondary-container/50" },
    { name: "Proxy-Gateway-C", status: "Intercepted", color: "bg-primary-container/10 text-primary-container border-primary-container/30" },
    { name: "Subnet-Delta-2", status: "Breach Attempt", color: "bg-error-container/20 text-error border-error-container/50" },
  ];
  return (
    <GlassPanel className="p-6">
      <h3 className="font-label-caps text-label-caps text-on-surface mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-[18px]">radar</span>
        Active Intercepts
      </h3>
      <div className="flex flex-col gap-3">
        {intercepts.map((item, i) => (
          <div key={i} className={`flex justify-between items-center py-2 ${i < intercepts.length - 1 ? "border-b border-white/5" : ""}`}>
            <span className="font-data-mono text-data-mono text-on-surface-variant">{item.name}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-label-caps border ${item.color}`}>{item.status}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function BreachPanel() {
  return (
    <GlassPanel className="p-6 border-l-2 border-l-secondary-container">
      <h3 className="font-label-caps text-label-caps text-on-surface mb-2">Recent Breaches</h3>
      <div className="flex items-center gap-4 mt-4">
        <div className="w-12 h-12 rounded bg-surface-dim border border-white/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-on-secondary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        </div>
        <div>
          <p className="font-data-mono text-[14px] text-on-surface font-semibold">Unauthorized Access</p>
          <p className="font-body-md text-[12px] text-on-surface-variant">IP: 192.168.x.x - 4 mins ago</p>
        </div>
      </div>
    </GlassPanel>
  );
}

function TelemetryTableClient() {
  const [rows, setRows] = useState<Array<{ timestamp: string; source: string; destination: string; protocol: string; status: string }>>([]);

  useEffect(() => {
    fetch("/api/security-telemetry")
      .then((r) => r.json())
      .then((data) => setRows(data.rows ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="mt-6 glass-panel rounded-xl p-6 overflow-x-auto">
      <h3 className="font-label-caps text-label-caps text-on-surface mb-4">Node Telemetry Stream</h3>
      <table className="w-full text-left font-data-mono text-[13px]">
        <thead>
          <tr className="text-on-surface-variant border-b border-white/10">
            <th className="py-3 px-4 font-medium">Timestamp</th>
            <th className="py-3 px-4 font-medium">Source</th>
            <th className="py-3 px-4 font-medium">Destination</th>
            <th className="py-3 px-4 font-medium">Protocol</th>
            <th className="py-3 px-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-3 px-4 text-on-surface-variant">{row.timestamp.split("T")[1]?.slice(0, 12)}</td>
              <td className="py-3 px-4 text-on-surface">{row.source}</td>
              <td className="py-3 px-4 text-on-surface">{row.destination}</td>
              <td className="py-3 px-4 text-secondary-fixed-dim">{row.protocol}</td>
              <td className="py-3 px-4">
                <span className={row.status === "allowed" ? "text-primary-container" : "text-error"}>
                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
