# API.md — PayFire API Specification

The PayFire Backend provides high-performance REST APIs built with FastAPI, Pydantic v2, and SQLAlchemy.

---

## Base URL
```
http://localhost:8000/api
```

---

## 1. System Health & Metadata

### `GET /api/health`
Returns system status, active database backend, Razorpay execution mode, and active safety rules.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "app_name": "PayFire",
  "version": "1.0.0",
  "environment": "development",
  "database": "sqlite_local",
  "razorpay_mode": "SYNTHETIC_SIMULATOR",
  "safety_guardrails_active": 8,
  "max_retry_limit": 3,
  "high_value_threshold_inr": 10000.0
}
```

---

## 2. Chaos Scenarios

### `GET /api/scenarios`
Returns the catalog of available preset chaos scenarios.

**Response `200 OK`**:
```json
[
  {
    "id": "flash_sale_upi_degrade",
    "name": "Flash Sale UPI Degradation",
    "description": "High-concurrency UPI route degradation concentrated in Bank A acquiring channel...",
    "affected_payment_method": "UPI",
    "affected_bank": "Bank A",
    "failure_percentage": 0.22,
    "latency_increase_ms": 3800.0,
    "traffic_multiplier": 5.0,
    "duration_minutes": 20,
    "webhook_delay_seconds": 45
  }
]
```

### `POST /api/scenarios/inject`
Injects controlled payment chaos into the synthetic checkout stream.

**Request Body**:
```json
{
  "scenario_id": "flash_sale_upi_degrade",
  "severity": 0.25,
  "traffic_multiplier": 3.0
}
```

**Response `200 OK`**:
```json
{
  "status": "degraded",
  "incident_id": "inc_20260904054216",
  "scenario_id": "flash_sale_upi_degrade",
  "scenario_name": "Flash Sale UPI Degradation",
  "message": "Chaos injected successfully. System transitioned to degraded state.",
  "baseline_success_rate": 0.985,
  "current_success_rate": 0.785,
  "current_failure_rate": 0.215,
  "revenue_at_risk_inr": 2450000.0,
  "avg_latency_ms": 2840.5,
  "transactions_affected": 248
}
```

### `POST /api/scenarios/reset`
Restores the payment environment back to 100% nominal healthy state (98.5% success rate).

---

## 3. Telemetry & Incidents

### `GET /api/incidents/current`
Returns active incident metrics or nominal baseline stats.

**Response `200 OK`**:
```json
{
  "is_active_incident": true,
  "incident_id": "inc_20260904054216",
  "status": "active",
  "scenario_id": "flash_sale_upi_degrade",
  "scenario_name": "Flash Sale UPI Degradation",
  "expected_transactions": 100000,
  "expected_gmv": 20000000.0,
  "success_rate": 0.785,
  "failure_rate": 0.215,
  "avg_latency_ms": 2840.5,
  "revenue_at_risk_inr": 2450000.0,
  "transactions_affected": 248,
  "failed_gmv_inr": 18230.5,
  "ai_analyzed": false
}
```

---

## 4. AI Root Cause Analysis & Strategy Formulation

### `POST /api/incidents/{incident_id}/analyze`
Runs structured AI Root Cause Analysis on telemetry, returning validated Pydantic output.

**Response `200 OK`**:
```json
{
  "incident_id": "inc_20260904054216",
  "root_cause": "High-concurrency payment degradation concentrated in Bank A acquiring route...",
  "confidence": 0.87,
  "evidence": [
    "Observed 215 failed transactions out of 1000 analyzed samples (21.5% error rate).",
    "Failure concentration: 88.4% of all drops occurred in Bank A routing pipeline.",
    "Average channel latency spiked to 2840ms (baseline nominal is 850ms)."
  ],
  "affected_components": [
    "Bank A Acquiring Gateway Switch",
    "UPI Processing Rail",
    "Merchant Ingress Checkout Pipeline"
  ],
  "uncertainties": [
    "Upstream NPCI / Bank switch internal queue backlog depth cannot be directly queried."
  ],
  "revenue_at_risk_inr": 2450000.0,
  "affected_volume": 248,
  "recommended_action_summary": "Immediately divert new UPI volume away from Bank A...",
  "is_autonomous_allowed": true
}
```

### `POST /api/incidents/{incident_id}/strategies`
Generates 4 candidate recovery strategies with structured parameters.

---

## 5. SimPy Discrete-Event Simulation

### `POST /api/simulations/run`
Runs reproducible counterfactual simulation across 5 arms (Baseline, Immediate Retry, Exponential Backoff, Dynamic Route Rerouting, Smart Payment Link).

**Request Body**:
```json
{
  "incident_id": "inc_20260904054216",
  "seed": 42,
  "sample_size": 1000
}
```

**Response `200 OK`**:
```json
{
  "incident_id": "inc_20260904054216",
  "simulation_id": "sim_84f93a102c",
  "baseline_unmitigated_loss_inr": 2450000.0,
  "results": [
    {
      "strategy_id": "strat_inc_imm",
      "strategy_name": "Immediate Auto-Retry",
      "arm_type": "immediate_retry",
      "simulated_transactions": 1000,
      "recovered_transactions": 72,
      "failed_transactions": 143,
      "recovered_gmv_inr": 820000.0,
      "net_recovery_rate": 0.335,
      "avg_latency_ms": 3200.0,
      "p95_latency_ms": 5200.0,
      "retry_count": 215,
      "duplicate_risk_count": 48,
      "customer_churn_risk": 0.28,
      "safety_compliance": false,
      "is_recommended": false
    },
    {
      "strategy_id": "strat_inc_reroute",
      "strategy_name": "Smart Dynamic Route Rerouting",
      "arm_type": "dynamic_reroute",
      "simulated_transactions": 1000,
      "recovered_transactions": 192,
      "failed_transactions": 23,
      "recovered_gmv_inr": 2180000.0,
      "net_recovery_rate": 0.893,
      "avg_latency_ms": 1420.0,
      "p95_latency_ms": 2100.0,
      "retry_count": 215,
      "duplicate_risk_count": 0,
      "customer_churn_risk": 0.08,
      "safety_compliance": true,
      "is_recommended": true,
      "recommendation_reason": "Achieves highest recovery (₹21,80,000 / 89.3%) with 0 duplicate payment risks."
    }
  ],
  "recommended_strategy_id": "strat_inc_reroute",
  "ai_executive_summary": "SimPy discrete-event simulation completed..."
}
```

---

## 6. Safety Policy Gate & Execution

### `POST /api/safety/validate/{strategy_id}`
Evaluates all 8 deterministic payment safety guardrails.

### `POST /api/execution/approve`
Human-in-the-loop sign-off for strategies requiring supervisor authorization.

### `POST /api/execution/execute`
Executes approved recovery action in Test Mode (Razorpay Test Mode / Synthetic sandbox).

---

## 7. Audit Trail

### `GET /api/audit`
Returns immutable chronological audit records for all chaos injections, RCA diagnoses, simulations, approvals, and test executions.
