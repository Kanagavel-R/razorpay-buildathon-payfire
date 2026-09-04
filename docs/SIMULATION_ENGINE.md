# SIMULATION_ENGINE.md — PayFire Synthetic Payment Simulation Engine

**Tagline:** *"Break payments before they break your revenue."*  
**Architecture Layer:** Core Discrete-Event Simulation & Counterfactual Decision Engine

---

## 1. Overview & Positioning

The PayFire Simulation Engine is a deterministic, discrete-event payment simulation framework built in Python using **SimPy**, **NumPy**, and **Pandas**.

Instead of testing autonomous payment recovery agents directly on live customers (risking customer abandonment and double debits), PayFire executes pre-deployment simulation experiments on synthetic digital twins of high-volume merchant payment infrastructure.

### Data Classification Standard
To ensure absolute transparency and compliance, PayFire enforces strict labeling across all outputs:

| Label | Definition | Context in PayFire |
|---|---|---|
| `SIMULATED DATA` | Synthetically generated payment traffic, amounts, methods, and error codes. | Batches produced by `PaymentStreamGenerator`. |
| `SIMULATED RESULT` | Metrics computed by running discrete-event simulation models (e.g. SimPy). | Recovered GMV, latency curves, duplicate-risk events. |
| `REAL RAZORPAY TEST-MODE DATA` | Real HTTP transactions executed against Razorpay's authentic sandbox environment. | Orders and payment links generated via `RazorpayClientWrapper`. |

---

## 2. Architecture & Data Model

```
               [PaymentStreamGenerator] (Seeded, Poisson arrival, Lognormal amounts)
                                 │
                                 ▼
                     [SyntheticTransaction Stream]
                                 │
                                 ▼
                [ChaosEngine] (Parametric fault injection)
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            [simulate_baseline()]   [simulate(strategy, scenario)]
                     │                       │
                     ▼                       ▼
          [BaselineSimulationResult] [StrategySimulationResult]
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                 [compare_baseline_vs_strategy()]
                                 │
                                 ▼
                     [Counterfactual Comparison]
```

### 2.1 Entity Model (`SyntheticTransaction`)
Each synthetic transaction models the following attributes:
- `id` (str): Unique transaction identifier (`pay_{seed}_{index}`).
- `order_id` (str): Merchant order reference (`order_{seed}_{index}`).
- `customer_id` (str): Customer identifier (`cust_{random_id}`).
- `customer_segment` (str): Segment tier (`New`, `Returning`, `VIP`). VIP transactions have a 2.2x amount multiplier and higher checkout affinity.
- `amount_inr` (float): Transaction amount in INR, drawn from a lognormal distribution clipped between ₹50.00 and ₹50,000.00.
- `payment_method` (str): Payment rail (`UPI`, `Cards`, `NetBanking`, `Wallets`).
- `bank` (str): Acquiring bank route (`Bank A`, `Bank B`, `Bank C`, `Bank D`).
- `is_high_value` (bool): `True` if `amount_inr >= ₹10,000.00`, triggering human approval gates.
- `status` (str): `captured` or `failed`.
- `latency_ms` (float): Round-trip gateway latency in milliseconds.
- `failure_code` (str): Machine-readable failure taxonomy code (e.g. `GATEWAY_TIMEOUT`, `UPSTREAM_GATEWAY_DEGRADED`).
- `failure_reason` (str): Diagnostic error description.
- `is_soft_failure` (bool): `True` for transient/retriable errors (timeouts, network flakes); `False` for terminal errors (insufficient funds, stolen card).
- `retry_count` (int): Number of retries attempted on this transaction.
- `timestamp` (float): Unix epoch timestamp with Poisson inter-arrival intervals.
- `created_at_iso` (str): ISO 8601 string representation.

---

## 3. Mathematical Formulas & Assumptions

### 3.1 Deterministic Revenue at Risk
PayFire **never** uses LLMs to calculate financial arithmetic. Revenue at Risk is calculated deterministically by evaluating the proportion of failed GMV within the empirical sample and projecting it onto the merchant's scale benchmark:

$$\text{Revenue at Risk} = \text{Merchant Expected GMV} \times \left( \frac{\sum_{t \in \text{Failed}} \text{Amount}_t}{\sum_{t \in \text{All}} \text{Amount}_t} \right)$$

*Assumptions:*
- The merchant benchmark represents expected volume (default: FlashCart at ₹2,00,00,000 / ₹2 Crore GMV).
- The transaction value distribution in the sample is representative of the merchant's customer cohort.

### 3.2 Net Incremental Recovery
$$\text{Incremental Recovery} = \text{Strategy Recovered GMV} - \text{Baseline Recovered GMV}$$
*(Since Baseline Recovered GMV is identically ₹0, Incremental Recovery equals Strategy Recovered GMV).*

### 3.3 Duplicate Payment Risk (Race Condition Modeling)
When a transaction fails due to a soft timeout on a slow acquiring gateway (>3000ms), immediate retry mechanisms frequently fire a secondary authorization request while the first request is still being processed by the core banking switch.
$$\text{Duplicate Risk Event} = \mathbb{I}(\text{strategy} = \text{immediate\_retry} \land \text{initial\_latency} > 3000\,\text{ms})$$
PayFire strictly flags these events and blocks the strategy under **Safety Guardrail Rule G4**.

---

## 4. Supported Chaos Scenarios

| Scenario ID | Name | Target Rail & Bank | Default Severity | Injected Latency | Traffic Multiplier |
|---|---|---|---|---|---|
| `upi_degradation` | UPI Route Degradation | UPI / Bank A | 20% | +3,800 ms | 1.5x |
| `bank_outage` | Bank Outage | All / Bank B | 92% | +5,000 ms | 1.2x |
| `payment_timeout` | Gateway Timeout | All / Bank A | 30% | +4,500 ms | 2.0x |
| `webhook_delay` | Webhook Stall | All / Gateway Direct | 15% | +1,200 ms | 1.5x (240s delay) |
| `traffic_spike` | Flash Sale Spike | All / Gateway Direct | 18% | +2,500 ms | 5.0x |

All scenarios support dynamic runtime parameter overrides (`failure_rate`, `traffic_multiplier`).

---

## 5. Supported Recovery Strategies

| Strategy Code | Display Name | Action Type | Expected Recovery | Latency Impact | Duplicate Risk | Safety Policy Compliance |
|---|---|---|---|---|---|---|
| `no_action` | Baseline (Do Nothing) | NONE | 0.0% | +0 ms | 0 | PASS (Reference) |
| `immediate_retry` | Immediate Auto-Retry | RETRY_IMMEDIATE | ~35.0% | +800 ms | **HIGH (Violations)** | **FAIL (Rule G4 Blocked)** |
| `delayed_retry` | Delayed Retry | RETRY_BACKOFF | ~62.0% | +12,000 ms | 0 | PASS |
| `alternate_route` | Alternate Route | DYNAMIC_REROUTE | **~89.3%** | +1,400 ms | 0 | **PASS (Recommended)** |
| `payment_link` | Smart Payment Link | PAYMENT_LINK | ~74.0% | +350 ms | 0 | PASS (VIP Protected) |

---

## 6. Programmatic Python API

```python
from app.core.generator import PaymentStreamGenerator
from app.core.chaos_engine import ChaosEngine
from app.core.simulation_engine import DiscretePaymentSimulator

# 1. Generate reproducible synthetic payment stream
generator = PaymentStreamGenerator(seed=42)
txns = generator.generate_batch(count=1000)

# 2. Inject chaos scenario
chaos = ChaosEngine(seed=42)
scenario = chaos.get_scenario("upi_degradation")
degraded_txns, metrics = chaos.apply_chaos(txns, scenario, severity_override=0.20)

# 3. Simulate Baseline
simulator = DiscretePaymentSimulator(seed=42, merchant_expected_gmv=20000000.0)
baseline = simulator.simulate_baseline(degraded_txns, scenario.name, scenario.id)
print(f"Revenue at Risk: INR {baseline.revenue_at_risk_inr:,.2f}")

# 4. Simulate Recovery Strategy
strategy_result = simulator.simulate("alternate_route", degraded_txns, scenario)
print(f"Recovered GMV: INR {strategy_result.recovered_gmv_inr:,.2f}")

# 5. Compare Baseline vs Strategy
comparison = simulator.compare_baseline_vs_strategy(baseline, strategy_result)
print(f"Net Recovery Rate: {comparison.recovery_rate * 100:.1f}%")
print(f"Duplicate Risk Count: {comparison.duplicate_risk_count}")
```

---

## 7. Limitations & Future Work

1. **Synthetic Card Issuer Behaviors**: Card authorization declines are modeled probabilistically rather than querying physical card scheme clearing networks.
2. **Deterministic Random Seeds**: While `seed=42` ensures 100% reproducibility across evaluations, production deployments can execute stochastic multi-seed Monte Carlo distributions (e.g. 100 runs across seeds 1..100) to obtain confidence intervals.
3. **Sandbox Guard**: Simulated runs never mutate real customer bank accounts. Test Mode actions execute exclusively against synthetic sandboxes or Razorpay Test Mode keys.
