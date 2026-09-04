import pytest
from app.core.policy_engine import DeterministicPolicyEngine
from app.schemas.strategy import StrategyItem


def test_safety_policies_immediate_retry_blocked():
    engine = DeterministicPolicyEngine()
    
    strat_immediate = StrategyItem(
        id="strat_imm",
        incident_id="inc_1",
        name="Immediate Auto-Retry",
        strategy_code="immediate_retry",
        description="Fast retry without backoff",
        action_type="RETRY_IMMEDIATE",
        expected_recovery_rate=0.35,
        expected_recovered_gmv=500000.0,
        risk_level="high",
        risk_score=0.85,
        latency_impact_ms=800.0,
        customer_friction="low",
        safety_approved=False,
        requires_human_approval=False,
        human_approved=False,
        executed=False,
    )

    eval_result = engine.evaluate_strategy(strat_immediate, rca_confidence=0.85, has_high_value_txns=False)
    
    # Must fail Rule 4 (Duplicate Protection) and Rule 5 (Cooldown)
    assert eval_result.all_rules_passed is False
    r4 = next(r for r in eval_result.rule_evaluations if r.rule_id == "RULE_4_DUPLICATE_PROTECTION")
    assert r4.passed is False


def test_safety_policies_high_value_requires_human_approval():
    engine = DeterministicPolicyEngine()
    
    strat_reroute = StrategyItem(
        id="strat_reroute",
        incident_id="inc_1",
        name="Smart Dynamic Route Rerouting",
        strategy_code="dynamic_reroute",
        description="Reroute to Bank B",
        action_type="DYNAMIC_REROUTE",
        expected_recovery_rate=0.89,
        expected_recovered_gmv=1800000.0,
        risk_level="low",
        risk_score=0.12,
        latency_impact_ms=1200.0,
        customer_friction="low",
        safety_approved=True,
        requires_human_approval=True,
        human_approved=False,
        executed=False,
    )

    eval_result = engine.evaluate_strategy(strat_reroute, rca_confidence=0.85, has_high_value_txns=True)
    
    assert eval_result.all_rules_passed is True
    assert eval_result.requires_human_approval is True
    assert len(eval_result.approval_reasons) > 0


def test_safety_policies_low_confidence_escalates():
    engine = DeterministicPolicyEngine()
    strat_backoff = StrategyItem(
        id="strat_backoff",
        incident_id="inc_1",
        name="Exponential Backoff",
        strategy_code="exponential_backoff",
        description="Backoff",
        action_type="RETRY_BACKOFF",
        expected_recovery_rate=0.60,
        expected_recovered_gmv=1200000.0,
        risk_level="medium",
        risk_score=0.30,
        latency_impact_ms=10000.0,
        customer_friction="medium",
        safety_approved=True,
        requires_human_approval=False,
        human_approved=False,
        executed=False,
    )

    # Low confidence 0.60 (< 0.75 threshold)
    eval_result = engine.evaluate_strategy(strat_backoff, rca_confidence=0.60, has_high_value_txns=False)
    
    r3 = next(r for r in eval_result.rule_evaluations if r.rule_id == "RULE_3_CONFIDENCE_THRESHOLD")
    assert r3.passed is False
    assert eval_result.requires_human_approval is True
