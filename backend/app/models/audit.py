from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, Text
from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    actor = Column(String, default="SYSTEM")
    action = Column(String, index=True)
    incident_id = Column(String, nullable=True, index=True)
    strategy_id = Column(String, nullable=True)
    decision = Column(String, default="ALLOW")
    risk_status = Column(String, default="LOW")
    input_data = Column(JSON, nullable=True)
    result_data = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
