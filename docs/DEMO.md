# DEMO.md — PayFire Primary Demo Walkthrough

**"Break payments before they break your revenue."**

This guide provides a rapid 3-minute evaluation walkthrough for hackathon judges and payment operations leads.

---

## Prerequisites & Launch

### 1. Start the FastAPI Backend
```bash
# In PayFire root directory
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend Swagger Documentation: `http://localhost:8000/docs`  
Health Check: `http://localhost:8000/api/health`

### 2. Start the Next.js Frontend
```bash
# In PayFire/frontend directory
npm run dev
```
Open Dashboard: `http://localhost:3000`

---

## 3-Minute Interactive Demo Walkthrough

### Step 1: Inspect Healthy Nominal Baseline
- **What you see**:
  - Merchant: `FlashCart (₹2.0 Cr GMV, 100,000 Expected Transactions)`.
  - Payment Success Rate: `98.5%` (All green).
  - Average Latency: `820 ms`.
  - Revenue at Risk: `₹0`.
  - Health Timeline: Steady green area chart at nominal 98.5%.

### Step 2: Inject Chaos ("Flash Sale UPI Degradation")
- In the **Chaos Scenario Injector** panel:
  - Keep default scenario: `Flash Sale UPI Degradation`.
  - Notice parameters: Injected failure rate 20%, traffic multiplier 3.0x, targeting Bank A acquiring channel.
  - Click the glowing red button: **"🔥 INJECT PAYMENT CHAOS"**.
- **Immediate System Changes**:
  - Payment Success Rate plunges to `~78.5%` (Highlighted in red/danger).
  - Revenue at Risk recalculates to `~₹24,50,000` (₹24.5 Lakhs).
  - Average Latency spikes to `> 2,800 ms`.
  - Health Timeline drops with an active incident banner.

### Step 3: Trigger AI Root Cause Analysis
- Scroll to the **AI Incident Diagnostics** card:
  - Click **"RUN AI ROOT CAUSE ANALYSIS"**.
  - In seconds, the structured Pydantic diagnostic appears:
    - **Confidence**: `87%`.
    - **Root Cause**: Pinpoints Bank A acquiring channel latency exceeding 5,000ms SLA due to upstream NPCI switch queuing.
    - **Empirical Evidence**: Shows precise error rate (21.5%), 88% concentration in Bank A route, and timeout signature.
    - **Affected Components**: Highlights Bank A switch and UPI processing rail.

### Step 4: Simulate Counterfactual Recovery Strategies
- Click **"SIMULATE RECOVERY STRATEGIES"**.
- The SimPy discrete-event simulation runs 5 counterfactual arms across 1,000 transactions:
  - **Baseline (Do Nothing)**: ₹0 recovered, ₹24.5L loss, 38% customer churn.
  - **Immediate Auto-Retry**: Recovers ₹8.2L, but generates **48 Duplicate Debit Violations** (BLOCKED by Rule G4).
  - **Exponential Backoff**: Recovers ₹14.8L with 12s latency impact.
  - **Smart Dynamic Route Rerouting**: Recovers **₹21.8L (89.3%)** with **0 duplicate debit risks** and +320ms latency.
  - **Payment Link & VIP Escalation**: Recovers ₹18.2L with zero bank gateway stress.
- **Outcome**: The platform awards the green **"RECOMMENDED"** badge to *Smart Dynamic Route Rerouting*.

### Step 5: Safety Gate & Human Approval
- On the recommended strategy row, click **"Inspect Safety"**.
- The **Safety Gate & Policy Verification** modal pops up showing all 8 deterministic guardrails:
  - Rule 1 (Max Retries <= 3): **PASS**
  - Rule 2 (High-Value Approval > ₹10,000): **FLAGGED (APPROVAL REQUIRED)**
  - Rule 3 (Confidence >= 75%): **PASS**
  - Rule 4 (Duplicate Debit Protection): **PASS**
  - Rule 5 (Cooldown Interval): **PASS**
  - Rule 6 (Circuit Breaker): **PASS**
  - Rule 7 (Mandatory Audit Trail): **PASS**
  - Rule 8 (Sandbox Isolation): **PASS**
- Click **"GRANT HUMAN OPERATOR APPROVAL"** to sign off as Senior PayOps Lead.
- Click **"EXECUTE TEST-MODE RECOVERY"** to dispatch the verified recovery route.

### Step 6: Verify the Live Audit Trail
- Inspect the **Immutable Audit Trail** at the bottom of the dashboard:
  - Every step is chronologically verified:
    1. `CHAOS_INJECTED` by Operator
    2. `ROOT_CAUSE_ANALYSIS_COMPLETED` by AI_RCA_AGENT
    3. `COUNTERFACTUAL_SIMULATION_COMPLETED` by SIMULATION_ENGINE
    4. `STRATEGY_HUMAN_APPROVED` by HUMAN_OPERATOR
    5. `TEST_MODE_ACTION_EXECUTED` by OPERATOR
- Click **"Reset"** in the top navbar anytime to return to 100% nominal state.
