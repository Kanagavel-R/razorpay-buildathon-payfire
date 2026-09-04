"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { StatusBadge, BadgeVariant } from "./StatusBadge";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: "neutral" | "success" | "warning" | "danger" | "purple";
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  badgeText?: string;
  badgeVariant?: string;
  trend?: string;
  className?: string;
}

const variantStyles = {
  neutral: {
    border: "border-slate-800 hover:border-slate-700",
    iconBg: "bg-slate-800/60 text-slate-300",
    valueText: "text-slate-100",
  },
  success: {
    border: "border-slate-800 hover:border-emerald-500/40",
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    valueText: "text-emerald-400",
  },
  warning: {
    border: "border-slate-800 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    valueText: "text-amber-400",
  },
  danger: {
    border: "border-rose-900/40 hover:border-rose-500/60 bg-rose-950/10",
    iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    valueText: "text-rose-400",
  },
  purple: {
    border: "border-slate-800 hover:border-purple-500/40",
    iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    valueText: "text-purple-300",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "neutral",
  badge,
  badgeText,
  badgeVariant,
  trend,
  className = "",
}) => {
  const styles = variantStyles[variant];

  // Resolve badge object from either badge or badgeText/badgeVariant props
  const resolvedBadgeText = badge?.text || badgeText;
  const resolvedBadgeStatus = badgeVariant || (badge?.variant as string);

  return (
    <div
      className={`rounded-xl bg-[#0f172a]/90 border p-4 sm:p-5 backdrop-blur-sm transition-all duration-200 shadow-sm ${styles.border} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</span>
        <div className={`p-2 rounded-lg ${styles.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${styles.valueText}`}>
          {value}
        </span>
        {resolvedBadgeText && (
          <StatusBadge label={resolvedBadgeText} status={resolvedBadgeStatus} size="sm" />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate pr-2">{subtitle}</span>
        {trend && (
          <span className="font-mono text-[11px] font-semibold text-slate-300 flex-shrink-0">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
