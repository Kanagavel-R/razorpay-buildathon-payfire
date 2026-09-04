"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "neutral" | "danger" | "success" | "warning";
  trend?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "neutral",
  trend,
}) => {
  const variantStyles = {
    neutral: "border-gray-800 bg-gray-900/60 text-gray-100",
    danger: "border-red-900/60 bg-red-950/20 text-red-400 shadow-red-950/30",
    success: "border-emerald-900/60 bg-emerald-950/20 text-emerald-400",
    warning: "border-amber-900/60 bg-amber-950/20 text-amber-400",
  };

  const iconStyles = {
    neutral: "bg-gray-800 text-gray-300",
    danger: "bg-red-900/40 text-red-400 border border-red-800/50",
    success: "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50",
    warning: "bg-amber-900/40 text-amber-400 border border-amber-800/50",
  };

  return (
    <div
      className={`p-5 rounded-2xl border backdrop-blur-sm transition-all shadow-md ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
            <span>{subtitle}</span>
            {trend && <span className="font-semibold text-red-400">{trend}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
