from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SimulationRunRequest(BaseModel):
    incident_id: str
    seed: int = Field(default=42, description="Random seed for reproducible Monte Carlo runs")
    sample_size: int = Field(default=1000, ge=100, le=50000)


class SimulationResultItem(BaseModel):
    strategy_id: str
    strategy_name: str
    arm_type: str  # baseline, immediate_retry, backoff, reroute, payment_link
    simulated_transactions: int
    recovered_transactions: int
    failed_transactions: int
    recovered_gmv_inr: float
    net_recovery_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    retry_count: int
    duplicate_risk_count: int
    customer_churn_risk: float
    safety_compliance: bool
    is_recommended: bool = False
    recommendation_reason: Optional[str] = None


class CounterfactualMatrixResponse(BaseModel):
    incident_id: str
    simulation_id: str
    baseline_unmitigated_loss_inr: float
    results: List[SimulationResultItem]
    recommended_strategy_id: str
    ai_executive_summary: str


# Phase 4 Direct simulate(strategy, scenario) schemas
class DirectSimulateRequest(BaseModel):
    scenario_id: str = Field(default="upi_degradation", description="Target chaos scenario ID")
    strategy: str = Field(default="alternate_route", description="no_action, immediate_retry, delayed_retry, alternate_route, payment_link")
    seed: int = Field(default=42, description="Configurable deterministic random seed")
    sample_size: int = Field(default=1000, ge=100, le=10000)
    merchant_expected_gmv: float = Field(default=20000000.0, ge=10000.0)


class BaselineResultSchema(BaseModel):
    scenario_id: str
    scenario_name: str
    total_transactions: int
    successful_transactions: int
    failed_transactions: int
    success_rate: float
    failure_rate: float
    total_gmv_inr: float
    failed_gmv_inr: float
    revenue_at_risk_inr: float
    average_latency_ms: float
    p95_latency_ms: float
    affected_customers: int
    data_classification: str = "SIMULATED RESULT"


class StrategyResultSchema(BaseModel):
    strategy_code: str
    strategy_name: str
    simulated_transactions: int
    successful_transactions: int
    failed_transactions: int
    recovered_transactions: int
    recovered_gmv_inr: float
    net_recovery_rate: float
    average_latency_ms: float
    p95_latency_ms: float
    retry_count: int
    duplicate_risk_count: int
    customer_churn_risk: float
    safety_compliance: bool
    is_recommended: bool = False
    recommendation_reason: Optional[str] = None
    data_classification: str = "SIMULATED RESULT"


class ComparisonResultSchema(BaseModel):
    strategy_code: str
    strategy_name: str
    baseline_revenue_at_risk_inr: float
    recovered_transactions: int
    recovered_gmv_inr: float
    incremental_recovery_inr: float
    recovery_rate: float
    retry_count: int
    duplicate_risk_count: int
    latency_impact_ms: float
    customer_churn_impact: float
    safety_compliance: bool
    is_recommended: bool
    recommendation_reason: Optional[str] = None
    data_classification: str = "SIMULATED RESULT"


class DirectSimulateResponse(BaseModel):
    seed: int
    scenario_id: str
    scenario_name: str
    strategy_code: str
    baseline: BaselineResultSchema
    strategy_result: StrategyResultSchema
    comparison: ComparisonResultSchema
