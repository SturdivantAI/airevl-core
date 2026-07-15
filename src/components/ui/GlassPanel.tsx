"use client";

import { type ReactNode, type HTMLAttributes } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  active?: boolean;   // adds glow-active border + shadow
  hoverable?: boolean; // adds hover:glow-active transition
}

export function GlassPanel({
  children,
  active = false,
  hoverable = false,
  className = "",
  ...props
}: GlassPanelProps) {
  const base = "glass-panel rounded-xl";
  const activeClass = active ? "glass-panel-active" : "";
  const hoverClass = hoverable ? "hover:glow-active transition-all duration-300" : "";

  return (
    <div className={`${base} ${activeClass} ${hoverClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
