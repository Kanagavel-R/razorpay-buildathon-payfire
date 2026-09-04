# PayFire — Payment Chaos Engine

> *"Break payments before they break your revenue."*

## 1. Overview & Architecture

The **PayFire Chaos Engine** is an isolated, deterministic payment-failure injection system designed to test payment recovery strategies before production deployment. Instead of experimenting with autonomous retries or dynamic routing rules on live customer checkouts, merchants intentionally inject controlled anomalies into a synthetic payment environment and analyze the financial and operational blast radius in real time.

```
+-------------------------------------------------------------------------------+
|                             PayFire Chaos Engine                              |
+-------------------------------------------------------------------------------+
                                     |
                                     v
                  +-----------------------------------+
                  |  Safety Validator (Enforce Non-   |
                  |  Production / Sandbox isolation)  |
                  +-----------------------------------+
                                     |
                                     v
           +-----------------------------------------------------+
           |         Deterministic Baseline Generator            |
           |       (Configurable Random Seed, Normal Ops)        |
           +-----------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|                        Fault Perturbation Pipelines                           |
|  1. UPI Degradation       2. Bank Outage           3. Payment Timeout         |
|  4. Webhook Delay         5. Traffic Spike         6. Card Decline Spike      |
|  7. Custom Chaos (Configurable Target, Method, Bank, Failure %, Latency)      |
+-------------------------------------------------------------------------------+
                                     |
                                     v
                  +-----------------------------------+
                  |   Before / After Delta Engine     |
                  |   (Success %, Latency, Net GMV)   |
                  +-----------------------------------+
                                     |
                                     v
                  +-----------------------------------+
                  |  Chronological Timeline Generator |
                  |  (NORMAL -> INJECTED -> DETECTED) |
                  +-----------------------------------+
                                     |
                                     v
                  +-----------------------------------+
                  |  Database State & Active Incident |
                  |  (SQLite, Audit Trail, REST API)  |
                  +-----------------------------------+
```

---

## 2. Supported Chaos Scenarios

PayFire includes 7 first-class chaos scenarios that model real-world payment infrastructure failure modes:

| Scenario ID | Name | Target Route / Method | Failure Mode | Typical Impact |
|---|---|---|---|---|
| `upi_degradation` | UPI Degradation | `UPI` (All Banks) | Elevates UPI failure rate by up to 80% and adds 1500ms latency. | Simulates NPCI/PSP gateway throttling. |
| `bank_outage` | Bank Outage | `Bank A` (All Methods) | 100% hard outage on Bank A transactions with `BANK_DOWNTIME_OUTAGE`. | Simulates core banking system downtime. |
| `payment_timeout` | Payment Processing Timeout | All Methods (`CARD`, `UPI`, `NETBANKING`) | 40% timeout failure rate with +4000ms latency spike (`GATEWAY_TIMEOUT`). | Tests checkout timeout limits and abandonments. |
| `webhook_delay` | Webhook Delivery Delay | Webhook Delivery Queue | Adds 2500ms latency; 10% webhook drop (`WEBHOOK_DELIVERY_TIMEOUT`). | Tests order fulfillment desynchronization and double-charging. |
| `traffic_spike` | High-Volume Traffic Spike | All Routes | 3.5x transaction volume multiplier, 12% cascade failure, +800ms latency. | Stress-tests route concurrency and queue depth. |
| `card_decline_spike` | Card Issuer Decline Surge | `CARD` (All Issuers) | 50% card decline rate with `ISSUER_DECLINED_GENERIC` and +450ms latency. | Simulates card network outage or issuer fraud filter glitch. |
| `custom_*` | Custom Chaos Scenario | User Configurable | User-defined payment method, bank, failure rate (0-100%), and latency (ms). | Fully bespoke stress-testing. |

### Predefined Demo Scenario: Flash Sale UPI Degradation
PayFire includes a dedicated scenario modeling high-concurrency peak sales:
- **Scenario ID**: `flash_sale_upi_degrade`
- **Name**: `FLASH SALE — UPI DEGRADATION`
- **Traffic Multiplier**: `5.0x`
- **Baseline Scale**: 100,000 transactions, INR 20,000,000 (INR 2 Cr) GMV
- **Failure Surge**: 15% UPI drop on Bank A (`UPI_TECHNICAL_DECLINE`)
- **Latency Added**: +1,800 ms
- **Duration**: 10 minutes

---

## 3. Scenario Lifecycle

Each scenario progresses through a finite-state machine:

```
[ DRAFT ] ---> [ READY ] ---> [ RUNNING ] ---> [ COMPLETED ]
                                    |
                                    v
                                [ FAILED ]
```

1. **`DRAFT`**: Scenario created with unvalidated parameters.
2. **`READY`**: Validated parameters; seeded baseline transaction distribution prepared.
3. **`RUNNING`**: Perturbation actively applied to simulated stream; live telemetry being collected.
4. **`COMPLETED`**: Before/After delta finalized, revenue-at-risk computed, chronological timeline persisted.
5. **`FAILED`**: Aborted due to safety violation or parameter boundary assertion.

---

## 4. Before / After Impact Calculation

When a chaos scenario is injected, the engine deterministically computes the exact divergence between the undisturbed baseline stream and the degraded stream:

### Mathematical Formulas:
1. **Success Rate Delta (\(\Delta_{SR}\))**:
   $$\Delta_{SR} = \text{Success Rate}_{\text{chaos}} - \text{Success Rate}_{\text{baseline}}$$
2. **Latency Delta (\(\Delta_{Latency}\))**:
   $$\Delta_{Latency} = \overline{\text{Latency}}_{\text{chaos}} - \overline{\text{Latency}}_{\text{baseline}}$$
3. **Failed GMV Delta (\(\Delta_{\text{Failed GMV}}\))**:
   $$\Delta_{\text{Failed GMV}} = \text{Failed GMV}_{\text{chaos}} - \text{Failed GMV}_{\text{baseline}}$$
4. **Scaled Revenue at Risk (\(\text{Risk}_{\text{scaled}}\))**:
   $$\text{Risk}_{\text{scaled}} = \text{Total Expected GMV} \times (\text{Failure Rate}_{\text{chaos}} - \text{Failure Rate}_{\text{baseline}})$$

### Chronological Event Timeline
Every injection produces an auditable event timeline:
1. `NORMAL`: Baseline operations established at steady-state success rate.
2. `CHAOS_INJECTED`: Scenario parameters applied to traffic pipeline.
3. `DEGRADATION_DETECTED`: Telemetry registers a statistically significant drop in health metrics.
4. `IMPACT_CALCULATED`: Failed volume, latency divergence, and revenue at risk quantified.
5. `SIMULATION_COMPLETED`: Incident logged with audit checksum and ready for AI recovery evaluation.

---

## 5. Safety Restrictions & Environment Protection

The Chaos Engine enforces strict safety guardrails to ensure fault injection **never touches live payment infrastructure**:

- **Strict Sandbox Boundary**: Only requests with `environment in ["sandbox", "synthetic", "test", "demo"]` are permitted.
- **Immediate Rejection**: Any injection request specifying `live`, `prod`, or `production` is aborted immediately with **HTTP 403 Forbidden** and logs a critical security alert:
  ```json
  {
    "detail": "CRITICAL SAFETY VIOLATION: Chaos Engine is strictly prohibited from executing against 'production' environment. PayFire only operates on synthetic payment environments."
  }
  ```
- **Auditing**: Every creation, modification, and injection event is recorded in the immutable `audit_logs` database table.

---

## 6. REST API Endpoints

### 1. List Scenarios
```http
GET /api/chaos/scenarios
```
Returns list of all preset and user-created scenarios.

### 2. Get Scenario Details
```http
GET /api/chaos/scenarios/{scenario_id}
```

### 3. Create Custom Scenario
```http
POST /api/chaos/scenarios
Content-Type: application/json

{
  "name": "Custom ICICI Timeout Surge",
  "type": "custom",
  "description": "Simulate 35% timeout degradation on ICICI Card checkout",
  "affected_payment_method": "CARD",
  "affected_bank": "ICICI",
  "failure_percentage": 0.35,
  "latency_increase_ms": 3200,
  "traffic_multiplier": 1.5,
  "duration_minutes": 15
}
```

### 4. Inject Chaos Scenario
```http
POST /api/chaos/scenarios/{scenario_id}/inject
Content-Type: application/json

{
  "scenario_id": "flash_sale_upi_degrade",
  "severity": 0.15,
  "traffic_multiplier": 5.0,
  "environment": "sandbox"
}
```

### 5. Get Impact Analysis
```http
GET /api/chaos/scenarios/{scenario_id}/impact
```
Returns the latest Before/After impact metrics, deltas, and timeline for the scenario.

---

## 7. Interaction with the Simulation Engine

The Chaos Engine directly builds upon Phase 4's deterministic simulation infrastructure:
- **Seed Synchronization**: The generator and chaos perturbation pipelines share deterministic seeds to allow apples-to-apples comparisons.
- **Route-Aware Partitioning**: When a bank or payment method is impaired, the engine routes synthetic transactions through degraded paths without corrupting other payment corridors.
- **Dynamic Scenario Handoff**: The incident generated by `POST /api/chaos/scenarios/{id}/inject` immediately updates the system state (`/api/incidents/active`), providing the ground truth needed for Phase 6 (AI Diagnosis) and Phase 7 (Autonomous Recovery Simulation).
