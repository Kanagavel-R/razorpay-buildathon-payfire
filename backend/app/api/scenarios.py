import uuid
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import IncidentModel
from app.models.audit import AuditLogModel
from app.schemas.chaos import ChaosScenario, ChaosInjectionRequest, ChaosResponse
from app.core.chaos_engine import ChaosEngine
from app.core.generator import PaymentStreamGenerator

router = APIRouter(prefix="/scenarios", tags=["Chaos Scenarios"])
chaos_engine = ChaosEngine(seed=42)
generator = PaymentStreamGenerator(seed=42)


@router.get("", response_model=List[ChaosScenario])
def list_scenarios():
    """Lists all available chaos scenarios."""
    return chaos_engine.list_scenarios()


@router.post("/inject", response_model=ChaosResponse)
def inject_chaos(req: ChaosInjectionRequest, db: Session = Depends(get_db)):
    """Injects a chosen chaos scenario, computes telemetry degradation, and updates active incident."""
    scenario = chaos_engine.get_scenario(req.scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{req.scenario_id}' not found.")

    # Generate baseline stream
    baseline_txns = generator.generate_batch(count=1000)

    # Apply chaos
    perturbed_txns, metrics = chaos_engine.apply_chaos(
        baseline_txns,
        scenario=scenario,
        severity_override=req.severity,
    )

    incident_id = f"inc_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

    # Deactivate existing active incidents
    db.query(IncidentModel).filter(IncidentModel.status == "active").update({"status": "archived"})

    # Create new incident record
    incident = IncidentModel(
        id=incident_id,
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        status="active",
        severity=req.severity if req.severity is not None else scenario.failure_percentage,
        expected_gmv=20000000.0,
        expected_transactions=100000,
        revenue_at_risk=metrics["scaled_revenue_at_risk"],
        failed_gmv=metrics["sample_failed_gmv"],
        transactions_affected=metrics["affected_transactions"],
        success_rate=metrics["success_rate"],
        failure_rate=metrics["failure_rate"],
        avg_latency_ms=metrics["avg_latency_ms"],
        affected_payment_method=scenario.affected_payment_method,
        affected_bank=scenario.affected_bank,
        traffic_multiplier=req.traffic_multiplier or scenario.traffic_multiplier,
    )
    db.add(incident)

    # Audit log
    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="OPERATOR",
        action="CHAOS_INJECTED",
        incident_id=incident_id,
        decision="ALLOW",
        risk_status="HIGH",
        input_data={"scenario_id": req.scenario_id, "severity": incident.severity},
        result_data=metrics,
        notes=f"Injected chaos scenario '{scenario.name}'. Revenue at risk estimated at ₹{metrics['scaled_revenue_at_risk']:,.0f}.",
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(incident)

    return ChaosResponse(
        status="degraded",
        incident_id=incident_id,
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        message=f"Chaos injected successfully. System transitioned to degraded state.",
        baseline_success_rate=0.985,
        current_success_rate=metrics["success_rate"],
        current_failure_rate=metrics["failure_rate"],
        revenue_at_risk_inr=metrics["scaled_revenue_at_risk"],
        avg_latency_ms=metrics["avg_latency_ms"],
        transactions_affected=metrics["affected_transactions"],
    )


@router.post("/reset")
def reset_to_baseline(db: Session = Depends(get_db)):
    """Resets system state back to healthy nominal baseline."""
    db.query(IncidentModel).filter(IncidentModel.status == "active").update({"status": "resolved"})
    
    # Audit log
    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="OPERATOR",
        action="SYSTEM_RESET_BASELINE",
        decision="ALLOW",
        risk_status="LOW",
        notes="Reset system to healthy nominal baseline.",
    )
    db.add(audit_entry)
    db.commit()

    return {"status": "healthy", "message": "Payment system restored to nominal baseline (98.5% success rate)."}
