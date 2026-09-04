"use client";

import React, { useState } from "react";
import { ChaosScenario, IncidentState, CreateCustomScenarioPayload } from "@/lib/types";
import {
  Flame,
  AlertTriangle,
  Zap,
  Activity,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  RotateCcw,
  TrendingDown,
  Clock,
  Radio,
  Server,
  CreditCard,
  ChevronRight,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";

interface ChaosControlPanelProps {
  scenarios: ChaosScenario[];
  onInject: (scenarioId: string, severity: number, trafficMultiplier: number) => Promise<void>;
  onReset?: () => Promise<void>;
  isInjecting: boolean;
  isResetting?: boolean;
  activeScenarioId?: string;
  isChaosActive?: boolean;
  incident?: IncidentState | null;
  onScenarioCreated?: () => void;
}

export const ChaosControlPanel: React.FC<ChaosControlPanelProps> = ({
  scenarios,
  onInject,
  onReset,
  isInjecting,
  isResetting = false,
  activeScenarioId,
  isChaosActive = false,
  incident,
  onScenarioCreated,
}) => {
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || "flash_sale_upi_degrade"
  );
  const [severity, setSeverity] = useState<number>(0.20);
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(3.0);
  const [targetBank, setTargetBank] = useState<string>("Bank A");
  const [targetMethod, setTargetMethod] = useState<string>("UPI");

  // Custom scenario builder state
  const [customName, setCustomName] = useState<string>("");
  const [customDesc, setCustomDesc] = useState<string>("");
  const [customMethod, setCustomMethod] = useState<string>("UPI");
  const [customBank, setCustomBank] = useState<string>("Bank A");
  const [customFailureRate, setCustomFailureRate] = useState<number>(0.25);
  const [customLatencyMs, setCustomLatencyMs] = useState<number>(1800);
  const [customTrafficMult, setCustomTrafficMult] = useState<number>(2.0);
  const [customDuration, setCustomDuration] = useState<number>(10);
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleSelectScenario = (sc: ChaosScenario) => {
    setSelectedScenarioId(sc.id);
    setSeverity(sc.failure_percentage || 0.20);
    setTrafficMultiplier(sc.traffic_multiplier || 1.0);
    setTargetBank(sc.affected_bank || "Bank A");
    setTargetMethod(sc.affected_payment_method || "UPI");
  };

  const handleInject = async () => {
    if (!currentScenario) return;
    await onInject(currentScenario.id, severity, trafficMultiplier);
  };

  const handleCreateAndInjectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert("Please provide a name for the custom chaos scenario.");
      return;
    }

    setIsCreatingCustom(true);
    try {
      const payload: CreateCustomScenarioPayload = {
        name: customName.trim(),
        type: "custom",
        description: customDesc.trim() || `Custom chaos: ${customMethod} on ${customBank}`,
        affected_payment_method: customMethod,
        affected_bank: customBank,
        failure_percentage: customFailureRate,
        latency_increase_ms: customLatencyMs,
        traffic_multiplier: customTrafficMult,
        duration_minutes: customDuration,
      };

      const created = await api.createCustomScenario(payload);
      if (onScenarioCreated) onScenarioCreated();
      setSelectedScenarioId(created.id);
      setActiveTab("preset");
      await onInject(created.id, customFailureRate, customTrafficMult);
    } catch (err: any) {
      alert(`Failed to create custom scenario: ${err.message || err}`);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  // Projected impact preview calculations
  const projectedSuccessRate = Math.max(0.40, 0.985 - severity * 0.7);
  const projectedLatency = 320 + (currentScenario?.latency_increase_ms || 1200);
  const projectedGmvAtRisk = Math.round(20000000 * severity * (trafficMultiplier / 3.0));

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden ${
        isChaosActive
          ? "border-red-600/80 bg-gradient-to-b from-red-950/40 via-gray-900/90 to-gray-950 shadow-2xl shadow-red-950/40"
          : "border-emerald-600/40 bg-gray-900/80 shadow-lg shadow-black/40"
      }`}
    >
      {/* Top Status Banner: NORMAL vs CHAOS ACTIVE */}
      <div
        className={`px-6 py-3.5 flex flex-wrap items-center justify-between border-b transition-colors ${
          isChaosActive
            ? "bg-red-900/40 border-red-700/60"
            : "bg-emerald-950/30 border-emerald-800/40"
        }`}
      >
        <div className="flex items-center space-x-3">
          {isChaosActive ? (
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-sm shadow-emerald-400"></span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isChaosActive
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {isChaosActive ? "🔥 CHAOS ACTIVE — System Impaired" : "🟢 NORMAL STATE — Steady-State"}
            </span>

            {isChaosActive && incident && (
              <span className="text-xs text-red-200 hidden sm:inline">
                Active Incident: <strong className="text-white">{incident.scenario_name || "Payment Degradation"}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <span className="text-[11px] px-2.5 py-1 rounded bg-black/40 border border-gray-700/60 text-gray-300 font-mono flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Sandbox Enforced</span>
          </span>

          {isChaosActive && onReset && (
            <button
              onClick={onReset}
              disabled={isResetting}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              title="Reset environment to baseline steady-state"
            >
              <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "Resetting..." : "Restore Normal"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header & Subtitle */}
      <div className="p-6 pb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2.5">
            <Flame className="w-5 h-5 text-red-500" />
            <span>Payment Chaos Engine</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Inject synthetic anomalies to stress-test payment recovery policies before production deployment.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800">
          <button
            onClick={() => setActiveTab("preset")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "preset"
                ? "bg-red-600/90 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Preset Scenarios ({scenarios.length})
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "custom"
                ? "bg-red-600/90 text-white shadow"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Custom Chaos Builder</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Preset Scenarios Grid */}
      {activeTab === "preset" && (
        <div className="p-6 pt-3 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scenario Selection Column (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-xs font-medium text-gray-300 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Available Chaos Scenarios</span>
              </span>
              <span className="text-[10px] text-gray-400">{scenarios.length} available</span>
            </label>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {scenarios.map((sc) => {
                const isSelected = sc.id === (currentScenario?.id || selectedScenarioId);
                const isPresetActive = isChaosActive && activeScenarioId === sc.id;

                return (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all relative ${
                      isSelected
                        ? "border-red-500/80 bg-red-950/40 text-white shadow-md shadow-red-950/50"
                        : "border-gray-800/90 bg-gray-950/60 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                    }`}
                  >
                    {isPresetActive && (
                      <span className="absolute top-2.5 right-2 px-1.5 py-0.5 rounded bg-red-600 text-[10px] text-white font-bold animate-pulse">
                        LIVE
                      </span>
                    )}
                    <div className="font-semibold text-gray-100 flex items-center justify-between pr-8">
                      <span className="truncate">{sc.name}</span>
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 font-mono">
                        {sc.affected_payment_method}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800/80 text-gray-400 font-mono">
                        {sc.affected_bank}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-300 font-mono">
                        +{((sc.failure_percentage || 0) * 100).toFixed(0)}% fail
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {sc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration & Impact Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5 bg-gray-950/70 p-5 rounded-xl border border-gray-800">
            <div>
              {/* Selected Scenario Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{currentScenario?.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{currentScenario?.description}</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-800/60 flex-shrink-0">
                  {currentScenario?.affected_payment_method} • {currentScenario?.affected_bank}
                </span>
              </div>

              {/* Parametric Controls */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Severity Slider */}
                <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-300 flex items-center space-x-1.5 font-medium">
                      <Sliders className="w-3.5 h-3.5 text-red-400" />
                      <span>Failure Rate (Severity):</span>
                    </span>
                    <span className="font-mono text-red-400 font-bold text-sm">
                      {(severity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.80"
                    step="0.05"
                    value={severity}
                    onChange={(e) => setSeverity(parseFloat(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>5% (Light)</span>
                    <span>40% (Severe)</span>
                    <span>80% (Outage)</span>
                  </div>
                </div>

                {/* Traffic Multiplier Slider */}
                <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-300 flex items-center space-x-1.5 font-medium">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Traffic Multiplier:</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold text-sm">
                      {trafficMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.5"
                    value={trafficMultiplier}
                    onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>1.0x (Normal)</span>
                    <span>3.0x (Peak)</span>
                    <span>5.0x (Flash Sale)</span>
                  </div>
                </div>
              </div>

              {/* Target Bank & Method Overrides */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-gray-400 flex items-center space-x-1 mb-1.5">
                    <Server className="w-3 h-3 text-purple-400" />
                    <span>Target Route / Bank</span>
                  </label>
                  <select
                    value={targetBank}
                    onChange={(e) => setTargetBank(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-mono"
                  >
                    <option value="Bank A">Bank A (Primary)</option>
                    <option value="Bank B">Bank B (Secondary)</option>
                    <option value="Bank C">Bank C (Fallback)</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="SBI">State Bank of India</option>
                    <option value="Axis">Axis Bank</option>
                    <option value="ALL">All Connected Banks</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-400 flex items-center space-x-1 mb-1.5">
                    <CreditCard className="w-3 h-3 text-blue-400" />
                    <span>Payment Method</span>
                  </label>
                  <select
                    value={targetMethod}
                    onChange={(e) => setTargetMethod(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="UPI">UPI (Unified Payments Interface)</option>
                    <option value="CARD">Credit / Debit Cards</option>
                    <option value="NETBANKING">NetBanking</option>
                    <option value="WALLET">Digital Wallets</option>
                    <option value="ALL">All Payment Methods</option>
                  </select>
                </div>
              </div>

              {/* Pre-Injection Impact Preview Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-red-950/30 to-amber-950/20 border border-red-900/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-300 flex items-center space-x-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    <span>Projected Blast Radius & Impact Preview</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 text-red-200 font-mono">
                    Deterministic Simulation
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-gray-900/70 border border-gray-800">
                    <span className="text-[10px] text-gray-400 block">Est. Success Rate</span>
                    <span className="text-xs font-mono font-bold text-red-400">
                      {(projectedSuccessRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-900/70 border border-gray-800">
                    <span className="text-[10px] text-gray-400 block">Est. Latency</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ~{projectedLatency} ms
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-900/70 border border-gray-800">
                    <span className="text-[10px] text-gray-400 block">Est. Revenue at Risk</span>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      ₹{(projectedGmvAtRisk / 100000).toFixed(1)} Lakh
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Synthetic isolation: Live production transactions are never touched.</span>
              </div>

              <button
                onClick={handleInject}
                disabled={isInjecting}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-red-950/80 transition-all disabled:opacity-50"
              >
                <Flame className={`w-4 h-4 ${isInjecting ? "animate-spin" : ""}`} />
                <span>{isInjecting ? "Injecting Fault Stream..." : "🔥 INJECT PAYMENT CHAOS"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Chaos Scenario Builder */}
      {activeTab === "custom" && (
        <form onSubmit={handleCreateAndInjectCustom} className="p-6 pt-3 space-y-5">
          <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-white">Create Bespoke Chaos Scenario</h3>
              </div>
              <span className="text-xs text-gray-400">Validated against Phase 5 Chaos Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">
                  Scenario Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ICICI NetBanking Timeout Surge"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  className="w-full bg-gray-900 border border-gray-800 text-gray-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of failure scenario and operational impact"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-gray-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Target Payment Method</label>
                <select
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-gray-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 font-mono"
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="NETBANKING">NETBANKING</option>
                  <option value="WALLET">WALLET</option>
                  <option value="ALL">ALL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1">Target Bank / Route</label>
                <select
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-gray-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500 font-mono"
                >
                  <option value="Bank A">Bank A</option>
                  <option value="Bank B">Bank B</option>
                  <option value="Bank C">Bank C</option>
                  <option value="ICICI">ICICI</option>
                  <option value="HDFC">HDFC</option>
                  <option value="SBI">SBI</option>
                  <option value="Axis">Axis</option>
                  <option value="ALL">ALL</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Failure Rate:</span>
                  <span className="font-mono text-red-400 font-bold">{(customFailureRate * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={customFailureRate}
                  onChange={(e) => setCustomFailureRate(parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Latency Added:</span>
                  <span className="font-mono text-amber-400 font-bold">+{customLatencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="250"
                  value={customLatencyMs}
                  onChange={(e) => setCustomLatencyMs(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Traffic Volume Multiplier:</span>
                  <span className="font-mono text-amber-400 font-bold">{customTrafficMult.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={customTrafficMult}
                  onChange={(e) => setCustomTrafficMult(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">Duration:</span>
                  <span className="font-mono text-gray-200 font-bold">{customDuration} mins</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("preset")}
              className="px-4 py-2 rounded-lg bg-gray-800 text-xs text-gray-300 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreatingCustom}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-red-950/60 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isCreatingCustom ? "Creating & Injecting..." : "Save & Inject Custom Chaos"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
