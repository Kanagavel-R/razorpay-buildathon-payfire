from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RcaRequest(BaseModel):
    incident_id: str


class ScenarioAnalysis(BaseModel):
    """Analyst 1: Scenario Analyst."""
    scenario_id: str
    scenario_name: str
    traffic_multiplier: float
    affected_payment_method: str
    affected_bank: str
    failure_mode: str
    event_timeline_steps: List[str]


class RootCauseAnalysis(BaseModel):
    """Analyst 2: Root Cause Analyst."""
    root_cause: str
    confidence: float = Field(ge=0.0, le=1.0)
    primary_failure_code: str
    bank_failure_ratio: float
    affected_components: List[str]
    evidence: List[str]
    uncertainties: List[str]


class RevenueRiskAnalysis(BaseModel):
    """Analyst 3: Revenue Risk Analyst (Strictly Deterministic Calculations)."""
    expected_gmv_inr: float
    scaled_revenue_at_risk_inr: float
    sample_failed_gmv_inr: float
    affected_transactions: int
    failure_rate: float
    avg_latency_ms: float
    customer_segment_exposure: str
    calculation_engine: str = "DETERMINISTIC_FINANCIAL_FORMULA"


class RecoveryStrategyRecommendation(BaseModel):
    """Analyst 4: Recovery Strategist Recommendation."""
    recommended_strategy: str
    strategy_code: str
    action_type: str
    expected_recovery_rate: float
    rationale: str
    is_autonomous_allowed: bool


class RiskSafetyEvaluation(BaseModel):
    """Analyst 5: Risk / Safety Analyst."""
    pre_flight_risk_level: str
    risk_score: float
    requires_human_signoff: bool
    flagged_policy_rules: List[str]
    mitigation_notes: str


class ExecutiveExplanation(BaseModel):
    """Analyst 6: Explanation Generator."""
    headline: str
    plain_english_summary: str
    operational_recommendation: str
    financial_impact_callout: str
    data_classification: str = "AI_REASONING_OUTPUT"


class RcaResult(BaseModel):
    """Unified AI Incident Diagnosis combining all 6 specialized analyst outputs."""
    incident_id: str
    root_cause: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: List[str]
    affected_components: List[str]
    uncertainties: List[str]
    revenue_at_risk_inr: float
    affected_volume: int
    recommended_action_summary: str
    is_autonomous_allowed: bool = Field(
        description="True if confidence >= threshold (0.75), allowing automated remediation evaluation"
    )
    # 6 Specialized sub-analyst models
    scenario_analyst: Optional[ScenarioAnalysis] = None
    root_cause_analyst: Optional[RootCauseAnalysis] = None
    revenue_risk_analyst: Optional[RevenueRiskAnalysis] = None
    recovery_strategist: Optional[RecoveryStrategyRecommendation] = None
    risk_safety_analyst: Optional[RiskSafetyEvaluation] = None
    explanation_generator: Optional[ExecutiveExplanation] = None
    data_mode: str = Field(
        default="AI_AGENT_ANALYSIS",
        description="AI_AGENT_ANALYSIS or DETERMINISTIC_FALLBACK if AI is unreachable"
    )

