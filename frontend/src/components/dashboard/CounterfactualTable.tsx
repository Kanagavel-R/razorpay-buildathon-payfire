"use client";

import React from "react";
import { CounterfactualMatrixResponse, SimulationResultItem } from "@/lib/types";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Award, ArrowUpRight } from "lucide-react";

interface CounterfactualTableProps {
  counterfactuals: CounterfactualMatrixResponse | null;
  onSelectStrategy: (strategyId: string) => void;
  selectedStrategyId?: string;
}

export const CounterfactualTable: React.FC<CounterfactualTableProps> = ({
  counterfactuals,
  onSelectStrategy,
  selectedStrategyId,
}) => {
  if (!counterfactuals || !counterfactuals.results || counterfactuals.results.length === 0) {
    return null;
  }

  const recommendedItem = counterfactuals.results.find((r) => r.is_recommended);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white">Counterfactual Strategy Comparison</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              SimPy Discrete-Event Simulation
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Side-by-side evaluation of financial recovery, operational latency, and risk guardrails
          </p>
        </div>

        <span className="text-xs text-gray-400 font-mono self-start sm:self-auto">
          Baseline Loss:{" "}
          <strong className="text-red-400">
            ₹{counterfactuals.baseline_unmitigated_loss_inr.toLocaleString("en-IN")}
          </strong>
        </span>
      </div>

      {/* Comparison Matrix Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 uppercase font-mono text-[11px]">
              <th className="py-3 px-3">Strategy Candidate</th>
              <th className="py-3 px-3 text-right">Recovered GMV</th>
              <th className="py-3 px-3 text-right">Recovery Rate</th>
              <th className="py-3 px-3 text-center">Duplicate Risk</th>
              <th className="py-3 px-3 text-right">Avg Latency</th>
              <th className="py-3 px-3 text-center">Safety Policy</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-sans">
            {counterfactuals.results.map((item: SimulationResultItem) => {
              const isSelected = item.strategy_id === selectedStrategyId;
              const isRec = item.is_recommended;

              return (
                <tr
                  key={item.strategy_id}
                  className={`transition-colors ${
                    isRec
                      ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                      : "hover:bg-gray-800/40"
                  } ${isSelected ? "ring-1 ring-blue-500" : ""}`}
                >
                  {/* Strategy Name & Badge */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      {isRec && (
                        <span title="Recommended">
                          <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                        </span>
                      )}
                      <div>
                        <div className="font-semibold text-gray-100 flex items-center space-x-1.5">
                          <span>{item.strategy_name}</span>
                          {isRec && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 uppercase">
                          Arm: {item.arm_type}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Recovered GMV */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-sm">
                    {item.recovered_gmv_inr > 0 ? (
                      <span className="text-emerald-400">
                        ₹{item.recovered_gmv_inr.toLocaleString("en-IN")}
                      </span>
                    ) : (
                      <span className="text-gray-500">₹0</span>
                    )}
                  </td>

                  {/* Recovery Rate */}
                  <td className="py-3.5 px-3 text-right font-mono font-semibold">
                    <span
                      className={
                        item.net_recovery_rate > 0.7
                          ? "text-emerald-400"
                          : item.net_recovery_rate > 0.3
                          ? "text-amber-400"
                          : "text-gray-500"
                      }
                    >
                      {(item.net_recovery_rate * 100).toFixed(1)}%
                    </span>
                  </td>

                  {/* Duplicate Risk */}
                  <td className="py-3.5 px-3 text-center">
                    {item.duplicate_risk_count > 0 ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 text-red-400 font-mono text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{item.duplicate_risk_count} VIOLATIONS</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px]">0 (Safe)</span>
                    )}
                  </td>

                  {/* Avg Latency */}
                  <td className="py-3.5 px-3 text-right font-mono text-gray-300">
                    {item.avg_latency_ms.toFixed(0)} ms
                  </td>

                  {/* Safety Compliance */}
                  <td className="py-3.5 px-3 text-center">
                    {item.safety_compliance ? (
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-red-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Blocked (G4)</span>
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-center">
                    {item.arm_type !== "baseline" && (
                      <button
                        onClick={() => onSelectStrategy(item.strategy_id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isRec
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                            : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                        }`}
                      >
                        Inspect Safety
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* WHY THIS STRATEGY? Card */}
      {recommendedItem && (
        <div className="mt-5 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50">
          <div className="flex items-center space-x-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
              Why This Strategy? (AI Recommendation Rationale)
            </span>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed">
            {recommendedItem.recommendation_reason ||
              "Achieves the optimal financial recovery while strictly satisfying all 8 deterministic payment safety guardrails with zero duplicate debits."}
          </p>
        </div>
      )}
    </div>
  );
};
