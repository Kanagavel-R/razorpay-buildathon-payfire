from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, JSON
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class SimulationModel(Base):
    __tablename__ = "simulations"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True)
    seed = Column(Integer, default=42)
    sample_size = Column(Integer, default=1000)
    status = Column(String, default="completed")  # running, completed, failed
    created_at = Column(DateTime, default=utc_now)


class SimulationResultModel(Base):
    __tablename__ = "simulation_results"

    id = Column(String, primary_key=True, index=True)
    simulation_id = Column(String, index=True)
    strategy_id = Column(String, index=True)
    strategy_name = Column(String)
    arm_type = Column(String)  # baseline, immediate_retry, backoff, reroute, payment_link
    
    # Financial Simulation Outputs
    simulated_transactions = Column(Integer, default=1000)
    recovered_transactions = Column(Integer, default=0)
    failed_transactions = Column(Integer, default=0)
    recovered_gmv = Column(Float, default=0.0)
    net_recovery_rate = Column(Float, default=0.0)
    
    # Operational & Risk Metrics
    avg_latency_ms = Column(Float, default=0.0)
    p95_latency_ms = Column(Float, default=0.0)
    retry_count = Column(Integer, default=0)
    duplicate_risk_count = Column(Integer, default=0)
    customer_churn_risk = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=utc_now)
