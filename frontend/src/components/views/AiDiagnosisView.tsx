"use client";

import React, { useState } from "react";
import { RcaResult, IncidentState } from "@/lib/types";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR, formatPercent, formatIndianNumber } from "@/lib/formatters";
import {
  BrainCircuit,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Coins,
  TrendingDown,
  Radio,
  FileText,
} from "lucide-react";

interface AiDiagnosisViewProps {
  rca: RcaResult | null;
  incident: IncidentState | null;
  isLoading: boolean;
  onAnalyze: () => Promise<void>;
  onSimulate: () => Promise<void>;
  isSimulating: boolean;
  hasStrategies: boolean;
}

export function AiDiagnosisView({
  rca,
  incident,
  isLoading,
  onAnalyze,
  onSimulate,
  isSimulating,
  hasStrategies,
}: AiDiagnosisViewProps) {
  const [showMultiAgentDetails, setShowMultiAgentDetails] = useState<boolean>(true);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton
          title="Executing 6-Agent AI Diagnostic Pipeline..."
          subtitle="Querying Scenario Analyst, Root Cause Analyst, Revenue Risk Calculator, Strategy Generator, Safety Validator, and Executive Explainer..."
          rows={5}
        />
      </div>
    );
  }

  if (!rca) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Diagnostic Telemetry Generated"
          description={
            incident?.is_active_incident
              ? "An active payment incident has been detected in the synthetic sandbox. Run the AI diagnosis engine to pinpoint root cause, affected components, and financial exposure."
              : "Payment rails are currently running at healthy steady-state. Inject a chaos scenario from the Chaos Lab to simulate a failure and observe autonomous AI diagnostics."
          }
          actionLabel={incident?.is_active_incident ? "Run AI Diagnostic Engine" : undefined}
          onAction={incident?.is_active_incident ? onAnalyze : undefined}
          icon={BrainCircuit}
        />
      </div>
    );
  }

  const isFallback = rca.data_mode === "DETERMINISTIC_FALLBACK";

  return (
    <div className="space-y-6">
      {/* Top Banner with Confidence and Mode */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Incident Diagnostic Synthesis
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider border ${
                    isFallback
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                  }`}
                >
                  {isFallback ? "Deterministic Math Engine" : "6-Agent Collaborative Suite"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Incident ID: <span className="font-mono text-slate-300">{rca.incident_id}</span>
              </p>
            </div>
          </div>

          {/* Diagnostic Confidence Score */}
          <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800 self-start sm:self-auto">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Confidence
              </div>
              <div className="text-base font-bold font-mono text-indigo-400">
                {(rca.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  rca.confidence >= 0.75 ? "bg-indigo-500" : "bg-amber-500"
                }`}
                style={{ width: `${rca.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Executive Headline & Plain English Root Cause */}
        <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
          {rca.explanation_generator?.headline && (
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>{rca.explanation_generator.headline}</span>
            </div>
          )}
          <p className="text-sm text-slate-200 leading-relaxed font-normal">{rca.root_cause}</p>
        </div>

        {/* 2-Column Breakdown: Evidence & Financial Exposure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Empirical Telemetry Evidence */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Empirical Telemetry Evidence</span>
            </span>
            <div className="space-y-2">
              {rca.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 flex items-start space-x-2.5 leading-relaxed"
                >
                  <span className="text-indigo-400 font-mono font-bold text-[11px] shrink-0">
                    0{i + 1}.
                  </span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Risk & Affected Components */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-2 mb-2">
                <AlertOctagon className="h-4 w-4 text-rose-400" />
                <span>Impacted Components</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rca.affected_components.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Financial Risk Assessment
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Unmitigated Exposure:</span>
                <span className="text-sm font-mono font-bold text-rose-400">
                  {formatINR(rca.revenue_at_risk_inr)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Impacted Order Volume:</span>
                <span className="text-sm font-mono font-semibold text-slate-200">
                  {formatIndianNumber(rca.affected_volume)} txns
                </span>
              </div>
            </div>

            {/* Uncertainties Callout */}
            {rca.uncertainties && rca.uncertainties.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
                <span className="font-semibold flex items-center space-x-1 text-amber-400">
                  <HelpCircle className="h-3 w-3" />
                  <span>Uncertainty Bounds</span>
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-300/80">
                  {rca.uncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 6-Agent Deep Dive Accordion */}
        <div className="border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setShowMultiAgentDetails(!showMultiAgentDetails)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <span>Multi-Agent Specialist Breakdown (6 Sub-Agents)</span>
            </div>
            {showMultiAgentDetails ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showMultiAgentDetails && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Agent 1: Scenario Analyst */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300">1. Scenario Analyst</span>
                  <span className="text-[10px] font-mono text-slate-400">Decomposition</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Method:{" "}
                  <strong className="text-slate-200">
                    {rca.scenario_analyst?.affected_payment_method || "UPI"}
                  </strong>
                  <br />
                  Route:{" "}
                  <strong className="text-slate-200">
                    {rca.scenario_analyst?.affected_bank || "Bank A"}
                  </strong>
                  <br />
                  Mode:{" "}
                  <strong className="text-slate-200">
                    {rca.scenario_analyst?.failure_mode || "Degradation"}
                  </strong>
                </p>
              </div>

              {/* Agent 2: Root Cause Specialist */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300">2. Root Cause Specialist</span>
                  <span className="text-[10px] font-mono text-slate-400">Pattern Match</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Error Code:{" "}
                  <strong className="text-slate-200">
                    {rca.root_cause_analyst?.primary_failure_code || "BANK_TIMEOUT"}
                  </strong>
                  <br />
                  Bank Failure Ratio:{" "}
                  <strong className="text-slate-200">
                    {formatPercent(rca.root_cause_analyst?.bank_failure_ratio || 0.85)}
                  </strong>
                </p>
              </div>

              {/* Agent 3: Revenue Risk Calculator */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-300">3. Revenue Risk Calc</span>
                  <span className="text-[10px] font-mono text-slate-400">SimEngine</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Engine:{" "}
                  <strong className="text-slate-200">
                    {rca.revenue_risk_analyst?.calculation_engine || "Deterministic Math"}
                  </strong>
                  <br />
                  Exposure:{" "}
                  <strong className="text-rose-400">
                    {formatINR(rca.revenue_risk_analyst?.scaled_revenue_at_risk_inr || rca.revenue_at_risk_inr)}
                  </strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA to Next Stage */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800/80 gap-3">
          <div className="text-xs text-slate-400">
            Next Action: Generate mitigation strategies and run SimPy counterfactual simulation matrix.
          </div>
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <ArrowRight className={`h-4 w-4 ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Running SimPy Simulation..." : "Simulate Mitigation Strategies"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
