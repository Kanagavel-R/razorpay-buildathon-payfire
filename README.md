# PayFire — AI Payment Chaos Lab

> 🏆 **Razorpay AI Buildathon 2026 — Track: AI Revenue Recovery**  
> **Development environment: Built with Google Antigravity**  
> **Important Disclaimer:** PayFire is an independent buildathon submission and is **NOT** an official Razorpay product.

> **“Break payments before they break your revenue.”**

> **PayFire is an AI-powered payment chaos lab that stress-tests recovery strategies in simulation before they can affect real customers and real money.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Pydantic%20v2-blue.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%7C%20Tailwind%20CSS-black.svg)](https://nextjs.org)
[![Simulation](https://img.shields.io/badge/Engine-SimPy%20Discrete--Event-orange.svg)](https://simpy.readthedocs.io)
[![Safety](https://img.shields.io/badge/Guardrails-8%20Deterministic%20Rules-emerald.svg)](#-ai-safety--guardrails)
[![Pytest](https://img.shields.io/badge/Tests-27%20Passed-brightgreen.svg)](#-testing)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#-license)

---

## 🌐 Live Deployments

| Component | Target URL | Description |
|---|---|---|
| **Frontend Web App** | [PayFire — AI Payment Chaos Lab](https://frontend-eight-pi-194a7r648a.vercel.app/) | Next.js 15 SaaS Dashboard on Vercel |
| **Backend API Server** | [PayFire API Server](https://razorpay-buildathon-payfire.onrender.com) | FastAPI Core Engine on Render |
| **Interactive API Documentation** | [Swagger / OpenAPI Docs](https://razorpay-buildathon-payfire.onrender.com/docs) | Interactive Swagger UI on Render |
| **System Health Check** | [/health](https://razorpay-buildathon-payfire.onrender.com/health) & [/api/health](https://razorpay-buildathon-payfire.onrender.com/api/health) | Uptime & JSON status endpoint |

> ⚠️ **Synthetic Environment Note:** The live deployment runs in a safe synthetic simulation sandbox. All transactions, merchant accounts, bank latencies, and degradation events are synthetically modeled. No live bank accounts, real cards, or real currency are accessed or mutated.

---

## ⚠️ The Problem

Payment failures in high-concurrency environments are costly, unpredictable, and cascading:
- **Direct Revenue Leakage:** Temporary gateway degradation or bank downtime leads to abandoned checkouts and lost gross merchandise value (GMV).
- **Destructive Retry Storms:** Naive retry logic floods degraded bank servers, worsening latency and increasing failure rates exponentially.
- **Double-Debit Catastrophes:** When gateways experience delayed authorizations (>3000ms), uncoordinated immediate retries trigger duplicate debits on customer accounts, causing severe support escalations and chargebacks.
- **High-Risk Production Testing:** Most engineering teams test payment routing changes directly in production during live traffic, effectively using real paying customers as guinea pigs.

---

## 💡 The Solution

**PayFire is a pre-deployment payment chaos engineering and recovery simulation lab.**

Instead of experimenting with live customer transactions, PayFire provides a safe synthetic digital twin where teams can:
1. **Inject Controlled Chaos:** Simulate realistic payment rail degradations (e.g., UPI outages, gateway rate limits, 3DS authentication latencies).
2. **Diagnose via Multi-Agent AI:** Analyze telemetry, identify multivariate root causes, and project financial revenue at risk.
3. **Generate Competing Recovery Strategies:** Synthesize multiple remediation plans (immediate retry, exponential backoff, dynamic gateway rerouting, asynchronous payment links).
4. **Stress-Test in SimPy Simulation:** Run discrete-event simulations across 100,000+ synthetic transactions to measure recovered GMV, latency overhead, and duplicate debit risks before deployment.
5. **Enforce Deterministic Guardrails:** Validate candidate strategies against 8 non-negotiable safety policies with human-in-the-loop gates for high-value transactions.
6. **Commit Immutable Audit Trails:** Record every scenario parameter, AI diagnostic rationale, operator decision, and cryptographic SHA-256 hash to a tamper-evident audit ledger.

---

## 🤖 AI at the Core

PayFire is an **AI-powered pre-deployment payment recovery testing platform**.

AI is used as a core part of the product to:
- **Telemetry Interpretation:** Evaluates complex multi-dimensional signals across payment rails, response codes, and latency distributions.
- **Root Cause Analysis (RCA):** Differentiates between infrastructure overload, acquiring bank network drops, and customer-side authentication friction.
- **Strategy Synthesis:** Generates diverse, context-aware recovery hypotheses tailored to specific failure modes.
- **Trade-Off Reasoning:** Explains the operational compromises between transaction recovery rate, latency overhead, customer friction, and merchant processing fees.
- **Adversarial Critique:** Challenges proposed recovery plans by simulating edge-case secondary failures and high-concurrency stress.

> 🔒 **Deterministic Boundary:** While AI provides deep reasoning, diagnostic hypotheses, and recovery strategies, **all financial calculations, volume projections, retry caps, idempotency checks, and safety rules are strictly deterministic Python/SQLAlchemy logic.** AI is never permitted to perform unrestricted financial actions.

---

## 🧠 AI Agent System

PayFire features 6 specialized AI agents working together in an orchestrated pipeline:

| AI Agent | Role & Responsibility | Implementation Details |
|---|---|---|
| **Scenario Analyst** | Ingests active chaos parameters, incident context, traffic multipliers, and timeline events to frame the incident. | Evaluates synthetic payment method, affected bank rail, and blast radius context. |
| **Root Cause Analyst** | Correlates telemetry, response codes, latency percentiles, and acquiring route concentrations. | Isolates root causes (e.g., bank timeout, switch saturation, gateway 504s) with confidence scoring. |
| **Revenue Risk Analyst** | Quantifies total revenue at risk and projected financial impact. | Strict deterministic calculation engine; projects gross revenue exposure without LLM arithmetic errors. |
| **Recovery Strategist** | Synthesizes competing recovery strategies across multiple intervention vectors. | Generates parameterized recovery candidates (backoff, dynamic routing, payment link fallbacks). |
| **Risk / Safety Analyst** | Evaluates compliance, operational risk, customer friction, and guardrail constraints. | Assesses safety boundaries, friction trade-offs, and canary migration criteria. |
| **Explanation Generator** | Converts technical diagnostics into transparent, human-readable operational justifications. | Generates clear executive summaries and audit rationale for PayOps and finance teams. |

> *Additionally, an **Adversarial Reviewer** workflow tests candidate plans against edge-case secondary outages to ensure resilience.*

---

## 🔄 AI Decision Pipeline

```text
Payment Chaos Injection
          ↓
Telemetry Anomaly Detection
          ↓
AI Scenario Understanding (Scenario Analyst)
          ↓
AI Root Cause Analysis (RCA Analyst)
          ↓
Deterministic Revenue Risk Calculation (Deterministic Math)
          ↓
AI Recovery Strategy Generation (Recovery Strategist)
          ↓
SimPy Counterfactual Simulation (5 Competing Arms)
          ↓
Deterministic Safety Policy Validation (8 Guardrails)
          ↓
Human Operator Approval Gate (Mandatory for High-Value >= ₹10k)
          ↓
Cryptographic Audit Ledger (SHA-256 Event Chain)
```

> **“AI provides reasoning and recommendations; deterministic controls decide what is allowed.”**

---

## ❓ Why AI Instead of Simple Rules?

Traditional rule-based systems (e.g., `if failure_rate > 10% then retry`) break down in complex payment systems:
- **Multivariate Failures:** Payment failures are rarely binary. An acquiring bank may successfully authorize card payments while dropping UPI collect requests, or accept low-value transactions while timing out on high-value transactions.
- **Dynamic Context Adaptation:** A flash sale requiring ultra-low latency requires different recovery policies than recurring B2B subscription billing. AI adapts strategy formulation to merchant business context.
- **Competing Financial Objectives:** Rule engines cannot weigh trade-offs between processing fees, gateway success probabilities, customer friction, and second-order retry storms.
- **Explainability & Trust:** AI generates transparent operational explanations that allow PayOps engineers to understand *why* dynamic rerouting is superior to exponential backoff in a specific scenario.

---

## 🎬 Buildathon Demo Scenario

### Scenario: Flash Sale Route Degradation
- **Baseline Transaction Volume:** 100,000 orders
- **Baseline Expected GMV:** ₹2.00 Crore (₹20,000,000)
- **Traffic Multiplier:** 5× peak traffic surge
- **Degradation Pattern:** Synthetic UPI acquiring route degradation with a 15% drop in success rate and high gateway latency spikes (1,800ms+).

### Step-by-Step Execution Workflow:
1. **Inject Chaos:** Trigger the Flash Sale scenario from the Chaos Control Panel. Synthetic UPI rail experiences high timeout rates.
2. **Observe Degradation:** Real-time health metrics reflect a drop in overall conversion and a spike in API latency.
3. **Multi-Agent AI Analysis:** The RCA engine evaluates telemetry, diagnosing upstream acquiring switch saturation with high confidence (87%).
4. **Deterministic Blast Radius:** System calculates ₹24.6 Lakhs in revenue at risk using deterministic financial formulas.
5. **SimPy Discrete-Event Simulation:** The engine simulates 1,000 transactions across 5 competing recovery arms:
   - *Arm 1 (Baseline / Do Nothing):* 62% success rate, ₹12.4 Lakhs recovered.
   - *Arm 2 (Blind Immediate Retry):* 71% success rate, but causes **50+ duplicate debit attempts** and exacerbates bank throttling.
   - *Arm 3 (Exponential Backoff):* 81% success rate, +1,200ms latency overhead.
   - *Arm 4 (Smart Dynamic Rerouting):* **89% success rate, ₹21.8 Lakhs recovered, 0 duplicate debits**, +320ms latency.
   - *Arm 5 (Asynchronous Payment Link):* 78% success rate, high latency overhead.
6. **Compare Outcomes:** PayOps engineers review the trade-off matrix; Dynamic Rerouting emerges as the mathematically superior recovery path.
7. **Deterministic Safety Validation:** The candidate strategy is evaluated against all 8 safety rules. The system detects orders ≥ ₹10,000 and activates **Rule 2: High-Value Human Approval**.
8. **Approve & Commit Audit:** The operator approves the action in the Safety Gate modal. The decision, rule results, and a SHA-256 cryptographic digest are permanently stored in the audit ledger.

> *Note: Metrics reflect simulated expected recovery in an isolated sandbox environment under simulation assumptions.*

---

## 🛡️ AI Safety & Guardrails

PayFire enforces **8 deterministic, non-negotiable safety guardrails** defined in [`backend/app/core/policy_engine.py`](file:///backend/app/core/policy_engine.py):

| Rule ID | Rule Name | Deterministic Policy & Condition | Action on Violation |
|---|---|---|---|
| **RULE_1_MAX_RETRY** | Max Retry Limit | Enforces an absolute ceiling of ≤ 3 retry attempts per transaction. | Blocks strategy execution |
| **RULE_2_HIGH_VALUE_APPROVAL** | High-Value Human Approval | Any order or batch with transaction values ≥ ₹10,000 requires explicit human operator sign-off. | Halts execution; triggers approval modal |
| **RULE_3_CONFIDENCE_THRESHOLD** | Confidence Threshold | AI root cause diagnosis confidence must be ≥ 75% for autonomous actions. | Reverts to human review gate |
| **RULE_4_DUPLICATE_PROTECTION** | Duplicate Debit Protection | Requires SHA-256 idempotency verification; blocks immediate retries when in-flight payment state is unconfirmed. | Blocks immediate retry arm |
| **RULE_5_COOLDOWN_ENFORCEMENT** | Retry Cooldown Interval | Enforces a minimum cooldown interval of ≥ 60 seconds between retry cycles. | Rejects 0ms immediate retries |
| **RULE_6_CIRCUIT_BREAKER** | Circuit Breaker Escalation | Tripping mechanism automatically reverts routing if secondary route fails > 25% within 60 seconds. | Armed on secondary route |
| **RULE_7_AUDIT_LOGGING** | Mandatory Audit Trail | Every diagnosis, simulation, and operator approval must produce an immutable audit log record. | Enforced on all actions |
| **RULE_8_SANDBOX_ISOLATION** | Simulation Sandbox Isolation | Simulated runs are strictly walled off from production payment mutating APIs. | Verified before execution |

> **The AI cannot bypass, loosen, or override any of these deterministic safety guardrails.**

---

## 🧪 Synthetic Payment Isolation

To protect merchants and real financial systems, PayFire maintains strict isolation:
- **No Live Banking Credentials:** The platform does not require or store live payment credentials.
- **Deterministic Transaction Generation:** A lognormal payment generator models realistic transaction amounts, payment methods (UPI, Cards, NetBanking), and error codes.
- **Transparent Razorpay Test Mode Wrapper:** If Razorpay test credentials (`rzp_test_*`) are supplied, PayFire interacts solely with Razorpay sandbox endpoints (Test Orders, Test Payments, Test Links). If keys are absent, it seamlessly falls back to its built-in high-fidelity synthetic payment simulator.
- **Zero Real Funds at Risk:** No real bank account or credit card is ever debited.

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
│   │   ├── api/                 # FastAPI routers (health, chaos, ai, simulations, safety, audit)
│   │   ├── core/                # Core engines (chaos, generator, rca, simulation, safety, razorpay)
│   │   ├── models/              # SQLAlchemy database models
│   │   ├── schemas/             # Pydantic v2 data models and contracts
│   │   ├── config.py            # Environment settings and safety thresholds
│   │   ├── database.py          # Database session handling (PostgreSQL / SQLite)
│   │   └── main.py              # FastAPI application entry point
│   ├── tests/                   # 27 comprehensive automated tests (Pytest)
│   ├── audit_critical_flow.py   # Automated end-to-end flow verification script
│   ├── requirements.txt         # Production dependencies
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 15 App Router pages & layout
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, TopBar (workflow stepper)
│   │   │   ├── views/           # 7 dashboard views (Overview, Chaos, RCA, Strategies, etc.)
│   │   │   ├── dashboard/       # Health timeline, chaos controls, modal gates
│   │   │   └── ui/              # Design primitives (MetricCard, StatusBadge, Button)
│   │   └── lib/                 # API client, TypeScript types, INR currency formatters
│   ├── package.json
│   └── tailwind.config.ts
├── render.yaml                  # Render Infrastructure-as-Code blueprint
├── API.md                       # Complete API specification and endpoint docs
├── ARCHITECTURE.md              # Deep-dive architectural documentation
├── DEPLOYMENT.md                # Cloud deployment instructions (Render + Vercel)
├── PRODUCTION_AUDIT.md          # Production verification audit report
└── .gitignore                   # Strict exclusion rules for secrets, DBs, and builds
```

---

## 🚀 Local Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Kanagavel-R/razorpay-buildathon-payfire.git
cd razorpay-buildathon-payfire
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- API Health Check: `http://127.0.0.1:8000/health` (or `http://127.0.0.1:8000/api/health`)
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🧪 Testing

The backend includes a comprehensive automated test suite covering all routers, engines, and safety rules:

```bash
# Run backend test suite
cd backend
pytest -q
```
**Test Results:** `27 passed in 1.48s` (100% pass rate across chaos, generator, RCA, simulation, safety, and audit suites).

```bash
# Run critical end-to-end integration audit
python backend/audit_critical_flow.py

# Verify frontend production build and TypeScript types
cd ../frontend
npm run build
```

---

## 🔍 Production Verification

PayFire has undergone formal production verification:
- **Health Check Verified:** Verified `GET /health` and `GET /api/health` return HTTP 200 `{"status": "healthy"}` on Render.
- **Frontend Clean Build:** Vercel production build passes with zero linting or TypeScript compilation errors.
- **Endpoint Parity:** Frontend API client is normalized to call `/api/*` endpoints with zero 404 mismatches.
- **Secret Zero-Leakage:** Codebase audited for zero committed API keys, tokens, `.env` files, or database credentials.
- Read the full audit in [PRODUCTION_AUDIT.md](file:///PRODUCTION_AUDIT.md).

---

## 🔒 Security & Sandbox Isolation

- **Client-Side Secret Hygiene:** Zero payment secrets or private API keys exist in frontend code or client bundles.
- **Controlled Blast Radius:** All simulations run in an isolated in-memory or synthetic database sandbox.
- **Strict Idempotency:** SHA-256 idempotency keying prevents duplicate execution of recovery actions.
- **CORS Protection:** Configured with strict CORS origin allowances to prevent unauthorized cross-origin invocations.
- **Environment Isolation:** Sensitive configurations use environment variable overrides with secure local defaults.

---

## 🌟 Key Product Capabilities

- **Interactive Chaos Injection:** Parametrically inject UPI drops, card network latency spikes, netbanking timeouts, and gateway rate limits.
- **Real-Time Payment Health Timeline:** Visual indicators showing system state transitions (Normal → Degraded → Critical → Recovered).
- **Multi-Agent Diagnostic Reasoning:** Instant automated root cause analysis with confidence scores, anomaly detection, and impacted route isolation.
- **Counterfactual SimPy Simulation:** Compare 5 competing recovery strategies concurrently across recovered GMV, success rates, latency, and duplicate debit risks.
- **Human-in-the-Loop Safety Gate:** Visual policy modal with interactive sign-off for transactions exceeding ₹10,000.
- **Cryptographic Audit Ledger:** Immutable audit trail with SHA-256 event chaining for enterprise compliance and post-incident reviews.

---

## 🏆 Why PayFire?

| Traditional Payment Recovery | PayFire AI Payment Chaos Lab |
|---|---|
| Tested directly in production during live incidents | Stress-tested in safe SimPy discrete-event simulation |
| Rigid IF-ELSE rules unable to handle partial degradations | Multi-agent AI reasoning adapts to nuanced telemetry |
| Uncoordinated retries cause catastrophic double debits | Deterministic Rule 4 blocks in-flight duplicate debits |
| Uncontrolled autonomous agents risk financial loss | Strict deterministic guardrails & human approval gates |
| Opaque routing changes without explainability | Clear business and technical reasoning with audit trails |

---

## 🎯 Buildathon Value Proposition

For the **Razorpay AI Buildathon 2026 (AI Revenue Recovery Track)**, PayFire addresses the fundamental question:

> **How do merchants recover lost payment revenue without increasing duplicate debits, customer churn, or operational risk?**

By introducing an **AI-powered pre-deployment simulation and safety firewall**, PayFire enables merchants and payment platforms to:
- Recover up to **89% of at-risk revenue** during high-concurrency payment outages.
- Eliminate duplicate debit risks before deploying automated recovery rules.
- Maintain complete operational visibility and regulatory audit compliance.

---

## 🔮 Future Improvements

- **Real-Time Webhook Ingestion:** Dynamic ingestion of live merchant webhook streams for instant digital twin synchronization.
- **Automated Canary Deployment:** Native integration with payment gateway routing APIs for automated canary rollouts (10% → 50% → 100%).
- **Multi-Merchant Tenant Isolation:** Role-based access control (RBAC) and tenant isolation for multi-brand enterprise merchants.
- **Reinforcement Learning from Operational Feedback:** Ongoing fine-tuning of recovery recommendations based on verified post-incident recovery performance.

---

## 📚 Documentation Links

- [API Specification (API.md)](file:///API.md) — Complete REST API contracts and request/response schemas.
- [System Architecture (ARCHITECTURE.md)](file:///ARCHITECTURE.md) — Deep dive into the multi-agent architecture and SimPy simulation model.
- [Deployment Guide (DEPLOYMENT.md)](file:///DEPLOYMENT.md) — Step-by-step instructions for deploying to Vercel and Render.
- [Production Readiness Audit (PRODUCTION_AUDIT.md)](file:///PRODUCTION_AUDIT.md) — Comprehensive pre-deployment security and readiness report.
- [Adversarial Review Defense (docs/ADVERSARIAL_REVIEW.md)](file:///docs/ADVERSARIAL_REVIEW.md) — Architectural defense addressing critical fintech questions.

---

## ℹ️ Project Information

- **Project:** PayFire — AI Payment Chaos Lab
- **Buildathon:** Razorpay AI Buildathon 2026
- **Track:** AI Revenue Recovery
- **Development Environment:** Built with Google Antigravity
- **Repository:** [https://github.com/Kanagavel-R/razorpay-buildathon-payfire](https://github.com/Kanagavel-R/razorpay-buildathon-payfire)
- **Status:** Complete, Verified, and Deployed

---

## 👤 Author

**Kanagavel R**  
GitHub: [@Kanagavel-R](https://github.com/Kanagavel-R)  
Repository: [Kanagavel-R/razorpay-buildathon-payfire](https://github.com/Kanagavel-R/razorpay-buildathon-payfire)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](file:///LICENSE) file for details.

*Developed as an independent submission for the Razorpay AI Buildathon 2026.*
