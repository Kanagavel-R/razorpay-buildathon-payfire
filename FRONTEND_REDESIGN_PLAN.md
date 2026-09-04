# FRONTEND_REDESIGN_PLAN.md — PayFire Fintech SaaS Dashboard Redesign

> **Design Direction:** Modern Fintech SaaS (Stripe / Linear / Vercel / Razorpay level polish).  
> **Aesthetic:** Dark-first, restrained slate/zinc palette, semantic color accents (emerald, amber, rose, indigo), data-driven information hierarchy, zero decorative fluff.

---

## 1. Codebase & Architectural Inspection

### Strengths in Existing Codebase
- Backend APIs, models, simulations, policy engine, and audit logging are 100% operational and verified with 27/27 passing tests.
- Typed client in `frontend/src/lib/api.ts` cleanly exposes all endpoints (`getHealth`, `getScenarios`, `injectChaos`, `resetBaseline`, `getCurrentIncident`, `analyzeIncident`, `generateStrategies`, `runSimulation`, `validateSafety`, `approveStrategy`, `executeStrategy`, `getAuditTrail`).
- Pydantic models in `lib/types.ts` already support multi-agent outputs, counterfactual metrics, safety rules, and audit events.
- Recharts and Lucide-React are already installed.

### Deficiencies in Current UI
1. **Monolithic Vertical Stacking**: All components are rendered on a single long scrolling page. Sections like AI RCA and Counterfactual Table appear/disappear abruptly, creating layout shift and a confusing operational workflow.
2. **Missing Application Shell**: No sidebar or structured tab navigation; users cannot jump directly to Simulation, Safety Center, or Audit Trail.
3. **Typography & Number Formatting**: Standard raw numbers (e.g. `20000000`) instead of localized Indian currency formatting (`₹2,00,00,000` / `₹2 Crore`).
4. **Weak State Handling**: Missing dedicated empty states, skeleton loading placeholders, and clear error recovery dialogs.
5. **No Guided Demo Stepper**: Judges must manually scroll and guess the next step rather than following a crystal-clear 30-second guided workflow (`BASELINE → CHAOS → DIAGNOSIS → STRATEGY → SIMULATION → SAFETY → RESULT`).
6. **No Pre-Injection Confirmation**: In Chaos injection, clicking the button instantly fires without a confirmation modal summarizing the blast radius and safety boundary.

---

## 2. Redesign Architecture & Component Hierarchy

```
+----------------------------------------------------------------------------------------------------+
|                                      Top Navigation Bar                                             |
|  Page Title • Environment: SYNTHETIC SANDBOX • SLA: 98.5% Nominal • Guided Demo Stepper • Reset CTA |
+------------------------------------+---------------------------------------------------------------+
|           Left Sidebar             |                       Main Content Area                       |
|                                    |                                                               |
|  [Logo] PayFire                    |  [View 1: Overview Dashboard]                                 |
|  AI Payment Chaos Lab              |    • 4 KPI Cards (Indian Currency, Trend/SLA Badges)          |
|                                    |    • Payment Health Telemetry Chart (Success, Latency, GMV)   |
|  Navigation:                       |    • Active Incident / Steady-State Health Banner             |
|   • Overview                       |                                                               |
|   • Chaos Lab                      |  [View 2: Chaos Lab]                                          |
|   • AI Diagnosis                   |    • Scenario Configurator (Presets + Custom Builder)         |
|   • Recovery Strategies            |    • Live Impact Preview & Blast Radius                       |
|   • Simulation                     |    • Pre-Injection Confirmation Modal                         |
|   • Safety Center                  |                                                               |
|   • Audit Trail                    |  [View 3: AI Diagnosis Console]                              |
|                                    |    • 6-Agent Incident Response Console                        |
|  Bottom Status:                    |    • Root Cause, Business Impact, Error Patterns, Evidence    |
|   • System: Operational            |    • Skeleton Loaders & Labeled Fallback State                |
|   • Engine: Synthetic Simulator    |                                                               |
|   • Sandbox: Isolated              |  [View 4: Recovery Strategies]                                |
|                                    |    • Strategy Cards & Comparison Table                        |
|                                    |    • Recommended Strategy Highlight & Stopping Conditions     |
|                                    |                                                               |
|                                    |  [View 5: Simulation Matrix]                                  |
|                                    |    • Before vs. After Counterfactual Comparison               |
|                                    |    • Recovery Rate, Duplicate Risks, Latency Percentiles      |
|                                    |                                                               |
|                                    |  [View 6: Safety Center]                                      |
|                                    |    • 6-Stage Visual Safety Pipeline                           |
|                                    |    • 8 Deterministic Rules (PASS / REVIEW / BLOCKED)          |
|                                    |    • Human Sign-Off & Test-Mode Execution Gateway             |
|                                    |                                                               |
|                                    |  [View 7: Audit Trail]                                        |
|                                    |    • Chronological Event Timeline                             |
|                                    |    • Search, Filter, Collapsible Technical Cryptographic Hash |
+------------------------------------+---------------------------------------------------------------+
```

---

## 3. Reusable Component Blueprint

1. `Sidebar.tsx`: Professional collapsible navigation with active indicators, system health pulse, and responsive drawer on mobile.
2. `TopBar.tsx`: Dynamic breadcrumb, guided demo stepper (`BASELINE` through `RESULT`), environment sandbox indicator, and reset action.
3. `MetricCard.tsx`: Standardized KPI card with formatted currency (`₹2.0 Cr`), status badge, and descriptive context.
4. `StatusBadge.tsx`: Semantic badges (`PASS`, `BLOCKED`, `REVIEW`, `CRITICAL`, `OPTIMAL`).
5. `ConfirmModal.tsx`: Accessible dialog confirming chaos injection scope before executing.
6. `LoadingSkeleton.tsx`: Subtle pulse skeleton states preventing layout shifts during AI analysis and SimPy simulations.
7. `EmptyState.tsx`: Meaningful empty states when no incident or simulation is yet active, guiding the user to the next logical step.

---

## 4. Implementation Steps

1. **Step 1: Utility & Formatting Helpers**:
   - Create `frontend/src/lib/formatters.ts` with standard Indian currency formatting (`formatINR`, `formatPercent`, `formatMs`).
2. **Step 2: Component Shell**:
   - Create `frontend/src/components/layout/Sidebar.tsx` and `frontend/src/components/layout/TopBar.tsx`.
   - Update `globals.css` with clean fintech tokens and smooth transitions.
3. **Step 3: Dedicated Tab Views**:
   - `OverviewView.tsx`: Health charts, KPI metrics, incident status card.
   - `ChaosLabView.tsx`: Enhanced scenario selector, blast radius preview, confirmation modal.
   - `AiDiagnosisView.tsx`: 6-agent incident response console, evidence breakdown, skeleton loaders.
   - `StrategiesView.tsx`: Strategy comparison cards, stopping conditions, rationale.
   - `SimulationView.tsx`: Counterfactual matrix, Before vs After charts, safe simulation banner.
   - `SafetyCenterView.tsx`: Visual safety gate pipeline, 8 deterministic rules, human approval.
   - `AuditTrailView.tsx`: Searchable timeline with collapsible cryptographic hash details.
4. **Step 4: Orchestrate in `page.tsx`**:
   - Wire all tab views to shared state and API handlers without modifying backend endpoints.
5. **Step 5: Verification & Production Build**:
   - Test on browser, verify all tabs, run `npm run build`, and confirm zero TypeScript errors.
