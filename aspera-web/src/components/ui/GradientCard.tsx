"use client";
import { ReactNode } from "react";

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  glowAccent?: boolean;
}

export function GradientCard({
  children,
  className = "",
  glowAccent = false,
}: GradientCardProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-elevated to-surface
        border border-border rounded-lg p-4
        ${glowAccent ? "shadow-glow border-border-accent" : "shadow-card"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
