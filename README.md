# PayFire — AI Payment Chaos Lab

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Pydantic%20v2-blue.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%7C%20Tailwind%20CSS-black.svg)](https://nextjs.org)
[![Simulation](https://img.shields.io/badge/Engine-SimPy%20Discrete--Event-orange.svg)](https://simpy.readthedocs.io)
[![Safety](https://img.shields.io/badge/Guardrails-8%20Deterministic%20Rules-emerald.svg)](#safety-engine--guardrails)
[![Pytest](https://img.shields.io/badge/Tests-27%20Passed-brightgreen.svg)](#testing)

> **"Break payments before they break your revenue."**  
> *Core Principle: Don't test recovery strategies on real customers. Simulate, diagnose, and safety-verify them before deployment.*

---

## 1. Problem Statement

In mission-critical fintech, e-commerce, and SaaS platforms, payment outages cause immediate revenue loss, customer abandonment, and brand damage. When failures occur—such as an acquiring bank gateway timeout, NPCI UPI route degradation, webhook ingestion stall, or a 5x flash sale traffic surge—engineering teams frequently deploy ad-hoc recovery interventions directly to production.

These unverified interventions risk:
1. **Double Debits & Duplicate Captures**: Blind automated retries charge customers multiple times during gateway timeouts.
2. **Cascading Route Collapses**: Aggressive retry bursts trigger thundering-herd spikes on already struggling banks.
3. **Escalated Gateway Costs**: Futile retries on hard-declined error codes waste interchange fees.
4. **Poor Customer Experience**: Forcing repeated 3D-Secure/OTP re-authentications inflates churn.

---

## 2. Solution Overview

**PayFire** is an autonomous pre-deployment simulation, chaos injection, and safety governance platform for payment infrastructure. 

PayFire allows fintech teams to:
- Inject controlled payment chaos into an isolated synthetic sandbox.
- Diagnose issues through a 6-agent AI root-cause analysis suite.
- Run counterfactual discrete-event simulations (SimPy) to project the exact financial recovery of competing strategies before executing them.
- Enforce deterministic safety guardrails (G1–G8) preventing duplicate debits, runaway retries, and unauthorized high-value mutations.
- Maintain an immutable, cryptographically verifiable audit ledger.

---

## 3. High-Level Architecture

```
                      +------------------------------------------+
                      |         Next.js 15 Frontend SaaS         |
                      |  (Sidebar, 7 Views, Stepper, Dark Mode)  |
                      +------------------------------------------+
                                            |
                                 REST / JSON APIs (/api)
                                            v
                      +------------------------------------------+
                      |         FastAPI Application Server       |
                      |      (Unified Router, Dependency DI)     |
                      +------------------------------------------+
                         /         |              |          \
                        /          |              |           \
                       v           v              v            v
             +------------+ +-------------+ +------------+ +------------+
             |   Chaos    | |  SimPy      | |  6-Agent   | | Safety &   |
             |   Engine   | | Discrete-   | |  RCA       | | Policy     |
             | Parametric | | Event Sim   | | Multi-Agent| | Engine     |
             | Injections | | 5 Arms      | | Structured | | (8 Rules)  |
             +------------+ +-------------+ +------------+ +------------+
                       \           |              |            /
                        \          |              |           /
                         v         v              v          v
                      +------------------------------------------+
                      |         Storage & Cryptographic Audit    |
                      |    SQLAlchemy (PostgreSQL / SQLite)      |
                      |      SHA-256 Event Chain & Records       |
                      +------------------------------------------+
                                            |
                                    Optional Webhooks
                                            v
                      +------------------------------------------+
                      |          Razorpay Test Mode APIs         |
                      |   (Transparent synthetic sandbox mode)   |
                      +------------------------------------------+
```

---

## 4. Key Capabilities

### A. Synthetic Telemetry Generator
- Generates realistic payment transactions with reproducible seeds (`seed=42`).
- Models payment methods (UPI 60%, Cards 25%, NetBanking 10%, Wallets 5%), acquiring banks (HDFC, ICICI, SBI, Axis), lognormal transaction amounts, and customer segments (New, Returning, VIP).

### B. Payment Chaos Engine
- **UPI Route Degradation**: Injects latency and failure spikes on acquiring bank switches.
- **Bank Outage**: Simulates total gateway unavailability.
- **Payment Timeout**: Induces upstream processing timeouts.
- **Webhook Delivery Delay**: Simulates callback delays to test asynchronous order reconciliation.
- **Custom Scenario Builder**: Create arbitrary combinations of failure rate, latency, and traffic multipliers.

### C. 6-Agent AI Diagnostic Suite
- **Scenario Analyst**: Deconstructs active failure modes and timeline steps.
- **Root Cause Analyst**: Pinpoints failure codes, error distributions, and blast radius.
- **Revenue Risk Calculator**: Deterministically calculates scaled unmitigated financial exposure.
- **Recovery Strategist**: Formulates multi-arm candidate strategies with explicit stopping conditions and assumptions.
- **Safety Analyst**: Evaluates friction, risk scores, and blast radius limits.
- **Executive Explainer**: Generates plain-English summaries and operational recommendations.

### D. Counterfactual Simulation Matrix (SimPy)
Runs concurrent discrete-event simulation arms (1,000 transactions/arm):
- **Baseline (Do Nothing)**: Measures pure unmitigated financial loss.
- **Immediate Gateway Retry**: Demonstrates duplicate debit risks during slow gateway conditions.
- **Exponential Backoff & Cooldown**: Evaluates jittered retries and latency impact.
- **Smart Dynamic Route Rerouting**: Evaluates shifting volume to secondary acquiring rails.
- **Asynchronous Payment Link**: Evaluates asynchronous payment recovery via SMS/WhatsApp links.

### E. Safety Engine & Guardrails (8 Rules)
- **G1 (Max Retries Cap)**: Enforces maximum 3 retry attempts.
- **G2 (High-Value Human Approval)**: Mandatory operator sign-off for orders ≥ ₹10,000.
- **G3 (Route Health Verification)**: Prohibits redirecting to degraded routes.
- **G4 (Duplicate Debit Protection)**: Enforces SHA-256 idempotency keying and state checks.
- **G5 (Customer Friction Threshold)**: Blocks high-friction OTP/3DS re-authentication loops.
- **G6 (Confidence Threshold)**: Requires AI confidence ≥ 75% for autonomous actions.
- **G7 (Gradual Canary Rollout)**: Restricts initial traffic migration to ≤ 20%.
- **G8 (Circuit Breaker Auto-Revert)**: Automatically trips if secondary route fails.

---

## 5. Project Structure

```text
PayFire/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (health, chaos, ai, simulations, safety, audit)
│   │   ├── core/            # Engines (chaos, generator, rca, simulation, safety, razorpay)
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic v2 request/response contracts
│   │   ├── config.py        # Settings with environment variable overrides
│   │   ├── database.py      # Database engine with PostgreSQL/SQLite dialect handling
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # 27 comprehensive automated tests
│   ├── audit_critical_flow.py # End-to-end flow automated audit script
│   ├── requirements.txt     # Production dependencies
│   └── .env.example         # Backend environment configuration template
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js 15 App Router (page.tsx, layout.tsx)
│   │   ├── components/
│   │   │   ├── layout/      # Sidebar, TopBar (guided workflow stepper)
│   │   │   ├── views/       # 7 specialized dashboard views
│   │   │   ├── dashboard/   # Health timeline, chaos controls, modal gates
│   │   │   └── ui/          # Reusable design primitives (MetricCard, StatusBadge, etc.)
│   │   └── lib/             # API client, TypeScript interfaces, INR formatters
│   ├── package.json
│   └── tailwind.config.ts
├── render.yaml              # Render Blueprint Infrastructure-as-Code
├── DEPLOYMENT.md            # Step-by-step cloud deployment instructions
├── PRODUCTION_AUDIT.md      # Formal production readiness audit report
└── .gitignore               # Strict exclusion of secrets, DBs, logs, and build artifacts
```

---

## 6. Local Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Health Check: `http://127.0.0.1:8000/api/health`
- OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 7. Running Tests

```bash
# Run backend test suite (27 passed)
cd backend && pytest -q

# Run critical flow E2E integration verification
python backend/audit_critical_flow.py

# Run frontend production build & type check
cd frontend && npm run build
```

---

## 8. Security & Sandbox Isolation

- **No Secrets in Frontend**: Zero credentials or sensitive tokens in client code.
- **Zero Real Funds Mutated**: Injected chaos and test-mode recovery actions run inside a deterministic synthetic sandbox.
- **Strict Exclusions**: `.env`, `*.db`, `*.sqlite3`, and build artifacts are excluded via `.gitignore`.
- **CORS Protection**: Access is restricted to designated frontend origins.

---

## 9. License

This project is developed for the **Razorpay AI Buildathon**. Apache 2.0 License.
