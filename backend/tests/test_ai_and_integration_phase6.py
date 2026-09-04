"""Comprehensive Test Suite for Phase 6 (AI Multi-Agent Incident Analysis) and End-to-End Integration.

Verifies:
1. Multi-Agent AI Incident Analysis (all 6 specialized agents)
2. Deterministic financial math separation (no LLM arithmetic)
3. Graceful AI fallback behavior (DETERMINISTIC_FALLBACK)
4. Recovery strategy generation with stopping conditions and assumptions
5. Counterfactual simulation execution and recommendation
6. Deterministic safety policy validation
7. Full End-to-End pipeline:
   Chaos Injection -> Telemetry Degradation -> Multi-Agent AI Diagnosis -> Strategy Generation ->
   Counterfactual Simulation -> Safety Policy Gate -> Human Approval -> Test Execution -> Audit Trail
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.rca_engine import AiIncidentAnalysisOrchestrator
from app.core.generator import PaymentStreamGenerator
from app.core.chaos_engine import ChaosEngine
from app.core.strategy_engine import RecoveryStrategist
from app.core.policy_engine import DeterministicPolicyEngine
from app.core.simulation_engine import DiscretePaymentSimulator

client = TestClient(app)


def test_multi_agent_ai_incident_analysis():
    """Test that all 6 AI specialized agents generate structured Pydantic outputs."""
    orchestrator = AiIncidentAnalysisOrchestrator()
    generator = PaymentStreamGenerator(seed=42)
    chaos = ChaosEngine(seed=42)

    scenario = chaos.get_scenario("flash_sale_upi_degrade")
    txns = generator.generate_batch(count=1000)
    degraded_txns, metrics = chaos.apply_chaos(txns, scenario)

    res = orchestrator.analyze_incident(
        incident_id="inc_test_123",
        transactions=degraded_txns,
        metrics=metrics,
        scenario_context=scenario.dict(),
    )

    # Verify Unified Result
    assert res.incident_id == "inc_test_123"
    assert res.confidence >= 0.75
    assert len(res.evidence) >= 3
    assert len(res.affected_components) >= 2
    assert res.data_mode == "AI_AGENT_ANALYSIS"

    # Verify Agent 1: Scenario Analyst
    assert res.scenario_analyst is not None
    assert res.scenario_analyst.traffic_multiplier == 5.0
    assert res.scenario_analyst.affected_payment_method == "UPI"

    # Verify Agent 2: Root Cause Analyst
    assert res.root_cause_analyst is not None
    assert res.root_cause_analyst.bank_failure_ratio > 0.5
    assert "Bank A" in res.root_cause_analyst.root_cause

    # Verify Agent 3: Revenue Risk Analyst (Deterministic)
    assert res.revenue_risk_analyst is not None
    assert res.revenue_risk_analyst.calculation_engine == "DETERMINISTIC_FINANCIAL_FORMULA"
    assert res.revenue_risk_analyst.scaled_revenue_at_risk_inr > 0

    # Verify Agent 4: Recovery Strategist
    assert res.recovery_strategist is not None
    assert res.recovery_strategist.strategy_code in ["dynamic_reroute", "exponential_backoff"]
    assert res.recovery_strategist.is_autonomous_allowed is True

    # Verify Agent 5: Risk / Safety Analyst
    assert res.risk_safety_analyst is not None
    assert res.risk_safety_analyst.pre_flight_risk_level in ["LOW", "HIGH"]

    # Verify Agent 6: Explanation Generator
    assert res.explanation_generator is not None
    assert len(res.explanation_generator.headline) > 5
    assert "INR" in res.explanation_generator.financial_impact_callout


def test_deterministic_financial_math_integrity():
    """Verify that financial figures are strictly calculated deterministically and match expected bounds."""
    orchestrator = AiIncidentAnalysisOrchestrator()
    generator = PaymentStreamGenerator(seed=100)
    txns = generator.generate_batch(count=500)

    # Inject simulated metrics
    metrics = {
        "expected_gmv": 20000000.0,
        "scaled_revenue_at_risk": 1250000.50,
        "sample_failed_gmv": 45000.0,
        "affected_transactions": 85,
        "failure_rate": 0.17,
        "avg_latency_ms": 2200.0,
    }

    res = orchestrator.analyze_incident(
        incident_id="inc_math_test",
        transactions=txns,
        metrics=metrics,
    )

    # Financial figures must match the deterministic calculations exactly
    assert res.revenue_at_risk_inr == 1250000.50
    assert res.revenue_risk_analyst.scaled_revenue_at_risk_inr == 1250000.50
    assert res.revenue_risk_analyst.expected_gmv_inr == 20000000.0


def test_graceful_ai_fallback_behavior():
    """Test that when AI service is unavailable, system gracefully falls back to deterministic rules with clear labels."""
    orchestrator = AiIncidentAnalysisOrchestrator()
    generator = PaymentStreamGenerator(seed=42)
    txns = generator.generate_batch(count=200)

    metrics = {
        "scaled_revenue_at_risk": 500000.0,
        "affected_transactions": 25,
        "failure_rate": 0.125,
    }

    # Simulate AI downtime
    fallback_res = orchestrator.analyze_incident(
        incident_id="inc_fallback_1",
        transactions=txns,
        metrics=metrics,
        simulate_ai_failure=True,
    )

    assert fallback_res.data_mode == "DETERMINISTIC_FALLBACK"
    assert "[FALLBACK DIAGNOSIS]" in fallback_res.root_cause
    assert fallback_res.is_autonomous_allowed is False
    assert fallback_res.confidence == 0.70


def test_strategy_generation_stopping_conditions_and_assumptions():
    """Test that generated strategies include stopping conditions, assumptions, and confidence."""
    orchestrator = AiIncidentAnalysisOrchestrator()
    generator = PaymentStreamGenerator(seed=42)
    chaos = ChaosEngine(seed=42)

    scenario = chaos.get_scenario("flash_sale_upi_degrade")
    txns = generator.generate_batch(count=1000)
    degraded_txns, metrics = chaos.apply_chaos(txns, scenario)

    rca = orchestrator.analyze_incident("inc_strat_test", degraded_txns, metrics, scenario.dict())
    strategies = RecoveryStrategist.generate_strategies("inc_strat_test", rca)

    assert len(strategies) >= 5
    codes = [s.strategy_code for s in strategies]
    assert "no_action" in codes
    assert "immediate_retry" in codes
    assert "exponential_backoff" in codes
    assert "dynamic_reroute" in codes
    assert "payment_link" in codes

    for s in strategies:
        assert len(s.stopping_conditions) >= 1
        assert len(s.assumptions) >= 1
        assert 0.0 <= s.confidence <= 1.0
        assert s.expected_benefit is not None


def test_full_end_to_end_pipeline_integration():
    """Comprehensive test exercising the full 10-stage PayFire recovery workflow via REST API."""
    # 1. Reset baseline
    reset_res = client.post("/api/scenarios/reset")
    assert reset_res.status_code == 200

    # 2. Inject Flash Sale Chaos
    inject_res = client.post("/api/chaos/scenarios/flash_sale_upi_degrade/inject", json={
        "scenario_id": "flash_sale_upi_degrade",
        "severity": 0.15,
        "traffic_multiplier": 5.0,
        "environment": "sandbox",
    })
    assert inject_res.status_code == 200
    inject_data = inject_res.json()
    incident_id = inject_data["incident_id"]
    assert incident_id is not None
    assert inject_data["revenue_at_risk_inr"] > 0
    assert len(inject_data["timeline"]) == 5

    # 3. Query Active Incident
    cur_res = client.get("/api/incidents/current")
    assert cur_res.status_code == 200
    cur_data = cur_res.json()
    assert cur_data["is_active_incident"] is True
    assert cur_data["incident_id"] == incident_id

    # 4. Run Multi-Agent AI RCA
    rca_res = client.post(f"/api/incidents/{incident_id}/analyze")
    assert rca_res.status_code == 200
    rca_data = rca_res.json()
    assert rca_data["incident_id"] == incident_id
    assert rca_data["data_mode"] == "AI_AGENT_ANALYSIS"
    assert rca_data["root_cause_analyst"]["bank_failure_ratio"] > 0.5
    assert rca_data["revenue_risk_analyst"]["scaled_revenue_at_risk_inr"] > 0

    # 5. Generate Candidate Recovery Strategies
    strat_res = client.post(f"/api/incidents/{incident_id}/strategies")
    assert strat_res.status_code == 200
    strat_data = strat_res.json()
    strategies = strat_data["strategies"]
    assert len(strategies) >= 5

    # 6. Run SimPy Counterfactual Simulation
    sim_res = client.post("/api/simulations/run", json={
        "incident_id": incident_id,
        "seed": 42,
        "sample_size": 1000,
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert len(sim_data["results"]) >= 4
    rec_strat_id = sim_data["recommended_strategy_id"]
    assert rec_strat_id is not None

    # 7. Validate Safety Gate on Recommended Strategy
    safe_res = client.post(f"/api/safety/validate/{rec_strat_id}")
    assert safe_res.status_code == 200
    safe_data = safe_res.json()
    assert safe_data["all_rules_passed"] is True
    # If high value orders exist, human approval is required
    assert len(safe_data["rule_evaluations"]) == 8

    # 8. Human Approval Workflow
    approve_res = client.post("/api/execution/approve", json={
        "strategy_id": rec_strat_id,
        "approved_by": "Lead PayOps Architect",
        "notes": "Verified against counterfactual matrix and safety rules.",
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "approved"

    # 9. Execute Recovery in Test Mode
    exec_res = client.post("/api/execution/execute", json={
        "strategy_id": rec_strat_id,
        "execution_mode": "test_mode",
    })
    assert exec_res.status_code == 200
    assert exec_res.json()["status"] == "executed"

    # 10. Verify Complete Audit Trail
    audit_res = client.get(f"/api/audit?incident_id={incident_id}")
    assert audit_res.status_code == 200
    audit_events = audit_res.json()
    assert len(audit_events) >= 5

    actions = [e["action"] for e in audit_events]
    assert "CHAOS_INJECTED" in actions
    assert "ROOT_CAUSE_ANALYSIS_COMPLETED" in actions
    assert "STRATEGIES_GENERATED" in actions
    assert "STRATEGY_HUMAN_APPROVED" in actions
    assert "TEST_MODE_ACTION_EXECUTED" in actions
