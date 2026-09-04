# PROJECT_SPEC.md — PayFire: AI Payment Chaos Lab

**Tagline:** *"Break payments before they break your revenue."*  
**Core Promise:** *"Don't test recovery strategies on customers. Test them before deployment."*

---

## 1. Executive Summary & Problem Statement

In mission-critical fintech and e-commerce infrastructure, payment failures cause immediate revenue loss, degraded customer trust, and merchant churn. When outages strike (e.g., an NPCI UPI degradation, specific acquiring bank timeouts, webhook delivery pipeline stalls, or a 5x flash sale spike), engineering teams frequently deploy ad-hoc recovery interventions directly to production.

These live interventions risk:
1. **Double debits & duplicate capture events** due to uncoordinated automated retries.
2. **Cascading downstream failures** by overwhelming already struggling bank gateways.
3. **Escalated gateway fees** from futile retries on hard-declined error codes.
4. **Poor customer experience** when retrying transactions that should have been routed to an alternative rail or payment link.

**PayFire** is a pre-deployment simulation, chaos injection, and AI evaluation platform for payment recovery strategies. It allows payment operations and engineering teams to inject realistic synthetic chaos into high-volume payment pipelines, diagnose root causes with AI, generate multi-vector recovery strategies, execute high-fidelity discrete-event simulations, apply deterministic safety guardrails, and compare counterfactual financial outcomes before any recovery code touches production.

---

## 2. Core Personas & Use Cases

1. **Payment Operations (PayOps) Lead**: Needs visibility into revenue at risk during payment outages and wants counterfactual proof that an automated reroute or retry strategy outperforms doing nothing.
2. **Fintech / Platform Engineer**: Needs a chaos sandbox to stress-test retry backoffs, circuit breakers, and webhooks against sudden gateway failures without risking real customer funds.
3. **Risk & Compliance Officer**: Enforces deterministic safety guardrails (max 3 retries, high-value transaction human approvals, duplicate detection, and cooldown policies) so autonomous AI recovery agents never perform uncontrolled financial mutations.

---

## 3. High-Fidelity Synthetic Simulation Specifications

The simulation engine uses discrete-event simulation principles (via SimPy, NumPy, and Pandas) to model realistic payment flows with 100% reproducible seeds:

### 3.1 Entities Modeled
- **Merchants**: Configuration, volume targets (e.g., FlashCart, 100,000 txns, ₹2 Crore GMV).
- **Payment Methods**:
  - UPI (60% baseline share, ~98% success rate, 800ms avg latency)
  - Cards (Credit/Debit, 25% baseline share, ~95% success rate, 1800ms avg latency)
  - Net Banking (10% baseline share, ~92% success rate, 3200ms avg latency)
  - Wallets (5% baseline share, ~97% success rate, 900ms avg latency)
- **Acquiring Banks / Gateways**:
  - HDFC Bank, ICICI Bank, SBI, Axis Bank, Razorpay Route nodes.
- **Transactions & Orders**:
  - Order ID, Payment ID, Timestamp, Amount (Power-law/lognormal distribution: ₹100 - ₹50,000), Customer Segment (New, Returning, VIP).
- **Failure Taxonomy**:
  - Soft failures (eligible for retry: timeouts, rate limits, temporary bank downtime).
  - Hard failures (ineligible for retry: insufficient funds, stolen card, invalid VPA).
  - Webhook delivery delays & dropped callbacks.

### 3.1 Counterfactual Simulation Framework
For any injected scenario, the engine runs simultaneous counterfactual arms:
- **Arm 0 (Baseline / No Action)**: The unmitigated incident trajectory.
- **Arm 1 (Immediate Retry)**: Blind retry on failure.
- **Arm 2 (Exponential Backoff + Jitter Retry)**: Delayed retry with cooldowns.
- **Arm 3 (Dynamic Gateway Rerouting)**: Switching acquiring bank / payment rail.
- **Arm 4 (Smart Payment Link + Escalation)**: Asynchronous payment link delivery via SMS/WhatsApp with human escalation for VIP/high-value orders (>₹10,000).

---

## 4. Chaos Scenarios Engine

The chaos engine applies parametric perturbations to the synthetic payment stream:
1. **UPI Degradation** (Bank A drops success rate by 40%, latency spikes to 4.5s).
2. **Bank Gateway Outage** (Complete failure on specific acquiring bank route).
3. **Payment Webhook Delay** (Callbacks delayed by 3–5 minutes, causing order status desynchronization).
4. **Flash Sale Spike** (5x volume surge, gateway queuing latency increases 3x).
5. **Card Authorization Decline Spike** (3D Secure / OTP timeouts jump to 35%).
6. **Route Instability / Flapping** (Intermittent 502/504 gateway responses).

---

## 5. AI Reasoning & Structured Decision Pipeline

PayFire uses AI exclusively for operational hypothesis generation, root-cause deduction, strategy formulation, and merchant-friendly executive briefings. Deterministic math and safety checks are decoupled from the LLM:

```
[Injected Metrics & Logs]
           ↓
[Anomaly Detection & RCA Module] (Structured JSON output with confidence & evidence)
           ↓
[Strategy Formulation Engine] (Generates parameterized recovery candidates)
           ↓
[SimPy Discrete-Event Simulation] (Calculates recovered GMV, success rate, latency, retries)
           ↓
[Deterministic Safety Gate] (Evaluates 8 non-negotiable safety guardrails)
           ↓
[Counterfactual Comparison & Recommender] (Ranks safest high-performing strategy)
           ↓
[Human Approval Gate (if required)] & [Audit Trail Logging]
```

### 5.1 Deterministic Safety Guardrails
- **G1 (Max Retry Rule)**: Strict maximum of 3 retry attempts per transaction.
- **G2 (High-Value Human Approval)**: Any transaction or automated reroute involving amounts > ₹10,000 requires human operator approval.
- **G3 (Low-Confidence Escalation)**: If AI RCA confidence < 75%, autonomous recovery is blocked; human review is required.
- **G4 (Idempotency & Duplicate Protection)**: Strict idempotency key checking blocks duplicate debits.
- **G5 (Cooldown Enforcement)**: Minimum 60-second cooldown between automated retry attempts.
- **G6 (Repeated Failure Circuit Breaker)**: Rerouting halts if secondary route failure rate exceeds 25%.
- **G7 (Immutable Audit Event)**: Every simulation run, recommendation, and approval must log a tamper-proof audit record.
- **G8 (Simulation Sandbox Isolation)**: Test/Simulated executions are strictly walled off from real production payment mutating calls.

---

## 6. Primary Demo Walkthrough Flow (Flash Sale Payment Chaos)

1. **Pre-Chaos Baseline**: Merchant "FlashCart" running healthy flash sale (100,000 expected txns, ₹2 Crore GMV, 98% success rate).
2. **Chaos Injection**: User triggers "UPI Degradation on Bank A" (15% overall success drop, ₹24.5 Lakhs revenue at risk).
3. **AI Incident Analysis**: Anomaly detected in real-time. RCA pinpointed with 87% confidence: *"UPI degradation concentrated in Bank A acquiring route due to NPCI timeout."*
4. **Strategy Simulation**: AI formulates 4 strategies. User clicks "Simulate All Counterfactuals".
5. **Side-by-Side Financial Comparison**:
   - Baseline: ₹0 recovered, ₹24.5L lost, 0 duplicates.
   - Strategy A (Immediate Retry): ₹8.2L recovered, 32 duplicate-risk alerts (SAFETY VIOLATION).
   - Strategy B (Smart Reroute to Bank B): ₹21.8L recovered, 0 duplicates, +320ms latency.
   - Strategy C (Payment Link for High Value): ₹18.4L recovered, 100% safety compliance.
6. **Safety Gate & Recommendation**: Strategy B recommended with clear reasoning. High-value transactions routed to approval queue.
7. **Execution & Audit Log**: Operator approves test-mode execution; verifiable audit timeline updates live.
