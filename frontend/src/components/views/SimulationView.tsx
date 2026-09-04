"use client";

import React from "react";
import { CounterfactualMatrixResponse } from "@/lib/types";
import { CounterfactualTable } from "@/components/dashboard/CounterfactualTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShieldCheck, PlaySquare, Info, Award, HelpCircle } from "lucide-react";

interface SimulationViewProps {
  counterfactuals: CounterfactualMatrixResponse | null;
  onSelectStrategy: (strategyId: string) => void;
  selectedStrategyId?: string;
  onNavigateTab: (tab: any) => void;
}

export function SimulationView({
  counterfactuals,
  onSelectStrategy,
  selectedStrategyId,
  onNavigateTab,
}: SimulationViewProps) {
  if (!counterfactuals || !counterfactuals.results || counterfactuals.results.length === 0) {
    return (
      <EmptyState
        title="No Simulation Matrix Available"
        description="Run the SimPy Discrete-Event Simulation from AI Diagnosis to generate a counterfactual recovery matrix across multiple parallel policy arms."
        actionLabel="Go to AI Diagnosis"
        onAction={() => onNavigateTab("ai")}
        icon={PlaySquare}
      />
    );
  }

  const recommendedItem = counterfactuals.results.find((r) => r.is_recommended);

  return (
    <div className="space-y-6">
      {/* Simulation Engine Environment Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <PlaySquare className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">SimPy Discrete-Event Simulation Sandbox</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                1,000 TXNS / ARM
              </span>
            </div>
            <p className="text-slate-400 mt-0.5">
              Deterministic stochastic modeling with reproducible seed (seed=42). Zero mock data.
            </p>
          </div>
        </div>

        {recommendedItem && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium shrink-0">
            <Award className="h-4 w-4 text-emerald-400" />
            <span>Optimal: {recommendedItem.strategy_name}</span>
          </div>
        )}
      </div>

      {/* Counterfactual Matrix Table */}
      <CounterfactualTable
        counterfactuals={counterfactuals}
        onSelectStrategy={onSelectStrategy}
        selectedStrategyId={selectedStrategyId}
      />

      {/* SimPy Methodology Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm text-xs space-y-3">
        <div className="flex items-center space-x-2 font-semibold text-slate-200">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>Counterfactual Evaluation Methodology</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          The simulation runs 4 arms simultaneously against the degraded route conditions:
          <br />• <strong>Baseline (Do Nothing):</strong> Measures pure financial fallout without intervention.
          <br />• <strong>Aggressive Retry:</strong> Retries immediately with exponential backoff (tests duplicate charge risk).
          <br />• <strong>Traffic Shift (Smart Reroute):</strong> Drains traffic away from degraded route to secondary rail.
          <br />• <strong>Multi-Route Fallback:</strong> Splits traffic dynamically and degrades non-critical feature flags.
        </p>
      </div>
    </div>
  );
}
