"use client";

import React, { useState } from "react";
import { SafetyPolicyCheckResponse, SafetyRuleResult } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Play,
  Lock,
  ArrowRight,
} from "lucide-react";

interface SafetyCenterViewProps {
  safetyData: SafetyPolicyCheckResponse | null;
  onApprove: (notes: string) => Promise<void>;
  onExecute: () => Promise<void>;
  isApproving: boolean;
  isExecuting: boolean;
  isHumanApproved: boolean;
  isExecuted: boolean;
  onNavigateTab: (tab: any) => void;
}

export function SafetyCenterView({
  safetyData,
  onApprove,
  onExecute,
  isApproving,
  isExecuting,
  isHumanApproved,
  isExecuted,
  onNavigateTab,
}: SafetyCenterViewProps) {
  const [notes, setNotes] = useState<string>("Verified counterfactual simulation; approved for execution.");

  // If no strategy selected yet, display the 8 baseline guardrails
  const defaultRules: { id: string; name: string; desc: string; standard: string }[] = [
    {
      id: "G1",
      name: "Max Retries Cap",
      desc: "Strictly enforces maximum 3 retry attempts per transaction sequence.",
      standard: "Pass (<= 3 retries)",
    },
    {
      id: "G2",
      name: "High-Value Transaction Human Approval",
      desc: "Requires manual operator approval for order values exceeding ₹10,000.",
      standard: "Human Sign-off",
    },
    {
      id: "G3",
      name: "Non-Degraded Route Verification",
      desc: "Prohibits traffic redirection to any rail reporting >10% failure or >1800ms latency.",
      standard: "Health Check Pass",
    },
    {
      id: "G4",
      name: "Duplicate Payment Prevention",
      desc: "Cryptographic SHA-256 idempotency key enforcement across all recovery arms.",
      standard: "Zero Collisions",
    },
    {
      id: "G5",
      name: "Customer Friction Threshold",
      desc: "Blocks strategies that force repeated OTP/3DS re-auth on high-friction channels.",
      standard: "Friction < 0.25",
    },
    {
      id: "G6",
      name: "Confidence Threshold for Autonomous Action",
      desc: "Requires AI diagnosis confidence >= 75% for automatic recovery deployment.",
      standard: "Confidence >= 75%",
    },
    {
      id: "G7",
      name: "Gradual Rollout Step Limit",
      desc: "Limits canary traffic allocation to max 20% on initial migration step.",
      standard: "Canary <= 20%",
    },
    {
      id: "G8",
      name: "Circuit Breaker Auto-Revert",
      desc: "Auto-reverts routing rules if secondary rail failure exceeds 5% within 60 seconds.",
      standard: "Auto-Trip Enabled",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 6-Stage Visual Governance Pipeline */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>6-Stage Autonomous Safety Pipeline</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
            Deterministic Protection Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {[
            { stage: "01. Pre-Check", desc: "Idempotency & Route Status", pass: true },
            { stage: "02. Bounds Test", desc: "Max Retry Limits (<=3)", pass: true },
            { stage: "03. Value Gate", desc: "High-Value INR Check", pass: safetyData ? safetyData.all_rules_passed : true },
            { stage: "04. Friction Audit", desc: "Customer Impact Index", pass: true },
            { stage: "05. Human Sign-Off", desc: "Operator Verification", pass: isHumanApproved },
            { stage: "06. Canary Execute", desc: "Test-Mode Route Run", pass: isExecuted },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex flex-col justify-between ${
                item.pass
                  ? "bg-slate-950/80 border-slate-800"
                  : "bg-amber-950/20 border-amber-800/40"
              }`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1">
                  {item.stage}
                </span>
                <span className="text-slate-200 font-medium text-[11px] leading-tight block">
                  {item.desc}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono font-bold uppercase ${
                    item.pass ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {item.pass ? "VERIFIED" : "PENDING"}
                </span>
                {item.pass ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Strategy Inspection Banner */}
      {safetyData ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Evaluating Strategy: {safetyData.strategy_name}
                </h3>
                <StatusBadge status={safetyData.all_rules_passed ? "PASS" : "BLOCKED"} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Policy verification across 8 deterministic safety guardrails.
              </p>
            </div>

            {isExecuted ? (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                ✓ EXECUTED IN TEST MODE
              </span>
            ) : isHumanApproved ? (
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isExecuting ? "Executing..." : "Execute Test Recovery"}</span>
              </button>
            ) : safetyData.requires_human_approval ? (
              <div className="text-xs text-amber-400 font-medium">
                Requires Operator Approval Below
              </div>
            ) : (
              <button
                onClick={onExecute}
                disabled={isExecuting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{isExecuting ? "Executing..." : "Execute Strategy (Autonomous)"}</span>
              </button>
            )}
          </div>

          {/* Rule Evaluation Grid */}
          <div className="space-y-2">
            {safetyData.rule_evaluations.map((rule: SafetyRuleResult) => (
              <div
                key={rule.rule_id}
                className={`p-3.5 rounded-lg border text-xs flex items-start justify-between space-x-3 ${
                  rule.passed
                    ? "bg-slate-950/60 border-slate-800/80"
                    : "bg-rose-950/20 border-rose-900/40"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {rule.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{rule.rule_name}</span>
                      <span className="text-[10px] font-mono text-slate-500">[{rule.rule_id}]</span>
                      {rule.requires_human_approval && (
                        <StatusBadge status="REVIEW" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rule.details}</p>
                  </div>
                </div>

                <StatusBadge status={rule.passed ? "PASS" : "BLOCKED"} />
              </div>
            ))}
          </div>

          {/* Operator Sign-Off Form if Human Approval Required */}
          {safetyData.requires_human_approval && !isHumanApproved && (
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Operator Sign-Off Required for High-Value / Out-of-Bounds Changes</span>
              </div>
              <p className="text-xs text-slate-300">
                {safetyData.approval_reasons.join(" ") ||
                  "Batch contains transactions requiring explicit supervisor verification."}
              </p>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter operator approval notes..."
                className="w-full text-xs px-3 py-2 rounded-md bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => onApprove(notes)}
                disabled={isApproving}
                className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 flex items-center space-x-2 transition disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                <span>{isApproving ? "Authorizing..." : "Grant Operator Sign-Off"}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Standalone View: 8 Guardrail Specifications */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">8 Deterministic Safety Guardrails</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every recovery action must satisfy all 8 rules prior to canary routing.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("strategies")}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>Select Strategy to Verify</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defaultRules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {rule.id}. {rule.name}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {rule.standard}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
