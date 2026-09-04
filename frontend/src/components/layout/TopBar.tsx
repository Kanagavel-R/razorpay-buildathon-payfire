"use client";

import React from "react";
import { NavTab } from "./Sidebar";
import {
  RotateCcw,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  Check,
  Menu,
} from "lucide-react";

interface TopBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onReset: () => void;
  isResetting: boolean;
  isDegraded: boolean;
  hasRca: boolean;
  hasSimulation: boolean;
  safetyApproved: boolean;
  isExecuted: boolean;
  onOpenMobileMenu?: () => void;
}

export function TopBar({
  activeTab,
  onTabChange,
  onReset,
  isResetting,
  isDegraded,
  hasRca,
  hasSimulation,
  safetyApproved,
  isExecuted,
  onOpenMobileMenu,
}: TopBarProps) {
  // Stepper lifecycle items
  const steps = [
    { id: "overview" as NavTab, label: "1. Baseline", completed: true },
    { id: "chaos" as NavTab, label: "2. Chaos", completed: isDegraded },
    { id: "ai" as NavTab, label: "3. Diagnosis", completed: hasRca },
    { id: "strategies" as NavTab, label: "4. Strategies", completed: hasSimulation },
    { id: "simulation" as NavTab, label: "5. Simulation", completed: hasSimulation },
    { id: "safety" as NavTab, label: "6. Safety", completed: safetyApproved },
    { id: "audit" as NavTab, label: "7. Result", completed: isExecuted },
  ];

  return (
    <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Mobile Menu Button & Stepper */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase tracking-wider mr-1 hidden sm:inline">
            FLOW:
          </span>
          {steps.map((step, idx) => {
            const isCurrent = activeTab === step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onTabChange(step.id)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all whitespace-nowrap ${
                    isCurrent
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold"
                      : step.completed
                      ? "text-emerald-400 hover:bg-slate-800/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  {step.completed && !isCurrent ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isCurrent
                          ? "bg-indigo-400 animate-ping"
                          : step.completed
                          ? "bg-emerald-400"
                          : "bg-slate-600"
                      }`}
                    />
                  )}
                  <span>{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-slate-700 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
          {isDegraded && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono animate-pulse">
              <Flame className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">INCIDENT IN PROGRESS</span>
              <span className="sm:hidden">INCIDENT</span>
            </div>
          )}

          <button
            onClick={onReset}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:text-white transition disabled:opacity-50"
            title="Reset simulation back to normal healthy baseline"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-slate-400 ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Resetting..." : "Restore Baseline"}</span>
          </button>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <span>API Docs</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
