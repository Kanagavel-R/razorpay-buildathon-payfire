import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import IncidentModel
from app.models.strategy import StrategyModel
from app.models.audit import AuditLogModel
from app.schemas.rca import RcaResult
from app.schemas.strategy import StrategyResponse, StrategyItem
from app.core.rca_engine import AiIncidentAnalysisOrchestrator
from app.core.strategy_engine import RecoveryStrategist
from app.core.generator import PaymentStreamGenerator
from app.core.chaos_engine import ChaosEngine

router = APIRouter(prefix="/incidents", tags=["AI Reasoning & Strategies"])
ai_orchestrator = AiIncidentAnalysisOrchestrator()
generator = PaymentStreamGenerator(seed=42)
chaos_engine = ChaosEngine(seed=42)


@router.post("/{incident_id}/analyze", response_model=RcaResult)
def analyze_incident(
    incident_id: str,
    simulate_ai_failure: bool = Query(False, description="Simulate AI service downtime to test graceful fallback"),
    db: Session = Depends(get_db),
):
    """Runs AI Root Cause Analysis across 6 specialized AI agents with deterministic fallback protection."""
    incident = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Re-simulate the incident sample batch for RCA
    scenario = chaos_engine.get_scenario(incident.scenario_id)
    scenario_dict = scenario.dict() if scenario else {
        "id": incident.scenario_id,
        "name": incident.scenario_name,
        "affected_payment_method": incident.affected_payment_method,
        "affected_bank": incident.affected_bank,
        "traffic_multiplier": incident.traffic_multiplier,
    }

    sample_size = int(1000 * (incident.traffic_multiplier or 1.0))
    sample_size = min(max(500, sample_size), 3000)
    baseline_txns = generator.generate_batch(count=sample_size)

    if scenario:
        perturbed_txns, metrics = chaos_engine.apply_chaos(
            baseline_txns,
            scenario=scenario,
            severity_override=incident.severity,
            traffic_multiplier_override=incident.traffic_multiplier,
        )
    else:
        perturbed_txns = baseline_txns
        metrics = {
            "scaled_revenue_at_risk": incident.revenue_at_risk,
            "failure_rate": incident.failure_rate,
            "avg_latency_ms": incident.avg_latency_ms,
            "affected_transactions": incident.transactions_affected,
            "expected_gmv": incident.expected_gmv or 20000000.0,
            "sample_failed_gmv": incident.failed_gmv or 0.0,
        }

    # Run Multi-Agent AI Analysis
    rca = ai_orchestrator.analyze_incident(
        incident_id=incident_id,
        transactions=perturbed_txns,
        metrics=metrics,
        scenario_context=scenario_dict,
        simulate_ai_failure=simulate_ai_failure,
    )

    # Persist AI findings to incident
    incident.ai_analyzed = True
    incident.ai_root_cause = rca.root_cause
    incident.ai_confidence = rca.confidence
    incident.ai_evidence = rca.evidence
    incident.ai_affected_components = rca.affected_components
    incident.ai_uncertainties = rca.uncertainties

    # Record Audit Event
    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="AI_RCA_AGENT",
        action="ROOT_CAUSE_ANALYSIS_COMPLETED",
        incident_id=incident_id,
        decision="ALLOW",
        risk_status="LOW" if rca.confidence >= 0.75 else "MEDIUM",
        result_data={
            "confidence": rca.confidence,
            "root_cause": rca.root_cause,
            "revenue_at_risk": rca.revenue_at_risk_inr,
            "data_mode": rca.data_mode,
        },
        notes=f"AI Multi-Agent RCA completed with {rca.confidence*100:.0f}% confidence ({rca.data_mode}).",
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(incident)

    return rca


@router.post("/{incident_id}/strategies", response_model=StrategyResponse)
def generate_strategies(incident_id: str, db: Session = Depends(get_db)):
    """Generates candidate recovery strategies for an incident including Baseline benchmark and stopping conditions."""
    incident = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if not incident.ai_analyzed:
        analyze_incident(incident_id=incident_id, db=db)
        db.refresh(incident)

    rca_obj = RcaResult(
        incident_id=incident_id,
        root_cause=incident.ai_root_cause or "Payment route degradation",
        confidence=incident.ai_confidence or 0.87,
        evidence=incident.ai_evidence or [],
        affected_components=incident.ai_affected_components or [],
        uncertainties=incident.ai_uncertainties or [],
        revenue_at_risk_inr=incident.revenue_at_risk,
        affected_volume=incident.transactions_affected,
        recommended_action_summary="",
        is_autonomous_allowed=(incident.ai_confidence or 0.87) >= 0.75,
    )

    strategy_items = RecoveryStrategist.generate_strategies(incident_id, rca_obj)

    # Remove existing strategies for this incident
    db.query(StrategyModel).filter(StrategyModel.incident_id == incident_id).delete()

    for s in strategy_items:
        strat_model = StrategyModel(
            id=s.id,
            incident_id=s.incident_id,
            name=s.name,
            strategy_code=s.strategy_code,
            description=s.description,
            action_type=s.action_type,
            expected_recovery_rate=s.expected_recovery_rate,
            expected_recovered_gmv=s.expected_recovered_gmv,
            risk_level=s.risk_level,
            risk_score=s.risk_score,
            latency_impact_ms=s.latency_impact_ms,
            customer_friction=s.customer_friction,
            safety_approved=s.safety_approved,
            requires_human_approval=s.requires_human_approval,
            human_approved=s.human_approved,
            executed=s.executed,
        )
        db.add(strat_model)

    audit_entry = AuditLogModel(
        id=f"aud_{uuid.uuid4().hex[:10]}",
        actor="AI_STRATEGY_AGENT",
        action="STRATEGIES_GENERATED",
        incident_id=incident_id,
        decision="ALLOW",
        risk_status="LOW",
        notes=f"Generated {len(strategy_items)} candidate recovery strategies for incident {incident_id}.",
    )
    db.add(audit_entry)
    db.commit()

    return StrategyResponse(incident_id=incident_id, strategies=strategy_items)
