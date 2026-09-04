"use client";

import React from "react";
import {
  Activity,
  Flame,
  Cpu,
  Sliders,
  PlaySquare,
  ShieldCheck,
  FileText,
  CheckCircle,
  ExternalLink,
  Zap,
  X,
} from "lucide-react";

export type NavTab = "overview" | "chaos" | "ai" | "strategies" | "simulation" | "safety" | "audit";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDegraded?: boolean;
  hasRca?: boolean;
  hasSimulation?: boolean;
  safetyPending?: boolean;
  backendHealthy?: boolean;
  razorpayMode?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  isDegraded = false,
  hasRca = false,
  hasSimulation = false,
  safetyPending = false,
  backendHealthy = true,
  razorpayMode = "SYNTHETIC_SIMULATOR",
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Live Telemetry",
      icon: Activity,
      badge: isDegraded ? "INCIDENT" : "HEALTHY",
      badgeVariant: isDegraded ? "danger" : "success",
    },
    {
      id: "chaos" as NavTab,
      label: "Chaos Lab",
      icon: Flame,
      badge: isDegraded ? "ACTIVE" : undefined,
      badgeVariant: "warning",
    },
    {
      id: "ai" as NavTab,
      label: "AI Diagnosis",
      icon: Cpu,
      badge: hasRca ? "READY" : isDegraded ? "ALERT" : undefined,
      badgeVariant: hasRca ? "info" : "danger",
    },
    {
      id: "strategies" as NavTab,
      label: "Strategies",
      icon: Sliders,
      badge: hasSimulation ? "GENERATED" : undefined,
      badgeVariant: "neutral",
    },
    {
      id: "simulation" as NavTab,
      label: "Simulation Matrix",
      icon: PlaySquare,
      badge: hasSimulation ? "SIMPY" : undefined,
      badgeVariant: "success",
    },
    {
      id: "safety" as NavTab,
      label: "Safety Gate",
      icon: ShieldCheck,
      badge: safetyPending ? "REVIEW" : "8 RULES",
      badgeVariant: safetyPending ? "warning" : "neutral",
    },
    {
      id: "audit" as NavTab,
      label: "Audit Trail",
      icon: FileText,
      badge: undefined,
      badgeVariant: "neutral",
    },
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col h-screen select-none transition-transform duration-200 ease-in-out ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-xl">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white tracking-tight text-base">PayFire</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  CHAOS LAB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">AI Payment Resilience</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Tag */}
        <div className="px-4 py-2.5 mx-3 mt-3 rounded-md bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
          <span className="text-slate-400 font-medium text-[11px]">Runtime Mode:</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="h-2.5 w-2.5 mr-1 text-indigo-400" />
            {razorpayMode.replace("_", " ")}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Resilience Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.badgeVariant === "danger"
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : item.badgeVariant === "warning"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : item.badgeVariant === "success"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : item.badgeVariant === "info"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  backendHealthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span className="text-[11px] font-medium text-slate-300">
                {backendHealthy ? "Core Engine Live" : "Engine Disconnected"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
          </div>

          <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex flex-col space-y-1">
            <div className="flex justify-between">
              <span>Safety Guardrails:</span>
              <span className="text-emerald-400 font-mono font-semibold">8 / 8 Active</span>
            </div>
            <div className="flex justify-between">
              <span>Audit Digest:</span>
              <span className="text-indigo-400 font-mono font-semibold">SHA-256</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
