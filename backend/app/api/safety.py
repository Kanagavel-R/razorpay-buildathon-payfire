from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.strategy import StrategyModel
from app.models.incident import IncidentModel
from app.schemas.safety import SafetyPolicyCheckResponse
from app.schemas.strategy import StrategyItem
from app.core.policy_engine import DeterministicPolicyEngine
from app.config import settings

router = APIRouter(prefix="/safety", tags=["Safety Gate & Policies"])
policy_engine = DeterministicPolicyEngine()


@router.get("/policies")
def get_configured_policies():
    """Returns active safety rules, thresholds, and operational constraints."""
    return {
        "max_retries": settings.MAX_RETRY_ATTEMPTS,
        "high_value_threshold_inr": settings.HIGH_VALUE_THRESHOLD_INR,
        "ai_confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "retry_cooldown_seconds": settings.RETRY_COOLDOWN_SECONDS,
        "circuit_breaker_fail_threshold": settings.SECONDARY_ROUTE_CIRCUIT_BREAKER_FAIL_RATE,
        "duplicate_detection_active": True,
        "sandbox_isolation_enforced": True,
        "mandatory_audit_trail": True,
    }


@router.post("/validate/{strategy_id}", response_model=SafetyPolicyCheckResponse)
def validate_strategy_safety(strategy_id: str, db: Session = Depends(get_db)):
    """Evaluates a strategy against all 8 deterministic payment safety guardrails."""
    strat = db.query(StrategyModel).filter(StrategyModel.id == strategy_id).first()
    if not strat:
        raise HTTPException(status_code=404, detail="Strategy not found.")

    incident = db.query(IncidentModel).filter(IncidentModel.id == strat.incident_id).first()
    confidence = incident.ai_confidence if (incident and incident.ai_confidence) else 0.87

    strat_item = StrategyItem(
        id=strat.id,
        incident_id=strat.incident_id,
        name=strat.name,
        strategy_code=strat.strategy_code,
        description=strat.description,
        action_type=strat.action_type,
        expected_recovery_rate=strat.expected_recovery_rate,
        expected_recovered_gmv=strat.expected_recovered_gmv,
        risk_level=strat.risk_level,
        risk_score=strat.risk_score,
        latency_impact_ms=strat.latency_impact_ms,
        customer_friction=strat.customer_friction,
        safety_approved=strat.safety_approved,
        requires_human_approval=strat.requires_human_approval,
        human_approved=strat.human_approved,
        executed=strat.executed,
    )

    evaluation = policy_engine.evaluate_strategy(
        strategy=strat_item,
        rca_confidence=confidence,
        has_high_value_txns=True,
    )

    # Update database model with safety decision
    strat.safety_approved = evaluation.all_rules_passed
    strat.requires_human_approval = evaluation.requires_human_approval
    strat.safety_violations = [r.model_dump() for r in evaluation.rule_evaluations if not r.passed]
    db.commit()

    return evaluation
