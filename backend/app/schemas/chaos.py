from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class ScenarioStatus(str, Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ChaosType(str, Enum):
    UPI_DEGRADATION = "upi_degradation"
    BANK_OUTAGE = "bank_outage"
    PAYMENT_TIMEOUT = "payment_timeout"
    WEBHOOK_DELAY = "webhook_delay"
    TRAFFIC_SPIKE = "traffic_spike"
    CARD_DECLINE_SPIKE = "card_decline_spike"
    CUSTOM = "custom"


class ChaosScenario(BaseModel):
    id: str
    name: str
    type: str = "custom"
    description: str
    affected_payment_method: str = "UPI"  # UPI, Cards, NetBanking, Wallets, All
    affected_bank: str = "Bank A"         # Bank A, Bank B, Bank C, Bank D, Gateway Direct
    failure_percentage: float = Field(default=0.20, ge=0.0, le=1.0, description="Failure rate ratio")
    latency_increase_ms: float = Field(default=2500.0, ge=0.0)
    traffic_multiplier: float = Field(default=1.0, ge=0.1, le=10.0)
    duration_minutes: int = Field(default=15, ge=1, le=120)
    webhook_delay_seconds: int = Field(default=0, ge=0, le=600)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    status: ScenarioStatus = ScenarioStatus.READY
    created_at: Optional[datetime] = None


class CreateChaosScenarioRequest(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    type: ChaosType = ChaosType.CUSTOM
    description: Optional[str] = None
    affected_payment_method: str = Field(default="UPI")
    affected_bank: str = Field(default="Bank A")
    failure_percentage: float = Field(default=0.20, ge=0.0, le=1.0)
    latency_increase_ms: float = Field(default=2000.0, ge=0.0, le=10000.0)
    traffic_multiplier: float = Field(default=1.0, ge=0.5, le=10.0)
    duration_minutes: int = Field(default=15, ge=1, le=120)
    webhook_delay_seconds: int = Field(default=0, ge=0, le=600)
    parameters: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("affected_payment_method")
    def validate_method(cls, v):
        valid = ["UPI", "Cards", "NetBanking", "Wallets", "All"]
        if v not in valid:
            raise ValueError(f"Invalid payment method '{v}'. Must be one of: {valid}")
        return v

    @field_validator("affected_bank")
    def validate_bank(cls, v):
        valid = ["Bank A", "Bank B", "Bank C", "Bank D", "Gateway Direct"]
        if v not in valid:
            raise ValueError(f"Invalid bank route '{v}'. Must be one of: {valid}")
        return v


class ChaosInjectionRequest(BaseModel):
    scenario_id: str
    severity: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    traffic_multiplier: Optional[float] = Field(default=None, ge=0.1, le=10.0)
    duration_minutes: Optional[int] = Field(default=None, ge=1, le=120)
    environment: str = Field(default="sandbox", description="Must be sandbox or simulation; live is strictly prohibited")


class ChaosTimelineEvent(BaseModel):
    state: str  # NORMAL, CHAOS_INJECTED, DEGRADATION_DETECTED, IMPACT_CALCULATED, SIMULATION_COMPLETED
    timestamp: str
    description: str
    details: Optional[Dict[str, Any]] = None


class TelemetrySnapshot(BaseModel):
    transaction_volume: int
    success_rate: float
    failure_rate: float
    total_gmv_inr: float
    failed_gmv_inr: float
    average_latency_ms: float
    revenue_at_risk_inr: float = 0.0
    affected_transactions: int = 0
    affected_customers: int = 0


class BeforeAfterAnalysis(BaseModel):
    before_chaos: TelemetrySnapshot
    after_chaos: TelemetrySnapshot
    delta: Dict[str, float] = Field(
        description="Deltas: success_rate_drop, latency_increase_ms, failed_gmv_delta, volume_increase"
    )


class ChaosImpactResponse(BaseModel):
    scenario_id: str
    scenario_name: str
    status: ScenarioStatus
    classification: str = "SIMULATED SCENARIO"
    timeline: List[ChaosTimelineEvent]
    before_after: BeforeAfterAnalysis


class ChaosResponse(BaseModel):
    status: str
    incident_id: str
    scenario_id: str
    scenario_name: str
    message: str
    baseline_success_rate: float
    current_success_rate: float
    current_failure_rate: float
    revenue_at_risk_inr: float
    avg_latency_ms: float
    transactions_affected: int
    impact: Optional[BeforeAfterAnalysis] = None
    timeline: Optional[List[ChaosTimelineEvent]] = None
