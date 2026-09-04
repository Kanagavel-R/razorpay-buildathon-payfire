from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class StrategyItem(BaseModel):
    id: str
    incident_id: str
    name: str
    strategy_code: str  # immediate_retry, exponential_backoff, dynamic_reroute, payment_link, human_escalation
    description: str
    action_type: str
    expected_recovery_rate: float
    expected_recovered_gmv: float
    risk_level: str
    risk_score: float
    latency_impact_ms: float
    customer_friction: str
    safety_approved: bool
    requires_human_approval: bool
    human_approved: bool
    executed: bool
    expected_benefit: Optional[str] = None
    assumptions: List[str] = Field(default_factory=list)
    affected_transactions: Optional[int] = None
    stopping_conditions: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)


class StrategyResponse(BaseModel):
    incident_id: str
    strategies: List[StrategyItem]


class StrategyApprovalRequest(BaseModel):
    strategy_id: str
    approved_by: str = "Merchant Admin"
    notes: Optional[str] = None


class StrategyExecutionRequest(BaseModel):
    strategy_id: str
    execution_mode: str = Field(default="test_mode", description="test_mode or simulated")
