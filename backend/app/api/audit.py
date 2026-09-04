from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit import AuditLogModel
from app.schemas.audit import AuditEventResponse

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


@router.get("", response_model=List[AuditEventResponse])
def get_audit_trail(
    incident_id: Optional[str] = Query(None, description="Filter by incident ID"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retrieves immutable audit trail events in reverse chronological sequence."""
    query = db.query(AuditLogModel)
    if incident_id:
        query = query.filter(AuditLogModel.incident_id == incident_id)
    
    events = query.order_by(AuditLogModel.timestamp.desc()).limit(limit).all()
    return events
