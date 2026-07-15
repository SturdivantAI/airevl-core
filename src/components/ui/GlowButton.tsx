"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export function GlowButton({
  children,
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: GlowButtonProps) {
  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-label-caps",
    lg: "px-6 py-3 text-label-caps",
  };

  const variants = {
    primary: "btn-primary rounded font-label-caps font-bold",
    secondary: "btn-secondary rounded font-label-caps font-bold uppercase tracking-wider",
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
