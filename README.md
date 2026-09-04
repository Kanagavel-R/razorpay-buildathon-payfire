# PayFire — AI Payment Chaos Lab

> 🏆 **Razorpay AI Buildathon 2026 — AI Revenue Recovery Track**  
> **Built with Google Antigravity**  
> **Independent buildathon submission — not an official Razorpay product.**

> **“Break payments before they break your revenue.”**

> **PayFire is an AI-powered payment chaos lab that stress-tests recovery strategies in simulation before they can affect real customers and real money.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Pydantic%20v2-blue.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%7C%20Tailwind%20CSS-black.svg)](https://nextjs.org)
[![Simulation](https://img.shields.io/badge/Engine-SimPy%20Discrete--Event-orange.svg)](https://simpy.readthedocs.io)
[![Safety](https://img.shields.io/badge/Guardrails-8%20Deterministic%20Rules-emerald.svg)](#-ai-safety--guardrails)
[![Pytest](https://img.shields.io/badge/Tests-27%20Passed-brightgreen.svg)](#-testing)

---

## 🤖 AI at the Core

PayFire is an **AI-powered pre-deployment payment recovery testing platform**.

AI is used as a core part of the product to:

- Generate realistic payment failure and chaos scenarios
- Analyze incidents and identify probable root causes
- Estimate revenue at risk and business impact
- Generate and rank competing recovery strategies
- Reason about recovery trade-offs
- Perform counterfactual "what-if" analysis
- Explain why a recovery strategy is preferred
- Challenge recovery strategies through adversarial scenarios

The AI recommendation is never allowed to directly perform unrestricted financial actions.

Every recommendation passes through deterministic safety controls, risk validation, simulation, and approval gates.

---

## 🏆 Razorpay AI Buildathon 2026

**Track:** AI Revenue Recovery  
**Project:** PayFire — AI Payment Chaos Lab  

**Core Idea:**

> Test AI-powered payment recovery strategies in a safe simulated environment before they affect real customers and real money.

### Buildathon Problem Addressed

Payment failures can cause:

- Lost transactions
- Checkout drop-offs
- Subscription failures
- Revenue leakage
- Retry storms
- Duplicate payment risks
- Merchant operational overhead

PayFire addresses this by allowing recovery strategies to be **generated, simulated, compared, validated, and audited before deployment**.

> *Note: This is an independent buildathon submission and is not an official Razorpay product.*

---

## 🧠 AI Agent System

PayFire uses specialized AI agents for different parts of the payment-recovery workflow:

| AI Agent | Responsibility |
|---|---|
| **Scenario Analyst** | Understands the injected payment failure scenario |
| **RCA Analyst** | Analyzes telemetry and identifies probable root causes |
| **Recovery Strategist** | Generates competing recovery strategies |
| **Risk Analyst** | Evaluates risk, constraints, and potential side effects |
| **Explainer** | Converts technical analysis into understandable business reasoning |
| **Adversarial Reviewer** | Challenges the proposed strategy with failure scenarios |

> *These agents operate on synthetic/simulated payment environments and are constrained by deterministic application-level safety rules.*

---

## 🔄 AI Decision Pipeline

```text
Payment Chaos
      ↓
Telemetry Analysis
      ↓
AI Scenario Understanding
      ↓
AI Root Cause Analysis
      ↓
AI Recovery Strategy Generation
      ↓
Risk Analysis
      ↓
Counterfactual Simulation
      ↓
Deterministic Safety Validation
      ↓
Human Approval / Controlled Action
      ↓
Immutable Audit Trail
```

> **AI provides reasoning and recommendations; deterministic controls decide what is allowed.**

---

## ❓ Why AI Instead of Simple Rules?

Traditional rule-based systems can detect predefined conditions.

PayFire uses AI where reasoning and scenario variability matter:

- Failure patterns can have multiple possible causes.
- Different incidents may require different recovery strategies.
- Recovery strategies can have competing financial outcomes.
- AI can generate and compare alternative strategies.
- AI can explain the reasoning behind a recommendation.
- Adversarial AI can challenge a proposed recovery strategy.

However:

> **Financial calculations, safety limits, retry limits, approval thresholds, and execution constraints remain deterministic.**

---

## 🎬 Buildathon Demo Scenario

### Scenario: Flash Sale Route Degradation

- **Expected Transactions:** 100,000 orders
- **Expected GMV:** ₹2 Crore (simulated baseline volume)
- **Traffic Multiplier:** 5× surge
- **UPI Degradation:** 15% drop in success rate + upstream bank latency spike

### Workflow Execution:
1. **Inject Payment Chaos**: Perturb synthetic UPI acquiring rails with high-concurrency traffic.
2. **Observe Synthetic Payment Degradation**: Telemetry detects anomalous drop in conversion SLA.
3. **AI Analyzes the Incident**: Multi-agent RCA identifies acquiring switch timeout patterns.
4. **AI Generates Recovery Strategies**: Proposes competing recovery candidates (Immediate Retry, Exponential Backoff, Dynamic Route Rerouting, Payment Links).
5. **SimPy Counterfactual Simulation**: Runs 1,000 transactions per arm under simulation assumptions to compute simulated expected recovery.
6. **Strategy Comparison**: Demonstrates that blind immediate retry causes 50+ duplicate debit violations, while dynamic rerouting achieves optimal recovery with zero duplicate debits.
7. **Deterministic Safety Validation**: Safety engine validates the candidate against 8 deterministic rules (G1–G8). High-value threshold requires operator review.
8. **Audit Trail Recording**: Decision, actor sign-off, and cryptographic SHA-256 digest are permanently committed to the immutable audit ledger.

> *Note: Metrics reflect simulated expected recovery in an isolated sandbox and do not represent real Razorpay production balances.*

---

## 🛡️ AI Safety & Guardrails

PayFire follows a **recommend → validate → simulate → approve → audit** governance model.

Every candidate action is evaluated against **8 deterministic safety guardrails**:

1. **G1 (Max Retries Cap)**: Strictly enforces a maximum of 3 retry attempts per sequence.
2. **G2 (High-Value Human Approval)**: Mandatory operator sign-off for order batches with values ≥ ₹10,000.
3. **G3 (Route Health Verification)**: Prohibits traffic redirection to any rail reporting >10% failure or >1800ms latency.
4. **G4 (Duplicate Debit Protection)**: Enforces SHA-256 idempotency keying and state verification across all recovery arms.
5. **G5 (Customer Friction Threshold)**: Blocks strategies that force repeated OTP/3DS re-authentication loops.
6. **G6 (Confidence Threshold)**: Requires AI diagnosis confidence ≥ 75% for autonomous actions.
7. **G7 (Gradual Canary Rollout)**: Limits canary traffic migration to maximum 20% on the initial step.
8. **G8 (Circuit Breaker Auto-Revert)**: Automatically trips routing rules back to baseline if secondary route failure exceeds 25%.

> **The AI cannot override deterministic safety policies.**

---

## 🏗️ High-Level Architecture

```text
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

## 🧰 Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Lucide React

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy
- SQLite / PostgreSQL (dialects supported)
- Pydantic v2

### AI / ML
- LLM-based AI Agents (Scenario, Root Cause, Revenue Risk, Strategist, Safety, Explainer)
- Multi-Agent Orchestration
- Scikit-Learn
- Structured Pydantic AI Output Contracts

### Simulation & Math
- SimPy (Discrete-Event Simulation)
- NumPy
- Pandas
- Deterministic Lognormal Transaction Generator

### Payments & Testing
- Razorpay Test Mode API Client Wrapper (Orders, Payments, Payment Links, Webhooks)
- High-Fidelity Synthetic Payment Sandbox Fallback

### Development & DevOps
- Google Antigravity
- Render (Blueprint `render.yaml`)
- GitHub

---

## 🛠️ Built with Google Antigravity

PayFire was developed using **Google Antigravity** as the AI-powered development environment.

Antigravity was used to assist with:

- Architecture planning & system specification
- Full-stack implementation (FastAPI backend + Next.js frontend)
- Multi-agent AI workflow development
- Backend and frontend development
- End-to-end testing and test-suite debugging
- Browser-based UI validation & responsive auditing
- Security, blast-radius, and failure analysis
- Comprehensive documentation

> *Note: Mention of Google Antigravity reflects the development toolchain used to build this project and does not imply Google officially endorses, sponsors, or owns PayFire.*

---

## 📁 Project Structure

```text
PayFire/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (health, chaos, ai, simulations, safety, audit)
│   │   ├── core/            # Core engines (chaos, generator, rca, simulation, safety, razorpay)
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

## 🚀 Local Quickstart

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
- OpenAPI Documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Testing

```bash
# Run backend test suite (27 passed)
cd backend && pytest -q

# Run critical flow E2E integration verification
python backend/audit_critical_flow.py

# Run frontend production build & type check
cd frontend && npm run build
```

---

## 🔒 Security & Sandbox Isolation

- **No Secrets in Frontend**: Zero credentials or sensitive tokens in client code.
- **Zero Real Funds Mutated**: Injected chaos and test-mode recovery actions run inside a deterministic synthetic sandbox.
- **Strict Exclusions**: `.env`, `*.db`, `*.sqlite3`, and build artifacts are excluded via `.gitignore`.
- **CORS Protection**: Access is restricted to designated frontend origins.

---

## 📄 License

This project is licensed under the **MIT License**.

Developed as an independent submission for the **Razorpay AI Buildathon 2026**
