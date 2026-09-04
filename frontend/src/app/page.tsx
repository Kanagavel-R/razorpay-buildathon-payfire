"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  ChaosScenario,
  IncidentState,
  RcaResult,
  CounterfactualMatrixResponse,
  SafetyPolicyCheckResponse,
  AuditEvent,
} from "@/lib/types";

import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

import { OverviewView } from "@/components/views/OverviewView";
import { ChaosLabView } from "@/components/views/ChaosLabView";
import { AiDiagnosisView } from "@/components/views/AiDiagnosisView";
import { StrategiesView } from "@/components/views/StrategiesView";
import { SimulationView } from "@/components/views/SimulationView";
import { SafetyCenterView } from "@/components/views/SafetyCenterView";
import { AuditTrailView } from "@/components/views/AuditTrailView";

import { SafetyGateModal } from "@/components/dashboard/SafetyGateModal";

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Core Data States
  const [healthData, setHealthData] = useState<any>(null);
  const [scenarios, setScenarios] = useState<ChaosScenario[]>([]);
  const [incident, setIncident] = useState<IncidentState | null>(null);
  const [rca, setRca] = useState<RcaResult | null>(null);
  const [counterfactuals, setCounterfactuals] = useState<CounterfactualMatrixResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Safety & Inspection State
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [safetyEvaluation, setSafetyEvaluation] = useState<SafetyPolicyCheckResponse | null>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [isHumanApproved, setIsHumanApproved] = useState<boolean>(false);
  const [isExecuted, setIsExecuted] = useState<boolean>(false);

  // Loading States
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    try {
      const [h, sc, inc, aud] = await Promise.all([
        api.getHealth(),
        api.getScenarios(),
        api.getCurrentIncident(),
        api.getAuditTrail(),
      ]);
      setHealthData(h);
      setScenarios(sc);
      setIncident(inc);
      setAuditEvents(aud);

      // If active incident already has RCA
      if (inc.is_active_incident && inc.ai_analyzed && inc.incident_id) {
        setRca({
          incident_id: inc.incident_id,
          root_cause: inc.ai_root_cause || "",
          confidence: inc.ai_confidence || 0.87,
          evidence: inc.ai_evidence || [],
          affected_components: inc.ai_affected_components || [],
          uncertainties: inc.ai_uncertainties || [],
          revenue_at_risk_inr: inc.revenue_at_risk_inr,
          affected_volume: inc.transactions_affected,
          recommended_action_summary: "Reroute volume to healthy secondary route.",
          is_autonomous_allowed: (inc.ai_confidence || 0) >= 0.75,
        });

        // Fetch existing simulation if any
        try {
          const cf = await api.getCounterfactuals(inc.incident_id);
          setCounterfactuals(cf);
        } catch {
          // Simulation not yet run
        }
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
    }
  };

  // Chaos Injection Handler
  const handleInjectChaos = async (
    scenarioId: string,
    severity: number,
    trafficMultiplier: number
  ) => {
    setIsInjecting(true);
    try {
      await api.injectChaos(scenarioId, severity, trafficMultiplier);
      setRca(null);
      setCounterfactuals(null);
      setSelectedStrategyId(null);
      setIsHumanApproved(false);
      setIsExecuted(false);
      await refreshAll();
      setActiveTab("ai"); // Automatically progress user to AI Diagnosis
    } catch (err) {
      alert(`Chaos Injection Failed: ${err}`);
    } finally {
      setIsInjecting(false);
    }
  };

  // Reset Baseline Handler
  const handleResetBaseline = async () => {
    setIsResetting(true);
    try {
      await api.resetBaseline();
      setRca(null);
      setCounterfactuals(null);
      setSelectedStrategyId(null);
      setIsHumanApproved(false);
      setIsExecuted(false);
      await refreshAll();
      setActiveTab("overview");
    } catch (err) {
      alert(`Reset Failed: ${err}`);
    } finally {
      setIsResetting(false);
    }
  };

  // AI RCA Analysis Handler
  const handleRunRca = async () => {
    if (!incident?.incident_id) return;
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeIncident(incident.incident_id);
      setRca(res);
      const aud = await api.getAuditTrail();
      setAuditEvents(aud);
    } catch (err) {
      alert(`RCA Analysis Failed: ${err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Simulation Handler
  const handleRunSimulation = async () => {
    if (!incident?.incident_id) return;
    setIsSimulating(true);
    try {
      await api.generateStrategies(incident.incident_id);
      const res = await api.runSimulation(incident.incident_id, 42, 1000);
      setCounterfactuals(res);
      setSelectedStrategyId(res.recommended_strategy_id);
      const aud = await api.getAuditTrail();
      setAuditEvents(aud);
      setActiveTab("strategies"); // Advance to strategy review
    } catch (err) {
      alert(`Simulation Failed: ${err}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Inspect Strategy Safety
  const handleInspectSafety = async (strategyId: string) => {
    setSelectedStrategyId(strategyId);
    try {
      const evalRes = await api.validateSafety(strategyId);
      setSafetyEvaluation(evalRes);
      setActiveTab("safety"); // Navigate to safety center view
    } catch (err) {
      alert(`Safety Validation Failed: ${err}`);
    }
  };

  // Human Approval Sign-off
  const handleApproveStrategy = async (notes: string) => {
    if (!selectedStrategyId) return;
    setIsApproving(true);
    try {
      await api.approveStrategy(selectedStrategyId, "Senior PayOps Lead", notes);
      setIsHumanApproved(true);
      const aud = await api.getAuditTrail();
      setAuditEvents(aud);
    } catch (err) {
      alert(`Approval Failed: ${err}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Execute Test-Mode Recovery Action
  const handleExecuteRecovery = async () => {
    if (!selectedStrategyId) return;
    setIsExecutingAction(true);
    try {
      await api.executeStrategy(selectedStrategyId, "test_mode");
      setIsExecuted(true);
      const aud = await api.getAuditTrail();
      setAuditEvents(aud);
      setActiveTab("audit"); // Advance to audit ledger
    } catch (err) {
      alert(`Execution Failed: ${err}`);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const isDegraded = Boolean(incident?.is_active_incident);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* SaaS Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDegraded={isDegraded}
        hasRca={Boolean(rca)}
        hasSimulation={Boolean(counterfactuals)}
        safetyPending={Boolean(safetyEvaluation && !isHumanApproved)}
        backendHealthy={Boolean(healthData?.status === "healthy")}
        razorpayMode={healthData?.razorpay_mode || "SYNTHETIC_SIMULATOR"}
        isOpenMobile={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar with Guided Lifecycle Stepper */}
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onReset={handleResetBaseline}
          isResetting={isResetting}
          isDegraded={isDegraded}
          hasRca={Boolean(rca)}
          hasSimulation={Boolean(counterfactuals)}
          safetyApproved={isHumanApproved || isExecuted}
          isExecuted={isExecuted}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* Page Content View Router */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === "overview" && (
            <OverviewView
              healthData={healthData}
              incident={incident}
              isDegraded={isDegraded}
              isRecovered={isExecuted}
              onNavigateTab={setActiveTab}
              onTriggerChaos={() => setActiveTab("chaos")}
              onAnalyzeAi={handleRunRca}
            />
          )}

          {activeTab === "chaos" && (
            <ChaosLabView
              scenarios={scenarios}
              onInject={handleInjectChaos}
              onReset={handleResetBaseline}
              isInjecting={isInjecting}
              isResetting={isResetting}
              activeScenarioId={incident?.scenario_id}
              isChaosActive={isDegraded}
              incident={incident}
              onScenarioCreated={refreshAll}
            />
          )}

          {activeTab === "ai" && (
            <AiDiagnosisView
              rca={rca}
              incident={incident}
              isLoading={isAnalyzing}
              onAnalyze={handleRunRca}
              onSimulate={handleRunSimulation}
              isSimulating={isSimulating}
              hasStrategies={Boolean(counterfactuals)}
            />
          )}

          {activeTab === "strategies" && (
            <StrategiesView
              counterfactuals={counterfactuals}
              onSelectStrategy={handleInspectSafety}
              selectedStrategyId={selectedStrategyId || undefined}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "simulation" && (
            <SimulationView
              counterfactuals={counterfactuals}
              onSelectStrategy={handleInspectSafety}
              selectedStrategyId={selectedStrategyId || undefined}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "safety" && (
            <SafetyCenterView
              safetyData={safetyEvaluation}
              onApprove={handleApproveStrategy}
              onExecute={handleExecuteRecovery}
              isApproving={isApproving}
              isExecuting={isExecutingAction}
              isHumanApproved={isHumanApproved}
              isExecuted={isExecuted}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === "audit" && <AuditTrailView events={auditEvents} />}
        </main>
      </div>

      {/* Safety Gate Modal for Quick Approval */}
      <SafetyGateModal
        safetyData={safetyEvaluation}
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        onApprove={handleApproveStrategy}
        onExecute={handleExecuteRecovery}
        isApproving={isApproving}
        isExecuting={isExecutingAction}
        isHumanApproved={isHumanApproved}
        isExecuted={isExecuted}
      />
    </div>
  );
}
