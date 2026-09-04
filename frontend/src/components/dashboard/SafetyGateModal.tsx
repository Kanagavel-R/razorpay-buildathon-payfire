"use client";

import React, { useState } from "react";
import { SafetyPolicyCheckResponse, SafetyRuleResult } from "@/lib/types";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Play,
  X,
} from "lucide-react";

interface SafetyGateModalProps {
  safetyData: SafetyPolicyCheckResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes: string) => Promise<void>;
  onExecute: () => Promise<void>;
  isApproving: boolean;
  isExecuting: boolean;
  isHumanApproved: boolean;
  isExecuted: boolean;
}

export const SafetyGateModal: React.FC<SafetyGateModalProps> = ({
  safetyData,
  isOpen,
  onClose,
  onApprove,
  onExecute,
  isApproving,
  isExecuting,
  isHumanApproved,
  isExecuted,
}) => {
  const [operatorNotes, setOperatorNotes] = useState("Verified counterfactual simulation; approved for execution.");

  if (!isOpen || !safetyData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
          <div
            className={`p-2.5 rounded-xl ${
              safetyData.all_rules_passed
                ? "bg-emerald-600/20 text-emerald-400"
                : "bg-red-600/20 text-red-400"
            }`}
          >
            {safetyData.all_rules_passed ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">Payment Safety Gate & Policy Verification</h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  safetyData.all_rules_passed
                    ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                    : "bg-red-950 border border-red-800 text-red-300"
                }`}
              >
                {safetyData.all_rules_passed ? "POLICY APPROVED" : "VIOLATION BLOCKED"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Evaluating: <strong className="text-gray-200">{safetyData.strategy_name}</strong>
            </p>
          </div>
        </div>

        {/* 8 Guardrails Check Grid */}
        <div className="mt-4 max-h-72 overflow-y-auto pr-1 space-y-2">
          {safetyData.rule_evaluations.map((rule: SafetyRuleResult) => (
            <div
              key={rule.rule_id}
              className={`p-3 rounded-xl border text-xs flex items-start justify-between space-x-3 ${
                rule.passed
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-red-950/30 border-red-900/60"
              }`}
            >
              <div className="flex items-start space-x-2.5">
                {rule.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-gray-100 flex items-center space-x-1.5">
                    <span>{rule.rule_name}</span>
                    {rule.requires_human_approval && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                        APPROVAL REQ
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{rule.details}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                  rule.passed
                    ? "bg-emerald-950 text-emerald-400"
                    : "bg-red-950 text-red-400"
                }`}
              >
                {rule.passed ? "PASS" : "FAIL"}
              </span>
            </div>
          ))}
        </div>

        {/* Human In The Loop Approval Area */}
        {safetyData.requires_human_approval && !isHumanApproved && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Human Operator Sign-Off Required</span>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              {safetyData.approval_reasons.join(" ") ||
                "Batch contains transactions requiring explicit supervisor verification."}
            </p>
            <input
              type="text"
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="Enter operator approval rationale..."
              className="w-full text-xs px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 mb-3"
            />
            <button
              onClick={() => onApprove(operatorNotes)}
              disabled={isApproving}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isApproving ? "Authorizing..." : "GRANT HUMAN OPERATOR APPROVAL"}</span>
            </button>
          </div>
        )}

        {/* Execution Area */}
        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Status:{" "}
            {isExecuted ? (
              <span className="text-emerald-400 font-bold font-mono">EXECUTED (TEST MODE)</span>
            ) : isHumanApproved || !safetyData.requires_human_approval ? (
              <span className="text-emerald-400 font-bold font-mono">READY FOR EXECUTION</span>
            ) : (
              <span className="text-amber-400 font-bold font-mono">AWAITING APPROVAL</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
            >
              Close
            </button>

            {safetyData.all_rules_passed && (
              <button
                onClick={onExecute}
                disabled={isExecuting || isExecuted || (safetyData.requires_human_approval && !isHumanApproved)}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isExecuting ? "animate-spin" : ""}`} />
                <span>
                  {isExecuted
                    ? "ACTION ALREADY EXECUTED"
                    : isExecuting
                    ? "Executing Test Action..."
                    : "EXECUTE TEST-MODE RECOVERY"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
