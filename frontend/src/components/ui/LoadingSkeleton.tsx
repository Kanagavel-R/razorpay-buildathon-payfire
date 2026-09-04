"use client";

import React from "react";
import { BrainCircuit } from "lucide-react";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  title?: string;
  subtitle?: string;
  rows?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "h-6 w-full",
  lines = 1,
  title,
  subtitle,
  rows,
}) => {
  const count = rows || lines;

  if (title || subtitle) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm space-y-4 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <BrainCircuit className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{title || "Loading..."}</h4>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="space-y-2.5 pt-2">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={`rounded-lg bg-slate-800/60 ${
                i === count - 1 ? "w-3/4 h-4" : "w-full h-4"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (count > 1) {
    return (
      <div className="space-y-2.5 w-full animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`rounded-lg bg-slate-800/60 ${
              i === count - 1 ? "w-3/4 h-4" : "w-full h-4"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg bg-slate-800/60 animate-pulse ${className}`}
    />
  );
};
