export interface ChaosScenario {
  id: string;
  name: string;
  type?: string;
  description: string;
  affected_payment_method: string;
  affected_bank: string;
  failure_percentage: number;
  latency_increase_ms: number;
  traffic_multiplier: number;
  duration_minutes: number;
  webhook_delay_seconds: number;
  parameters?: Record<string, any>;
  status?: string;
}

export interface ChaosTimelineEvent {
  step: string;
  timestamp: string;
  event: string;
  description: string;
  severity: "info" | "warning" | "error";
}

export interface TelemetrySnapshot {
  total_transactions?: number;
  success_rate: number;
  failure_rate: number;
  avg_latency_ms: number;
  successful_gmv: number;
  failed_gmv: number;
}

export interface BeforeAfterAnalysis {
  baseline: TelemetrySnapshot;
  chaos: TelemetrySnapshot;
  deltas: {
    success_rate_delta: number;
    failure_rate_delta: number;
    latency_delta_ms: number;
    failed_gmv_delta: number;
  };
}

export interface ChaosImpactResponse {
  scenario_id: string;
  scenario_name: string;
  status: string;
  before_after?: BeforeAfterAnalysis;
  timeline?: ChaosTimelineEvent[];
  metrics?: Record<string, any>;
}

export interface CreateCustomScenarioPayload {
  name: string;
  type: string;
  description?: string;
  affected_payment_method: string;
  affected_bank: string;
  failure_percentage: number;
  latency_increase_ms: number;
  traffic_multiplier: number;
  duration_minutes: number;
}

export interface IncidentState {
  is_active_incident: boolean;
  incident_id: string | null;
  status: string;
  scenario_id?: string;
  scenario_name?: string;
  expected_transactions: number;
  expected_gmv: number;
  success_rate: number;
  failure_rate: number;
  avg_latency_ms: number;
  revenue_at_risk_inr: number;
  transactions_affected: number;
  failed_gmv_inr: number;
  affected_payment_method?: string;
  affected_bank?: string;
  ai_analyzed: boolean;
  ai_root_cause?: string;
  ai_confidence?: number;
  ai_evidence?: string[];
  ai_affected_components?: string[];
  ai_uncertainties?: string[];
  created_at?: string;
}

export interface ScenarioAnalysis {
  scenario_id: string;
  scenario_name: string;
  traffic_multiplier: number;
  affected_payment_method: string;
  affected_bank: string;
  failure_mode: string;
  event_timeline_steps: string[];
}

export interface RootCauseAnalysis {
  root_cause: string;
  confidence: number;
  primary_failure_code: string;
  bank_failure_ratio: number;
  affected_components: string[];
  evidence: string[];
  uncertainties: string[];
}

export interface RevenueRiskAnalysis {
  expected_gmv_inr: number;
  scaled_revenue_at_risk_inr: number;
  sample_failed_gmv_inr: number;
  affected_transactions: number;
  failure_rate: number;
  avg_latency_ms: number;
  customer_segment_exposure: string;
  calculation_engine: string;
}

export interface ExecutiveExplanation {
  headline: string;
  plain_english_summary: string;
  operational_recommendation: string;
  financial_impact_callout: string;
  data_classification: string;
}

export interface RcaResult {
  incident_id: string;
  root_cause: string;
  confidence: number;
  evidence: string[];
  affected_components: string[];
  uncertainties: string[];
  revenue_at_risk_inr: number;
  affected_volume: number;
  recommended_action_summary: string;
  is_autonomous_allowed: boolean;
  scenario_analyst?: ScenarioAnalysis;
  root_cause_analyst?: RootCauseAnalysis;
  revenue_risk_analyst?: RevenueRiskAnalysis;
  explanation_generator?: ExecutiveExplanation;
  data_mode?: string;
}

export interface StrategyItem {
  id: string;
  incident_id: string;
  name: string;
  strategy_code: string;
  description: string;
  action_type: string;
  expected_recovery_rate: number;
  expected_recovered_gmv: number;
  risk_level: string;
  risk_score: number;
  latency_impact_ms: number;
  customer_friction: string;
  safety_approved: boolean;
  requires_human_approval: boolean;
  human_approved: boolean;
  executed: boolean;
  expected_benefit?: string;
  assumptions?: string[];
  affected_transactions?: number;
  stopping_conditions?: string[];
  confidence?: number;
}

export interface SimulationResultItem {
  strategy_id: string;
  strategy_name: string;
  arm_type: string;
  simulated_transactions: number;
  recovered_transactions: number;
  failed_transactions: number;
  recovered_gmv_inr: number;
  net_recovery_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  retry_count: number;
  duplicate_risk_count: number;
  customer_churn_risk: number;
  safety_compliance: boolean;
  is_recommended: boolean;
  recommendation_reason?: string;
}

export interface CounterfactualMatrixResponse {
  incident_id: string;
  simulation_id: string;
  baseline_unmitigated_loss_inr: number;
  results: SimulationResultItem[];
  recommended_strategy_id: string;
  ai_executive_summary: string;
}

export interface SafetyRuleResult {
  rule_id: string;
  rule_name: string;
  description: string;
  passed: boolean;
  requires_human_approval: boolean;
  details: string;
}

export interface SafetyPolicyCheckResponse {
  strategy_id: string;
  strategy_name: string;
  all_rules_passed: boolean;
  requires_human_approval: boolean;
  approval_reasons: string[];
  rule_evaluations: SafetyRuleResult[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  incident_id?: string;
  strategy_id?: string;
  decision: string;
  risk_status: string;
  input_data?: any;
  result_data?: any;
  notes?: string;
}
