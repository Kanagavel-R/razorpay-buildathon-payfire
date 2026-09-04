from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Text
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class ChaosScenarioModel(Base):
    __tablename__ = "chaos_scenarios"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # upi_degradation, bank_outage, payment_timeout, webhook_delay, traffic_spike, card_decline_spike, custom
    description = Column(Text, nullable=True)
    severity = Column(Float, default=0.20)
    parameters = Column(JSON, default=dict)
    duration_minutes = Column(Integer, default=15)
    affected_payment_method = Column(String, default="UPI")
    affected_bank = Column(String, default="Bank A")
    status = Column(String, default="READY")  # DRAFT, READY, RUNNING, COMPLETED, FAILED
    
    # Before / After Analysis & Timeline Results
    impact_data = Column(JSON, nullable=True)
    timeline_events = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
