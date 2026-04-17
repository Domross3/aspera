"use client";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variants = {
    default: "bg-elevated text-text-secondary border border-border",
    success: "bg-success/20 text-success border border-success/30",
    warning: "bg-warning/20 text-warning border border-warning/30",
    danger: "bg-danger/20 text-danger border border-danger/30",
    accent: "bg-accent/20 text-accent border border-accent/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span className={`inline-flex items-center rounded-pill font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
