import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.incident import IncidentModel
from app.models.audit import AuditLogModel
from app.models.chaos_scenario import ChaosScenarioModel
from app.schemas.chaos import (
    ChaosScenario,
    CreateChaosScenarioRequest,
    ChaosInjectionRequest,
    ChaosImpactResponse,
    ChaosResponse,
    ScenarioStatus,
)
from app.core.chaos_engine import ChaosEngine, ChaosSafetyViolation
from app.core.generator import PaymentStreamGenerator

router = APIRouter(prefix="/chaos", tags=["Chaos Engine"])
chaos_engine = ChaosEngine(seed=42)
generator = PaymentStreamGenerator(seed=42)


@router.post("/scenarios", response_model=ChaosScenario, status_code=201)
def create_scenario(req: CreateChaosScenarioRequest, db: Session = Depends(get_db)):
    """Creates a user-defined custom chaos scenario with rigorous validation."""
    scenario_id = f"custom_{uuid.uuid4().hex[:8]}"

    scenario = ChaosScenario(
        id=scenario_id,
        name=req.name,
        type=req.type.value,
        description=req.description or f"Custom chaos: {req.affected_payment_method} on {req.affected_bank}",
        affected_payment_method=req.affected_payment_method,
        affected_bank=req.affected_bank,
        failure_percentage=req.failure_percentage,
        latency_increase_ms=req.latency_increase_ms,
        traffic_multiplier=req.traffic_multiplier,
        duration_minutes=req.duration_minutes,
        webhook_delay_seconds=req.webhook_delay_seconds,
        parameters=req.parameters,
        status=ScenarioStatus.READY,
        created_at=datetime.now(timezone.utc),
    )

    try:
        chaos_engine.register_custom_scenario(scenario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Persist in DB
    db_scenario = ChaosScenarioModel(
        id=scenario.id,
        name=scenario.name,
        type=scenario.type,
        description=scenario.description,
        severity=scenario.failure_percentage,
        parameters=scenario.parameters,
        duration_minutes=scenario.duration_minutes,
        affected_payment_method=scenario.affected_payment_method,
        affected_bank=scenario.affected_bank,
        status="READY",
    )
    db.add(db_scenario)

    # Audit log
    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="OPERATOR",
        action="CHAOS_SCENARIO_CREATED",
        incident_id=None,
        decision="ALLOW",
        risk_status="LOW",
        input_data={"scenario_id": scenario.id, "name": scenario.name},
        notes=f"Created custom chaos scenario '{scenario.name}'.",
    )
    db.add(audit_entry)
    db.commit()

    return scenario


@router.get("/scenarios", response_model=List[ChaosScenario])
def list_scenarios(db: Session = Depends(get_db)):
    """Lists all preset and custom chaos scenarios."""
    scenarios = chaos_engine.list_scenarios()
    return scenarios


@router.get("/scenarios/{scenario_id}", response_model=ChaosScenario)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Fetches details for a specific chaos scenario."""
    scenario = chaos_engine.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")
    return scenario


@router.post("/scenarios/{scenario_id}/inject", response_model=ChaosResponse)
def inject_chaos(
    scenario_id: str,
    req: Optional[ChaosInjectionRequest] = Body(default=None),
    db: Session = Depends(get_db),
):
    """Section 3: Injects controlled payment failure, computes Before/After delta, records timeline, and updates active incident."""
    scenario = chaos_engine.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    # Section 9 Safety Check: Live environment protection
    env = req.environment if req else "sandbox"
    try:
        chaos_engine.validate_safety_environment(env)
    except ChaosSafetyViolation as e:
        raise HTTPException(status_code=403, detail=str(e))

    severity_override = req.severity if (req and req.severity is not None) else None
    traffic_override = req.traffic_multiplier if (req and req.traffic_multiplier is not None) else None

    # 1. Generate Baseline stream
    sample_size = int(1000 * (traffic_override or scenario.traffic_multiplier))
    sample_size = min(max(500, sample_size), 5000)
    baseline_txns = generator.generate_batch(count=sample_size)

    # 2. Inject Chaos
    degraded_txns, metrics = chaos_engine.apply_chaos(
        baseline_txns,
        scenario=scenario,
        severity_override=severity_override,
        traffic_multiplier_override=traffic_override,
    )

    # 3. Before / After Analysis
    before_after = chaos_engine.compute_before_after_analysis(baseline_txns, degraded_txns)

    # 4. Chaos Event Timeline
    timeline = chaos_engine.generate_chaos_timeline(scenario, metrics)

    # 5. Update Database state
    incident_id = f"inc_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}"

    # Deactivate prior active incidents
    db.query(IncidentModel).filter(IncidentModel.status == "active").update({"status": "archived"})

    # Create new active incident
    incident = IncidentModel(
        id=incident_id,
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        status="active",
        severity=severity_override if severity_override is not None else scenario.failure_percentage,
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
        traffic_multiplier=traffic_override or scenario.traffic_multiplier,
    )
    db.add(incident)

    # Store or update Scenario in DB with Impact & Timeline
    db_sc = db.query(ChaosScenarioModel).filter(ChaosScenarioModel.id == scenario.id).first()
    if not db_sc:
        db_sc = ChaosScenarioModel(
            id=scenario.id,
            name=scenario.name,
            type=scenario.type,
            description=scenario.description,
            severity=scenario.failure_percentage,
            parameters=scenario.parameters,
            duration_minutes=scenario.duration_minutes,
            affected_payment_method=scenario.affected_payment_method,
            affected_bank=scenario.affected_bank,
        )
        db.add(db_sc)

    db_sc.status = "RUNNING"
    db_sc.impact_data = before_after.model_dump()
    db_sc.timeline_events = [e.model_dump() for e in timeline]

    # Audit log entry
    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="OPERATOR",
        action="CHAOS_INJECTED",
        incident_id=incident_id,
        decision="ALLOW",
        risk_status="HIGH",
        input_data={"scenario_id": scenario.id, "severity": incident.severity},
        result_data={
            "revenue_at_risk": metrics["scaled_revenue_at_risk"],
            "success_rate_drop": before_after.delta["success_rate_drop"],
            "latency_increase_ms": before_after.delta["latency_increase_ms"],
        },
        notes=f"Injected chaos scenario '{scenario.name}'. Revenue at risk: INR {metrics['scaled_revenue_at_risk']:,.0f}.",
    )
    db.add(audit_entry)
    db.commit()

    return ChaosResponse(
        status="degraded",
        incident_id=incident_id,
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        message="Chaos injected successfully. System transitioned to degraded state.",
        baseline_success_rate=before_after.before_chaos.success_rate,
        current_success_rate=metrics["success_rate"],
        current_failure_rate=metrics["failure_rate"],
        revenue_at_risk_inr=metrics["scaled_revenue_at_risk"],
        avg_latency_ms=metrics["avg_latency_ms"],
        transactions_affected=metrics["affected_transactions"],
        impact=before_after,
        timeline=timeline,
    )


@router.get("/scenarios/{scenario_id}/impact", response_model=ChaosImpactResponse)
def get_scenario_impact(scenario_id: str, db: Session = Depends(get_db)):
    """Section 5: Returns the Before/After impact metrics and chronological event timeline for a chaos scenario."""
    scenario = chaos_engine.get_scenario(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    db_sc = db.query(ChaosScenarioModel).filter(ChaosScenarioModel.id == scenario.id).first()
    if db_sc and db_sc.impact_data:
        before_after = db_sc.impact_data
        timeline = db_sc.timeline_events or []
        status = ScenarioStatus(db_sc.status)
    else:
        # Generate simulation on-demand
        sample_size = int(1000 * scenario.traffic_multiplier)
        sample_size = min(max(500, sample_size), 5000)
        baseline_txns = generator.generate_batch(count=sample_size)
        degraded_txns, metrics = chaos_engine.apply_chaos(baseline_txns, scenario)
        ba_obj = chaos_engine.compute_before_after_analysis(baseline_txns, degraded_txns)
        tl_obj = chaos_engine.generate_chaos_timeline(scenario, metrics)
        before_after = ba_obj.model_dump()
        timeline = [e.model_dump() for e in tl_obj]
        status = ScenarioStatus.READY

    return ChaosImpactResponse(
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        status=status,
        classification="SIMULATED SCENARIO",
        timeline=timeline,
        before_after=before_after,
    )
