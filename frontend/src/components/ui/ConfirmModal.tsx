"use client";

import React from "react";
import { AlertTriangle, Flame, X, ShieldCheck } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  scenarioName?: string;
  affectedBank?: string;
  affectedMethod?: string;
  failureRate?: number;
  trafficMultiplier?: number;
  isConfirming?: boolean;
  isLoading?: boolean;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  scenarioName = "Chaos Experiment",
  affectedBank = "All Routes",
  affectedMethod = "UPI",
  failureRate = 0.2,
  trafficMultiplier = 1.0,
  isConfirming = false,
  isLoading = false,
  description,
  confirmText,
  cancelText = "Cancel",
  variant = "danger",
  children,
}) => {
  if (!isOpen) return null;

  const activeLoading = isConfirming || isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl ${
                variant === "danger"
                  ? "bg-rose-500/20 text-rose-400"
                  : variant === "warning"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-indigo-500/20 text-indigo-400"
              }`}
            >
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">
                {description || "Confirm blast radius before fault injection"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Body or Scope Breakdown */}
        {children ? (
          children
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Scenario:</span>
              <span className="font-semibold text-slate-200">{scenarioName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Route:</span>
              <span className="font-mono text-slate-300">
                {affectedMethod} on {affectedBank}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Injected Failure Rate:</span>
              <span className="font-mono font-bold text-rose-400">
                {(failureRate * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Traffic Multiplier:</span>
              <span className="font-mono font-bold text-amber-400">
                {trafficMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>
        )}

        {/* Safety Warning */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            This injection will degrade the synthetic payment stream to test autonomous AI diagnostics and recovery policies.
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sandbox Isolation Enforced — Live merchant funds are 100% protected.</span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={activeLoading}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/60 transition disabled:opacity-50"
          >
            <Flame className={`w-3.5 h-3.5 ${activeLoading ? "animate-spin" : ""}`} />
            <span>
              {activeLoading
                ? "Injecting..."
                : confirmText || "Confirm & Inject Chaos"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
