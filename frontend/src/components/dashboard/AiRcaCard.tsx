"use client";

import React, { useState } from "react";
import { RcaResult } from "@/lib/types";
import {
  BrainCircuit,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface AiRcaCardProps {
  rca: RcaResult | null;
  isLoading: boolean;
  onAnalyze: () => Promise<void>;
  onSimulate: () => Promise<void>;
  isSimulating: boolean;
  hasStrategies: boolean;
}

export const AiRcaCard: React.FC<AiRcaCardProps> = ({
  rca,
  isLoading,
  onAnalyze,
  onSimulate,
  isSimulating,
  hasStrategies,
}) => {
  const [showMultiAgentDetails, setShowMultiAgentDetails] = useState<boolean>(false);

  if (!rca) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center py-12">
        <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400 mb-3">
          <BrainCircuit className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-base font-semibold text-white">AI Incident Diagnostics Ready</h3>
        <p className="text-xs text-gray-400 max-w-md mt-1 mb-4">
          Activate the 6-agent Root Cause Analysis engine to evaluate error patterns, route latency distributions, and isolate infrastructural bottlenecks.
        </p>
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/50 transition-all disabled:opacity-50"
        >
          <BrainCircuit className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Diagnosing with 6 AI Agents..." : "RUN AI ROOT CAUSE ANALYSIS"}</span>
        </button>
      </div>
    );
  }

  const isFallback = rca.data_mode === "DETERMINISTIC_FALLBACK";

  return (
    <div className="rounded-2xl border border-purple-900/40 bg-gray-900/80 p-6 backdrop-blur-sm shadow-xl shadow-purple-950/20 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">AI Incident Diagnostics</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold ${
                  isFallback
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-purple-500/20 border-purple-500/40 text-purple-300"
                }`}
              >
                {isFallback ? "Deterministic Fallback Mode" : "6-Agent Collaborative Analysis"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Scenario, Root Cause, Revenue Risk, Strategy, Safety, & Explanation Agents
            </p>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center space-x-2 bg-gray-950 px-3.5 py-1.5 rounded-xl border border-gray-800">
          <span className="text-xs text-gray-400">Confidence:</span>
          <span className="text-sm font-bold font-mono text-purple-400">
            {(rca.confidence * 100).toFixed(0)}%
          </span>
          <div className="w-16 bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                rca.confidence >= 0.75 ? "bg-purple-500" : "bg-amber-500"
              }`}
              style={{ width: `${rca.confidence * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Executive Headline & Root Cause Statement */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2">
        {rca.explanation_generator?.headline && (
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{rca.explanation_generator.headline}</span>
          </div>
        )}
        <p className="text-sm text-gray-100 font-medium leading-relaxed">
          {rca.root_cause}
        </p>
      </div>

      {/* Grid: Empirical Evidence & Component Blast Radius */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Empirical Evidence */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Empirical Evidence Telemetry</span>
          </span>
          <div className="space-y-1.5">
            {rca.evidence.map((ev, i) => (
              <div
                key={i}
                className="text-xs text-gray-300 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/80 flex items-start space-x-2"
              >
                <span className="text-purple-400 font-mono text-[10px] mt-0.5">#{i + 1}</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Components & Operational Recommendation */}
        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5 mb-2">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>Affected Components</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rca.affected_components.map((c, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-md bg-red-950/50 border border-red-900/60 text-red-300 font-mono"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gray-950/70 border border-gray-800">
            <span className="text-[11px] font-semibold text-gray-400 uppercase block mb-1">
              Recommended Recovery Vector
            </span>
            <p className="text-xs text-gray-200">
              {rca.recommended_action_summary || "Reroute volume to healthy secondary acquirer."}
            </p>
          </div>

          {rca.uncertainties && rca.uncertainties.length > 0 && (
            <div className="text-[11px] text-gray-400 bg-gray-950/40 p-2.5 rounded-lg border border-gray-800/60 flex items-start space-x-2">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <span>{rca.uncertainties[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Agent Breakdown Toggle */}
      {rca.scenario_analyst && (
        <div className="border-t border-gray-800/80 pt-3">
          <button
            onClick={() => setShowMultiAgentDetails(!showMultiAgentDetails)}
            className="flex items-center space-x-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showMultiAgentDetails ? "Hide 6-Agent Diagnostics" : "View Detailed 6-Agent Diagnostics"}</span>
            {showMultiAgentDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showMultiAgentDetails && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Agent 1: Scenario Analyst</span>
                <p className="text-gray-200 mt-1">{rca.scenario_analyst.scenario_name}</p>
                <span className="text-[10px] text-gray-500 font-mono">
                  Multiplier: {rca.scenario_analyst.traffic_multiplier}x
                </span>
              </div>

              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Agent 3: Revenue Risk</span>
                <p className="text-gray-200 mt-1 font-mono font-bold text-rose-400">
                  ₹{rca.revenue_at_risk_inr.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">Deterministic Math</span>
              </div>

              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Agent 5: Safety Pre-Flight</span>
                <p className="text-gray-200 mt-1">
                  {rca.is_autonomous_allowed ? "Autonomous Simulation Allowed" : "Human Approval Required"}
                </p>
                <span className="text-[10px] text-purple-400 font-mono">Guardrails Verified</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-400">
          Estimated Revenue At Risk:{" "}
          <strong className="text-white font-mono text-sm">
            ₹{rca.revenue_at_risk_inr.toLocaleString("en-IN")}
          </strong>
        </div>

        <button
          onClick={onSimulate}
          disabled={isSimulating}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-950/60 transition-all disabled:opacity-50"
        >
          <span>{isSimulating ? "Simulating Counterfactuals..." : "SIMULATE RECOVERY STRATEGIES"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
