import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

sys.stdout.reconfigure(encoding='utf-8')

def log(step, msg):
    print(f"[{step}] {msg}")

def run_e2e_audit():
    print("==================================================================")
    print("PAYFIRE CRITICAL FLOW E2E INTEGRATION & AUDIT TEST")
    print("==================================================================")

    # 1. Reset Baseline
    res = requests.post(f"{BASE_URL}/scenarios/reset")
    assert res.status_code == 200, f"Reset failed: {res.text}"
    log("STEP 1: RESET", res.json().get("message", "Baseline reset"))

    # 2. Check Baseline Current Incident
    res = requests.get(f"{BASE_URL}/incidents/current")
    assert res.status_code == 200
    baseline_data = res.json()
    log("STEP 2: BASELINE STATE", f"is_active_incident={baseline_data['is_active_incident']}, success_rate={baseline_data['success_rate']}")

    # 3. Get Scenarios
    res = requests.get(f"{BASE_URL}/chaos/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) > 0
    target_scenario = next((s for s in scenarios if s['id'] == 'flash_sale_upi_degrade'), scenarios[0])
    log("STEP 3: SCENARIOS", f"Found {len(scenarios)} scenarios. Selected '{target_scenario['id']}' ({target_scenario['name']})")

    # 4. Inject Chaos
    inject_payload = {
        "scenario_id": target_scenario['id'],
        "severity": 0.25,
        "traffic_multiplier": 3.0,
        "environment": "sandbox"
    }
    res = requests.post(f"{BASE_URL}/chaos/scenarios/{target_scenario['id']}/inject", json=inject_payload)
    assert res.status_code == 200, f"Inject failed: {res.text}"
    inject_data = res.json()
    log("STEP 4: CHAOS INJECTED", f"Status: {inject_data.get('status')}, Delta failure: {inject_data.get('before_after', {}).get('deltas', {}).get('failure_rate_delta')}")

    # 5. Verify Active Degraded Incident
    res = requests.get(f"{BASE_URL}/incidents/current")
    assert res.status_code == 200
    inc_data = res.json()
    assert inc_data['is_active_incident'] is True
    incident_id = inc_data['incident_id']
    log("STEP 5: DEGRADED INCIDENT", f"Incident ID: {incident_id}, Rev at Risk: INR {inc_data['revenue_at_risk_inr']:,.2f}, Affected Txns: {inc_data['transactions_affected']}")

    # 6. Run AI Root Cause Analysis
    res = requests.post(f"{BASE_URL}/incidents/{incident_id}/analyze")
    assert res.status_code == 200
    rca_data = res.json()
    log("STEP 6: AI RCA DIAGNOSIS", f"Confidence: {rca_data['confidence']*100:.0f}%, Root Cause: {rca_data['root_cause'][:90]}...")
    log("STEP 6: EMPIRICAL EVIDENCE", f"Evidence Items: {len(rca_data['evidence'])}, Affected: {rca_data['affected_components']}")

    # 7. Generate Recovery Strategies
    res = requests.post(f"{BASE_URL}/incidents/{incident_id}/strategies")
    assert res.status_code == 200
    strat_data = res.json()
    strategies = strat_data.get("strategies", [])
    log("STEP 7: STRATEGIES", f"Generated {len(strategies)} candidates: {[s['name'] for s in strategies]}")

    # 8. Run SimPy Counterfactual Simulation Matrix
    sim_payload = {
        "incident_id": incident_id,
        "seed": 42,
        "sample_size": 1000
    }
    res = requests.post(f"{BASE_URL}/simulations/run", json=sim_payload)
    assert res.status_code == 200
    sim_data = res.json()
    recommended_id = sim_data['recommended_strategy_id']
    log("STEP 8: SIMPY SIMULATION", f"Simulation ID: {sim_data['simulation_id']}, Recommended Strategy ID: {recommended_id}")
    for r in sim_data['results']:
        log("STEP 8: SIM RESULT", f"Arm: {r['arm_type']} | Name: {r['strategy_name']} | Rec GMV: INR {r['recovered_gmv_inr']:,.2f} | Dup Risk: {r['duplicate_risk_count']} | Safety Pass: {r['safety_compliance']}")

    # 9. Safety Gate & Policy Verification
    res = requests.post(f"{BASE_URL}/safety/validate/{recommended_id}")
    assert res.status_code == 200
    safety_data = res.json()
    log("STEP 9: SAFETY GATE", f"All Rules Passed: {safety_data['all_rules_passed']}, Requires Human Sign-off: {safety_data['requires_human_approval']}")
    for rule in safety_data['rule_evaluations']:
        log("STEP 9: RULE CHECK", f"[{rule['rule_id']}] {rule['rule_name']}: {'PASS' if rule['passed'] else 'FAIL'} - {rule['details']}")

    # 10. Human In The Loop Operator Sign-off
    approve_payload = {
        "strategy_id": recommended_id,
        "approved_by": "Senior PayOps Engineering Director",
        "notes": "Verified counterfactual simulation: 0 duplicate risk, positive GMV recovery confirmed."
    }
    res = requests.post(f"{BASE_URL}/execution/approve", json=approve_payload)
    assert res.status_code == 200
    log("STEP 10: HUMAN APPROVAL", f"Approved: {res.json().get('status')}")

    # 11. Execute Recovery in Test Mode
    exec_payload = {
        "strategy_id": recommended_id,
        "execution_mode": "test_mode"
    }
    res = requests.post(f"{BASE_URL}/execution/execute", json=exec_payload)
    assert res.status_code == 200
    exec_data = res.json()
    log("STEP 11: CANARY EXECUTION", f"Execution Status: {exec_data.get('status')}, Mode: {exec_data.get('execution_mode')}")

    # 12. Check Audit Trail
    res = requests.get(f"{BASE_URL}/audit")
    assert res.status_code == 200
    audit_events = res.json()
    log("STEP 12: AUDIT TRAIL", f"Total Events Recorded: {len(audit_events)}")
    for ev in audit_events[:4]:
        log("STEP 12: AUDIT EVENT", f"[{ev['action']}] actor={ev['actor']}, decision={ev['decision']}, notes={ev.get('notes')}")

    print("==================================================================")
    print("SUCCESS: ALL 12 CRITICAL FLOW PHASES PASSED END-TO-END WITH ZERO ERRORS!")
    print("==================================================================")

if __name__ == "__main__":
    run_e2e_audit()
