"use client";

import React, { useState } from "react";
import { ChaosScenario, IncidentState } from "@/lib/types";
import { ChaosControlPanel } from "@/components/dashboard/ChaosControlPanel";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ShieldAlert, Info, AlertTriangle, PlayCircle } from "lucide-react";

interface ChaosLabViewProps {
  scenarios: ChaosScenario[];
  onInject: (scenarioId: string, severity: number, trafficMultiplier: number) => Promise<void>;
  onReset: () => Promise<void>;
  isInjecting: boolean;
  isResetting: boolean;
  activeScenarioId?: string;
  isChaosActive: boolean;
  incident: IncidentState | null;
  onScenarioCreated: () => void;
}

export function ChaosLabView({
  scenarios,
  onInject,
  onReset,
  isInjecting,
  isResetting,
  activeScenarioId,
  isChaosActive,
  incident,
  onScenarioCreated,
}: ChaosLabViewProps) {
  // Modal state for double-check confirmation
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [pendingInjectArgs, setPendingInjectArgs] = useState<{
    scenarioId: string;
    severity: number;
    trafficMultiplier: number;
    scenarioName: string;
  } | null>(null);

  // Wrapper for onInject to optionally trigger modal
  const handleInterceptInject = async (
    scenarioId: string,
    severity: number,
    trafficMultiplier: number
  ) => {
    const sc = scenarios.find((s) => s.id === scenarioId);
    setPendingInjectArgs({
      scenarioId,
      severity,
      trafficMultiplier,
      scenarioName: sc?.name || "Payment Chaos Experiment",
    });
    setIsConfirmOpen(true);
  };

  const handleConfirmInject = async () => {
    if (!pendingInjectArgs) return;
    setIsConfirmOpen(false);
    await onInject(
      pendingInjectArgs.scenarioId,
      pendingInjectArgs.severity,
      pendingInjectArgs.trafficMultiplier
    );
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Isolation Advisory */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200/90 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Sandbox Isolation Active: </span>
          All chaos perturbations run in an isolated synthetic environment. Live production payment
          credentials are fundamentally rejected. Fault injections do not affect real cardholders or banks.
        </div>
      </div>

      {/* Main Chaos Control Panel */}
      <ChaosControlPanel
        scenarios={scenarios}
        onInject={handleInterceptInject}
        onReset={onReset}
        isInjecting={isInjecting}
        isResetting={isResetting}
        activeScenarioId={activeScenarioId}
        isChaosActive={isChaosActive}
        incident={incident}
        onScenarioCreated={onScenarioCreated}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title={`Authorize Chaos Injection: ${pendingInjectArgs?.scenarioName || ""}`}
        description="You are about to perturb payment rails in the synthetic sandbox. This will induce synthetic failure rates, bank latency timeouts, and trigger autonomous AI diagnosis."
        confirmText="Inject Chaos Scenario"
        cancelText="Cancel"
        variant="danger"
        isLoading={isInjecting}
        onConfirm={handleConfirmInject}
        onClose={() => setIsConfirmOpen(false)}
      >
        <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Target Scenario:</span>
            <span className="text-rose-400 font-bold">{pendingInjectArgs?.scenarioName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Injected Failure Rate:</span>
            <span className="text-amber-400 font-bold">
              {((pendingInjectArgs?.severity || 0) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Traffic Surge Multiplier:</span>
            <span className="text-indigo-400 font-bold">
              {(pendingInjectArgs?.trafficMultiplier || 1.0).toFixed(1)}x
            </span>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}
