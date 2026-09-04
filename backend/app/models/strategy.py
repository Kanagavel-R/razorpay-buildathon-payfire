from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text, Boolean
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class StrategyModel(Base):
    __tablename__ = "recovery_strategies"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True)
    name = Column(String)
    strategy_code = Column(String)  # immediate_retry, exponential_backoff, dynamic_reroute, payment_link
    description = Column(Text)
    action_type = Column(String)
    
    # Financial and Operational Metrics
    expected_recovery_rate = Column(Float, default=0.0)
    expected_recovered_gmv = Column(Float, default=0.0)
    risk_level = Column(String, default="low")  # low, medium, high, critical
    risk_score = Column(Float, default=0.1)
    latency_impact_ms = Column(Float, default=0.0)
    customer_friction = Column(String, default="low")
    
    # Safety Check Status
    safety_approved = Column(Boolean, default=False)
    safety_violations = Column(JSON, default=list)
    requires_human_approval = Column(Boolean, default=False)
    human_approved = Column(Boolean, default=False)
    approved_by = Column(String, nullable=True)
    approval_notes = Column(Text, nullable=True)

    # Execution State
    executed = Column(Boolean, default=False)
    execution_mode = Column(String, default="simulated")  # simulated, test_mode
    execution_result = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utc_now)
