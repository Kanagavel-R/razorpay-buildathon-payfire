"use client";

import React from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { HealthTimeline } from "@/components/dashboard/HealthTimeline";
import { formatINR, formatPercent, formatMs, formatIndianNumber } from "@/lib/formatters";
import { IncidentState } from "@/lib/types";
import {
  Coins,
  CheckCircle,
  Clock,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Flame,
  Layers,
  ArrowRight,
} from "lucide-react";

interface OverviewViewProps {
  healthData: any;
  incident: IncidentState | null;
  isDegraded: boolean;
  isRecovered: boolean;
  onNavigateTab: (tab: any) => void;
  onTriggerChaos: () => void;
  onAnalyzeAi: () => void;
}

export function OverviewView({
  healthData,
  incident,
  isDegraded,
  isRecovered,
  onNavigateTab,
  onTriggerChaos,
  onAnalyzeAi,
}: OverviewViewProps) {
  const successRate = incident ? incident.success_rate : 0.985;
  const failureRate = incident ? incident.failure_rate : 0.015;
  const revAtRisk = incident ? incident.revenue_at_risk_inr : 0;
  const latency = incident ? incident.avg_latency_ms : 820;
  const affectedVolume = incident?.transactions_affected || 0;

  return (
    <div className="space-y-6">
      {/* Active Incident Alert Banner if Degraded */}
      {isDegraded ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Active Payment Degradation: {incident?.scenario_name || "Custom Outage"}
                  </h3>
                  <StatusBadge status="CRITICAL" />
                </div>
                <p className="text-xs text-rose-300/80 mt-1 max-w-2xl leading-relaxed">
                  Severe route degradation detected on{" "}
                  <strong className="text-white">{incident?.affected_payment_method || "UPI"}</strong> via{" "}
                  <strong className="text-white">{incident?.affected_bank || "HDFC Bank"}</strong>.
                  Estimated unmitigated GMV loss is {formatINR(revAtRisk)}.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={onAnalyzeAi}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition"
              >
                <span>Diagnose with AI</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white">All Payment Rails Nominal</h3>
                <StatusBadge status="PASS" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Baseline simulation environment operating at 98.5% conversion SLA.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("chaos")}
            className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center space-x-2 transition"
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Launch Chaos Experiment</span>
          </button>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue at Risk"
          value={formatINR(revAtRisk)}
          subtitle={isDegraded ? "Unmitigated downstream revenue" : "Zero financial exposure"}
          icon={Coins}
          variant={isDegraded ? "danger" : "success"}
          badgeText={isDegraded ? "Critical" : "Protected"}
          badgeVariant={isDegraded ? "critical" : "pass"}
        />

        <MetricCard
          title="Payment Success Rate"
          value={formatPercent(successRate)}
          subtitle={isDegraded ? "Below SLA target (98.0%)" : "Optimal (SLA > 98.0%)"}
          icon={CheckCircle}
          variant={successRate < 0.90 ? "danger" : successRate < 0.96 ? "warning" : "success"}
          badgeText={successRate < 0.95 ? "-28.5% SLA" : "+0.5% SLA"}
          badgeVariant={successRate < 0.95 ? "critical" : "pass"}
        />

        <MetricCard
          title="Average Route Latency"
          value={formatMs(latency)}
          subtitle={latency > 2000 ? "Bank upstream queuing" : "Normal route latency (<1000ms)"}
          icon={Clock}
          variant={latency > 2500 ? "danger" : latency > 1500 ? "warning" : "neutral"}
          badgeText={latency > 1500 ? "+3.2x Slow" : "Nominal"}
          badgeVariant={latency > 1500 ? "warning" : "neutral"}
        />

        <MetricCard
          title="Transactions Affected"
          value={formatIndianNumber(affectedVolume)}
          subtitle={isDegraded ? "Orders experiencing failure" : "No failed transactions"}
          icon={AlertOctagon}
          variant={isDegraded ? "danger" : "neutral"}
          badgeText={isDegraded ? "Degraded" : "Nominal"}
          badgeVariant={isDegraded ? "critical" : "pass"}
        />
      </div>

      {/* Health Timeline Graph */}
      <HealthTimeline
        isDegraded={isDegraded}
        isRecovered={isRecovered}
        currentSuccessRate={successRate}
        currentLatency={latency}
      />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab("chaos")}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
              <Flame className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition" />
          </div>
          <h4 className="text-sm font-semibold text-white">Payment Chaos Lab</h4>
          <p className="text-xs text-slate-400 mt-1">
            Inject UPI degradation, bank route failures, timeout cascades, and flash sale spikes.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab("ai")}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
              <Zap className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition" />
          </div>
          <h4 className="text-sm font-semibold text-white">6-Agent AI Diagnosis</h4>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic RCA decomposition, revenue exposure calculation, and mitigating action generation.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab("safety")}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition" />
          </div>
          <h4 className="text-sm font-semibold text-white">8-Rule Safety Policy</h4>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic circuit breakers, duplicate charge prevention, and mandatory human sign-off gates.
          </p>
        </div>
      </div>
    </div>
  );
}
