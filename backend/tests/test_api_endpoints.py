import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "PayFire"


def test_api_scenarios_and_injection():
    # List scenarios
    res = client.get("/api/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) >= 4

    # Inject chaos
    inject_res = client.post("/api/scenarios/inject", json={
        "scenario_id": "flash_sale_upi_degrade",
        "severity": 0.20,
    })
    assert inject_res.status_code == 200
    inj_data = inject_res.json()
    assert inj_data["status"] == "degraded"
    assert inj_data["revenue_at_risk_inr"] > 0
    incident_id = inj_data["incident_id"]

    # Check current incident
    cur_res = client.get("/api/incidents/current")
    assert cur_res.status_code == 200
    cur_data = cur_res.json()
    assert cur_data["is_active_incident"] is True
    assert cur_data["incident_id"] == incident_id

    # Run AI RCA
    rca_res = client.post(f"/api/incidents/{incident_id}/analyze")
    assert rca_res.status_code == 200
    rca_data = rca_res.json()
    assert rca_data["confidence"] >= 0.75
    assert len(rca_data["evidence"]) > 0

    # Generate strategies
    strat_res = client.post(f"/api/incidents/{incident_id}/strategies")
    assert strat_res.status_code == 200
    strat_data = strat_res.json()
    assert len(strat_data["strategies"]) >= 4

    # Run counterfactual simulation
    sim_res = client.post("/api/simulations/run", json={
        "incident_id": incident_id,
        "seed": 42,
        "sample_size": 500,
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert len(sim_data["results"]) == 5
    assert sim_data["recommended_strategy_id"] != ""

    # Validate safety of recommended strategy
    rec_id = sim_data["recommended_strategy_id"]
    safety_res = client.post(f"/api/safety/validate/{rec_id}")
    assert safety_res.status_code == 200
    safety_data = safety_res.json()
    assert safety_data["all_rules_passed"] is True

    # Approve strategy
    approve_res = client.post("/api/execution/approve", json={
        "strategy_id": rec_id,
        "approved_by": "Senior PayOps Engineer",
        "notes": "Simulated recovery verified with zero duplicate risk.",
    })
    assert approve_res.status_code == 200

    # Execute test-mode action
    exec_res = client.post("/api/execution/execute", json={
        "strategy_id": rec_id,
        "execution_mode": "test_mode",
    })
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert exec_data["status"] == "executed"

    # Verify audit trail
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    audits = audit_res.json()
    assert len(audits) >= 4


def test_api_direct_simulate_endpoint():
    """Verify Phase 4 direct simulate endpoint."""
    res = client.post("/api/simulations/simulate", json={
        "scenario_id": "upi_degradation",
        "strategy": "alternate_route",
        "seed": 42,
        "sample_size": 500,
        "merchant_expected_gmv": 20000000.0,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_id"] == "upi_degradation"
    assert data["strategy_code"] == "alternate_route"
    assert data["baseline"]["revenue_at_risk_inr"] > 0
    assert data["strategy_result"]["recovered_gmv_inr"] > 0
    assert data["comparison"]["incremental_recovery_inr"] > 0
    assert data["strategy_result"]["data_classification"] == "SIMULATED RESULT"
