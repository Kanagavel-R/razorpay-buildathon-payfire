"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  className = "",
}) => {
  const buttonText = actionLabel || actionText;

  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center backdrop-blur-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {buttonText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};
