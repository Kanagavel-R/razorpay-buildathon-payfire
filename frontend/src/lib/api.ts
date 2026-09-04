import {
  ChaosScenario,
  IncidentState,
  RcaResult,
  StrategyItem,
  CounterfactualMatrixResponse,
  SafetyPolicyCheckResponse,
  AuditEvent,
  ChaosImpactResponse,
  CreateCustomScenarioPayload,
} from "./types";

const rawBase = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  getHealth: () => fetchJson<any>("/health"),

  getScenarios: () => fetchJson<ChaosScenario[]>("/chaos/scenarios"),

  createCustomScenario: (payload: CreateCustomScenarioPayload) =>
    fetchJson<ChaosScenario>("/chaos/scenarios", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  injectChaos: (scenarioId: string, severity?: number, trafficMultiplier?: number) =>
    fetchJson<any>(`/chaos/scenarios/${scenarioId}/inject`, {
      method: "POST",
      body: JSON.stringify({
        scenario_id: scenarioId,
        severity,
        traffic_multiplier: trafficMultiplier,
        environment: "sandbox",
      }),
    }),

  getScenarioImpact: (scenarioId: string) =>
    fetchJson<ChaosImpactResponse>(`/chaos/scenarios/${scenarioId}/impact`),

  resetBaseline: () =>
    fetchJson<{ status: string; message: string }>("/scenarios/reset", {
      method: "POST",
    }),

  getCurrentIncident: () => fetchJson<IncidentState>("/incidents/current"),

  analyzeIncident: (incidentId: string) =>
    fetchJson<RcaResult>(`/incidents/${incidentId}/analyze`, {
      method: "POST",
    }),

  generateStrategies: (incidentId: string) =>
    fetchJson<{ incident_id: string; strategies: StrategyItem[] }>(
      `/incidents/${incidentId}/strategies`,
      { method: "POST" }
    ),

  runSimulation: (incidentId: string, seed = 42, sampleSize = 1000) =>
    fetchJson<CounterfactualMatrixResponse>("/simulations/run", {
      method: "POST",
      body: JSON.stringify({
        incident_id: incidentId,
        seed,
        sample_size: sampleSize,
      }),
    }),

  getCounterfactuals: (incidentId: string) =>
    fetchJson<CounterfactualMatrixResponse>(`/simulations/${incidentId}/counterfactuals`),

  validateSafety: (strategyId: string) =>
    fetchJson<SafetyPolicyCheckResponse>(`/safety/validate/${strategyId}`, {
      method: "POST",
    }),

  approveStrategy: (strategyId: string, approvedBy = "Senior PayOps Engineer", notes = "Approved after safety review") =>
    fetchJson<any>("/execution/approve", {
      method: "POST",
      body: JSON.stringify({
        strategy_id: strategyId,
        approved_by: approvedBy,
        notes,
      }),
    }),

  executeStrategy: (strategyId: string, executionMode = "test_mode") =>
    fetchJson<any>("/execution/execute", {
      method: "POST",
      body: JSON.stringify({
        strategy_id: strategyId,
        execution_mode: executionMode,
      }),
    }),

  getAuditTrail: (incidentId?: string) => {
    const q = incidentId ? `?incident_id=${encodeURIComponent(incidentId)}` : "";
    return fetchJson<AuditEvent[]>(`/audit${q}`);
  },
};
