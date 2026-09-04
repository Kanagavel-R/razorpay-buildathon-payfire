"use client";

import React from "react";

export type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "purple"
  | "recommended";

export type SemanticStatus =
  | "PASS"
  | "BLOCKED"
  | "REVIEW"
  | "CRITICAL"
  | "OPTIMAL"
  | "RECOMMENDED"
  | "HEALTHY"
  | "DEGRADED"
  | "ALLOW"
  | "DENIED";

interface StatusBadgeProps {
  label?: string;
  status?: SemanticStatus | string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  danger: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  info: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  neutral: {
    bg: "bg-slate-800/60",
    text: "text-slate-300",
    border: "border-slate-700/60",
    dot: "bg-slate-400",
  },
  recommended: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-300",
    border: "border-emerald-500/50",
    dot: "bg-emerald-400",
  },
};

const resolveStatus = (
  status?: string,
  variant?: BadgeVariant,
  label?: string
): { displayLabel: string; displayVariant: BadgeVariant } => {
  if (status) {
    const s = status.toUpperCase();
    if (s === "PASS" || s === "OPTIMAL" || s === "HEALTHY" || s === "ALLOW" || s === "APPROVED" || s === "EXECUTED") {
      return { displayLabel: label || s, displayVariant: "success" };
    }
    if (s === "BLOCKED" || s === "CRITICAL" || s === "DEGRADED" || s === "DENIED" || s === "FAIL") {
      return { displayLabel: label || s, displayVariant: "danger" };
    }
    if (s === "REVIEW" || s === "WARNING" || s === "APPROVAL REQ") {
      return { displayLabel: label || s, displayVariant: "warning" };
    }
    if (s === "RECOMMENDED") {
      return { displayLabel: label || s, displayVariant: "recommended" };
    }
    return { displayLabel: label || s, displayVariant: variant || "neutral" };
  }
  return { displayLabel: label || "STATUS", displayVariant: variant || "neutral" };
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status,
  variant,
  size = "sm",
  dot = false,
  className = "",
}) => {
  const { displayLabel, displayVariant } = resolveStatus(status, variant, label);
  const styles = variantStyles[displayVariant];
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-mono font-medium rounded-md border tracking-wide uppercase ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
      <span>{displayLabel}</span>
    </span>
  );
};
