from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: str
    timestamp: datetime
    actor: str
    action: str
    incident_id: Optional[str] = None
    strategy_id: Optional[str] = None
    decision: str
    risk_status: str
    input_data: Optional[Dict[str, Any]] = None
    result_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
