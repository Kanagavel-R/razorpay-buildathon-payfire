from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import IncidentModel

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("/current")
def get_current_incident(db: Session = Depends(get_db)):
    """Fetches active incident telemetry, or returns nominal healthy baseline."""
    incident = (
        db.query(IncidentModel)
        .filter(IncidentModel.status.in_(["active", "analyzing"]))
        .order_by(IncidentModel.created_at.desc())
        .first()
    )

    if not incident:
        # Healthy nominal state
        return {
            "is_active_incident": False,
            "incident_id": None,
            "status": "healthy",
            "scenario_name": "Nominal Operation",
            "expected_transactions": 100000,
            "expected_gmv": 20000000.0,
            "success_rate": 0.985,
            "failure_rate": 0.015,
            "avg_latency_ms": 820.0,
            "revenue_at_risk_inr": 0.0,
            "transactions_affected": 0,
            "failed_gmv_inr": 0.0,
            "ai_analyzed": False,
        }

    return {
        "is_active_incident": True,
        "incident_id": incident.id,
        "status": incident.status,
        "scenario_id": incident.scenario_id,
        "scenario_name": incident.scenario_name,
        "expected_transactions": incident.expected_transactions,
        "expected_gmv": incident.expected_gmv,
        "success_rate": incident.success_rate,
        "failure_rate": incident.failure_rate,
        "avg_latency_ms": incident.avg_latency_ms,
        "revenue_at_risk_inr": incident.revenue_at_risk,
        "transactions_affected": incident.transactions_affected,
        "failed_gmv_inr": incident.failed_gmv,
        "affected_payment_method": incident.affected_payment_method,
        "affected_bank": incident.affected_bank,
        "ai_analyzed": incident.ai_analyzed,
        "ai_root_cause": incident.ai_root_cause,
        "ai_confidence": incident.ai_confidence,
        "ai_evidence": incident.ai_evidence,
        "ai_affected_components": incident.ai_affected_components,
        "ai_uncertainties": incident.ai_uncertainties,
        "created_at": incident.created_at.isoformat() if incident.created_at else None,
    }


@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Fetches details of a specific incident."""
    incident = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident
