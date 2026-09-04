"use client";

import React from "react";
import { CounterfactualMatrixResponse, SimulationResultItem } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR, formatPercent, formatMs, formatIndianNumber } from "@/lib/formatters";
import {
  Sliders,
  Award,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface StrategiesViewProps {
  counterfactuals: CounterfactualMatrixResponse | null;
  onSelectStrategy: (strategyId: string) => void;
  selectedStrategyId?: string;
  onNavigateTab: (tab: any) => void;
}

export function StrategiesView({
  counterfactuals,
  onSelectStrategy,
  selectedStrategyId,
  onNavigateTab,
}: StrategiesViewProps) {
  if (!counterfactuals || !counterfactuals.results || counterfactuals.results.length === 0) {
    return (
      <EmptyState
        title="No Mitigation Strategies Generated"
        description="Run an AI Diagnosis on an active incident to formulate and evaluate multi-arm recovery strategies."
        actionLabel="Go to AI Diagnosis"
        onAction={() => onNavigateTab("ai")}
        icon={Sliders}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Mitigation Strategies Comparison
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
              {counterfactuals.results.length} Candidates Evaluated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic recovery predictions computed for unmitigated exposure of{" "}
            <strong className="text-rose-400">
              {formatINR(counterfactuals.baseline_unmitigated_loss_inr)}
            </strong>
          </p>
        </div>

        <button
          onClick={() => onNavigateTab("simulation")}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <span>View SimPy Simulation Runs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Strategies Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counterfactuals.results.map((item: SimulationResultItem) => {
          const isRec = item.is_recommended;
          const isSelected = item.strategy_id === selectedStrategyId;

          return (
            <div
              key={item.strategy_id}
              className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                isRec
                  ? "border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-950/20"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              } ${isSelected ? "ring-2 ring-indigo-500" : ""}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    {isRec ? (
                      <span className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
                        <Award className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-md bg-slate-800 text-slate-400">
                        <Sliders className="h-4 w-4" />
                      </span>
                    )}
                    <h4 className="text-sm font-bold text-white">{item.strategy_name}</h4>
                  </div>
                  {isRec ? (
                    <StatusBadge status="RECOMMENDED" />
                  ) : !item.safety_compliance ? (
                    <StatusBadge status="BLOCKED" />
                  ) : (
                    <StatusBadge status="REVIEW" />
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {item.recommendation_reason ||
                    `Recovery strategy adjusting route traffic and retry backoff limits.`}
                </p>

                {/* Strategy Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Recovered GMV
                    </span>
                    <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                      {formatINR(item.recovered_gmv_inr)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Recovery Rate
                    </span>
                    <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                      {formatPercent(item.net_recovery_rate)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Latency (Avg)
                    </span>
                    <div className="text-xs font-mono text-slate-300 mt-0.5">
                      {formatMs(item.avg_latency_ms)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Duplicate Risk
                    </span>
                    <div
                      className={`text-xs font-mono font-bold mt-0.5 ${
                        item.duplicate_risk_count > 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {item.duplicate_risk_count > 0
                        ? `${item.duplicate_risk_count} Risk`
                        : "0 (Zero)"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {item.arm_type !== "baseline" ? (
                  <button
                    onClick={() => onSelectStrategy(item.strategy_id)}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 ${
                      isRec
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <span>Inspect Safety Gate & Policy</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-500 font-mono">
                    Baseline Unmitigated Run
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
