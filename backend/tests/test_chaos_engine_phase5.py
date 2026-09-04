import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.chaos_engine import ChaosEngine, ChaosSafetyViolation
from app.core.generator import PaymentStreamGenerator
from app.schemas.chaos import ChaosScenario, ScenarioStatus

client = TestClient(app)


def test_scenario_creation_and_listing():
    """Test creating a custom scenario and listing scenarios."""
    payload = {
        "name": "Custom Flash Sale Stress Test",
        "type": "custom",
        "description": "Test custom payment chaos with 4x traffic",
        "affected_payment_method": "UPI",
        "affected_bank": "Bank A",
        "failure_percentage": 0.25,
        "latency_increase_ms": 3000.0,
        "traffic_multiplier": 4.0,
        "duration_minutes": 20,
    }
    res = client.post("/api/chaos/scenarios", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == payload["name"]
    assert data["failure_percentage"] == 0.25
    assert data["traffic_multiplier"] == 4.0
    scenario_id = data["id"]

    # Verify listing includes it
    list_res = client.get("/api/chaos/scenarios")
    assert list_res.status_code == 200
    all_scenarios = list_res.json()
    assert any(s["id"] == scenario_id for s in all_scenarios)

    # Verify single fetch
    get_res = client.get(f"/api/chaos/scenarios/{scenario_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == scenario_id


def test_scenario_validation_invalid_parameters():
    """Test validation errors for invalid failure rates or methods."""
    # Invalid failure percentage (> 1.0)
    res = client.post("/api/chaos/scenarios", json={
        "name": "Invalid Scenario",
        "affected_payment_method": "UPI",
        "affected_bank": "Bank A",
        "failure_percentage": 1.5,
    })
    assert res.status_code == 422

    # Invalid payment method
    res2 = client.post("/api/chaos/scenarios", json={
        "name": "Invalid Method",
        "affected_payment_method": "CryptoCoins",
        "affected_bank": "Bank A",
        "failure_percentage": 0.2,
    })
    assert res2.status_code == 422


def test_safety_restriction_live_environment_blocked():
    """Section 9: Enforce that chaos CANNOT target live/production environment."""
    res = client.post("/api/chaos/scenarios/upi_degradation/inject", json={
        "scenario_id": "upi_degradation",
        "environment": "production",
    })
    assert res.status_code == 403
    assert "SAFETY VIOLATION" in res.json()["detail"]


def test_chaos_injection_before_after_and_timeline():
    """Test injecting chaos and checking Before/After analytics & event timeline."""
    res = client.post("/api/chaos/scenarios/upi_degradation/inject", json={
        "scenario_id": "upi_degradation",
        "severity": 0.22,
        "traffic_multiplier": 1.5,
        "environment": "sandbox",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "degraded"
    assert data["revenue_at_risk_inr"] > 0
    assert "impact" in data
    assert "timeline" in data

    # Verify Before / After delta
    impact = data["impact"]
    before = impact["before_chaos"]
    after = impact["after_chaos"]
    delta = impact["delta"]

    assert before["success_rate"] > after["success_rate"]
    assert delta["success_rate_drop"] > 0
    assert delta["latency_increase_ms"] > 0
    assert delta["revenue_at_risk_inr"] == data["revenue_at_risk_inr"]

    # Verify Timeline Events
    timeline = data["timeline"]
    assert len(timeline) == 5
    states = [e["state"] for e in timeline]
    assert states == [
        "NORMAL",
        "CHAOS_INJECTED",
        "DEGRADATION_DETECTED",
        "IMPACT_CALCULATED",
        "SIMULATION_COMPLETED",
    ]


def test_flash_sale_predefined_scenario():
    """Section 4: Verify predefined FLASH SALE — UPI DEGRADATION scenario."""
    res = client.post("/api/chaos/scenarios/flash_sale_upi_degrade/inject", json={
        "scenario_id": "flash_sale_upi_degrade",
        "environment": "sandbox",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_name"] == "FLASH SALE — UPI DEGRADATION"
    assert data["current_success_rate"] < 0.95
    assert data["revenue_at_risk_inr"] > 1000000.0  # > ₹10 Lakhs


def test_scenario_impact_endpoint():
    """Verify GET /api/chaos/scenarios/{id}/impact."""
    res = client.get("/api/chaos/scenarios/bank_outage/impact")
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "bank_outage"
    assert data["classification"] == "SIMULATED SCENARIO"
    assert len(data["timeline"]) == 5
    assert data["before_after"]["delta"]["success_rate_drop"] > 0


def test_reproducible_chaos_injection():
    """Verify that same scenario and same seed produces deterministic results."""
    gen1 = PaymentStreamGenerator(seed=777)
    gen2 = PaymentStreamGenerator(seed=777)

    chaos1 = ChaosEngine(seed=777)
    chaos2 = ChaosEngine(seed=777)

    scenario = chaos1.get_scenario("upi_degradation")
    assert scenario is not None

    batch1 = gen1.generate_batch(500)
    batch2 = gen2.generate_batch(500)

    p1, m1 = chaos1.apply_chaos(batch1, scenario)
    p2, m2 = chaos2.apply_chaos(batch2, scenario)

    assert m1["failed_transactions"] == m2["failed_transactions"]
    assert m1["scaled_revenue_at_risk"] == m2["scaled_revenue_at_risk"]
    assert m1["success_rate"] == m2["success_rate"]
    assert m1["avg_latency_ms"] == m2["avg_latency_ms"]
