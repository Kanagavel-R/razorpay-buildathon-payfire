from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text, Boolean
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, index=True)
    scenario_name = Column(String)
    status = Column(String, default="active")  # active, analyzing, resolved, archived
    severity = Column(Float, default=0.15)
    
    # Financial Impact Metrics
    expected_gmv = Column(Float, default=20000000.0)
    expected_transactions = Column(Integer, default=100000)
    revenue_at_risk = Column(Float, default=0.0)
    failed_gmv = Column(Float, default=0.0)
    transactions_affected = Column(Integer, default=0)
    success_rate = Column(Float, default=0.98)
    failure_rate = Column(Float, default=0.02)
    avg_latency_ms = Column(Float, default=850.0)

    # Injected Parameters
    affected_payment_method = Column(String, default="UPI")
    affected_bank = Column(String, default="Bank A")
    traffic_multiplier = Column(Float, default=1.0)

    # AI RCA Structured Results
    ai_analyzed = Column(Boolean, default=False)
    ai_root_cause = Column(Text, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_evidence = Column(JSON, nullable=True)
    ai_affected_components = Column(JSON, nullable=True)
    ai_uncertainties = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
