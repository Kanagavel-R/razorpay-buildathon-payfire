# ARCHITECTURE.md — PayFire: AI Payment Chaos Lab

## 1. System Topology Overview

```
                      +------------------------------------------+
                      |         Next.js 15 (App Router)          |
                      |  TypeScript, Tailwind CSS, shadcn/ui     |
                      |     Recharts, Lucide-React, Framer       |
                      +------------------------------------------+
                                           |
                                   REST / JSON APIs
                                           v
                      +------------------------------------------+
                      |         FastAPI Application Server       |
                      |       (Python 3.14 / Pydantic v2)        |
                      +------------------------------------------+
                         /         |              |          \
                        /          |              |           \
                       v           v              v            v
             +------------+ +-------------+ +------------+ +------------+
             |   Chaos    | |  Discrete   | |  AI Reason | | Safety &   |
             |   Engine   | | Event Sim   | |  & RCA     | | Policy     |
             |            | |  (SimPy)    | | (Structured| | Engine     |
             | Parametric | | Lognormal & | |  Pydantic) | | (8 Rules)  |
             | Injections | | Seeded Runs | |            | |            |
             +------------+ +-------------+ +------------+ +------------+
                       \           |              |            /
                        \          |              |           /
                         v         v              v          v
                      +------------------------------------------+
                      |       Storage & Audit Data Layer         |
                      |  SQLAlchemy (PostgreSQL / SQLite fallback|
                      |   In-Memory Event Bus / Redis Streams    |
                      +------------------------------------------+
                                           |
                                   Optional Webhooks
                                           v
                      +------------------------------------------+
                      |          Razorpay Test Mode APIs         |
                      |   Orders, Payments, Payment Links, Hooks |
                      |    (Automatic synthetic fallback mode)   |
                      +------------------------------------------+
```

---

## 2. Proposed Repository Structure

```
PayFire/
├── README.md
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── API.md
├── docs/
│   ├── DEMO.md
│   └── FAILURES_AND_FIXES.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI entrypoint & router mounts
│   │   ├── config.py                  # Pydantic Settings & environment variables
│   │   ├── database.py                # SQLAlchemy engine & session manager
│   │   ├── models/                    # Database ORM models
│   │   │   ├── __init__.py
│   │   │   ├── incident.py
│   │   │   ├── simulation.py
│   │   │   ├── strategy.py
│   │   │   └── audit.py
│   │   ├── schemas/                   # Pydantic request/response & AI schemas
│   │   │   ├── __init__.py
│   │   │   ├── chaos.py
│   │   │   ├── rca.py
│   │   │   ├── strategy.py
│   │   │   ├── simulation.py
│   │   │   ├── safety.py
│   │   │   └── audit.py
│   │   ├── api/                       # API Route controllers
│   │   │   ├── __init__.py
│   │   │   ├── health.py
│   │   │   ├── scenarios.py           # Chaos scenarios & injection
│   │   │   ├── incidents.py           # Incident monitoring & active metrics
│   │   │   ├── ai.py                  # Root-cause analysis & strategy gen
│   │   │   ├── simulations.py         # SimPy counterfactual runs
│   │   │   ├── safety.py              # Safety policy evaluations
│   │   │   ├── execution.py           # Action approvals & test-mode executions
│   │   │   └── audit.py               # Audit log trail
│   │   ├── core/                      # Domain logic engines
│   │   │   ├── __init__.py
│   │   │   ├── generator.py           # Synthetic payment stream generator
│   │   │   ├── chaos_engine.py        # Chaos injector (UPI, Gateway, Webhook)
│   │   │   ├── simulation_engine.py   # Discrete-event payment simulator (SimPy)
│   │   │   ├── rca_engine.py          # AI Root Cause & revenue-at-risk analysis
│   │   │   ├── strategy_engine.py     # AI Strategy formulation & scoring
│   │   │   ├── policy_engine.py       # Deterministic safety rule evaluator
│   │   │   ├── ml_anomaly.py          # IsolationForest / statistical anomaly detector
│   │   │   └── razorpay_client.py     # Razorpay Test Mode client + synthetic fallback
│   │   └── tests/                     # Test suite
│   │       ├── __init__.py
│   │       ├── test_generator.py
│   │       ├── test_simulation.py
│   │       ├── test_chaos.py
│   │       ├── test_safety_policies.py
│   │       ├── test_rca_and_strategies.py
│   │       └── test_api_endpoints.py
│   ├── scripts/
│   │   └── generate_data.py           # CLI tool for seeding synthetic datasets
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with dark fintech theme
│   │   │   ├── page.tsx               # Primary Command Center Dashboard
│   │   │   ├── scenarios/page.tsx     # Chaos Scenario Catalog & Injector
│   │   │   ├── simulation/page.tsx    # Strategy Counterfactual Comparison
│   │   │   ├── safety/page.tsx        # Safety Center & Policy Configuration
│   │   │   └── audit/page.tsx         # Real-time Audit Timeline
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KpiCard.tsx
│   │   │   │   ├── HealthTimeline.tsx
│   │   │   │   ├── ChaosControlPanel.tsx
│   │   │   │   ├── IncidentAlertBanner.tsx
│   │   │   │   ├── AiRcaCard.tsx
│   │   │   │   ├── StrategyCard.tsx
│   │   │   │   └── CounterfactualTable.tsx
│   │   │   ├── safety/
│   │   │   │   ├── SafetyGateModal.tsx
│   │   │   │   └── RuleStatusBadge.tsx
│   │   │   └── ui/                    # Reusable primitive components (button, badge, modal, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts                 # Typed backend client
│   │   │   ├── types.ts               # TypeScript mirror of Pydantic schemas
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
```

---

## 3. Data Flow & Execution Sequence

```
1. [User / Scenario Trigger] 
       │ POST /api/scenarios/inject { "scenario": "upi_degradation", "severity": 0.15 }
       ▼
2. [Chaos Engine]
       │ Injects parametric latency, soft failure rate, and bank route skew
       │ Generates anomaly time series
       ▼
3. [Incident Trigger & ML Anomaly Detection]
       │ Incident #INC-2026-904 flagged
       │ Calculates Baseline Revenue at Risk (e.g. ₹24,50,000)
       ▼
4. [AI Root-Cause Analyst]
       │ Evaluates error code distribution, routing matrix, and latency percentiles
       │ Emits structured RCA JSON (Root cause, Confidence 0.87, Evidence, Affected components)
       ▼
5. [AI Strategy Formulation]
       │ Generates 4 strategy candidates:
       │   A: Immediate Retry
       │   B: Smart Exponential Backoff + Jitter
       │   C: Dynamic Rerouting (Bank A -> Bank B)
       │   D: Asynchronous Payment Link (SMS/WhatsApp)
       ▼
6. [Discrete Event Simulation (SimPy)]
       │ Executes 1,000 synthetic transaction trajectories per candidate (seed=42)
       │ Models customer churn probability, gateway concurrency, and cooldown delays
       │ Outputs: Recovered GMV, Net Recovery %, Duplicate Risk Count, p95 Latency
       ▼
7. [Deterministic Safety Gate Engine]
       │ Evaluates 8 strict rules (Max 3 retries, high value threshold, confidence > 75%, etc.)
       │ Strategy A fails G4 (Duplicate Risk).
       │ Strategy C passes G1-G8 with G2 flagged (High Value > ₹10,000 requires human approval).
       ▼
8. [Merchant Dashboard & Human-in-the-Loop]
       │ Displays Side-by-Side Counterfactual Matrix
       │ User approves Strategy C execution (Test Mode)
       ▼
9. [Execution & Tamper-Proof Audit Log]
       │ Test-mode orders/payments updated in database or Razorpay Test Mode API
       │ Event logged to persistent audit timeline: actor, timestamp, inputs, outcome.
```

---

## 4. API Endpoints Contract

- `GET  /api/health` — Status, mode (Live/Synthetic), DB connection, active policies.
- `GET  /api/scenarios` — Catalog of preset chaos scenarios (Flash Sale, UPI Outage, Webhook Delay, etc.).
- `POST /api/scenarios/inject` — Injects selected scenario; transitions system from baseline to degraded.
- `POST /api/scenarios/reset` — Resets system back to 100% healthy baseline state.
- `GET  /api/incidents/current` — Active incident KPIs (Revenue at risk, success rate, latency, failed GMV).
- `POST /api/incidents/{id}/analyze` — Triggers AI Root Cause Analysis, outputs structured JSON.
- `POST /api/incidents/{id}/strategies` — Generates parameterized recovery strategies.
- `POST /api/simulations/run` — Simulates candidate strategies via SimPy discrete-event engine.
- `GET  /api/simulations/{id}/counterfactuals` — Fetches side-by-side comparison matrix.
- `POST /api/safety/validate` — Evaluates candidate strategy against 8 deterministic safety policies.
- `POST /api/execution/approve` — Human approval for strategies requiring manual sign-off.
- `POST /api/execution/execute` — Executes approved test-mode recovery actions.
- `GET  /api/audit` — Returns chronologically ordered audit trail events.
