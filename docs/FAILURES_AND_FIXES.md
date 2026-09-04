# FAILURES_AND_FIXES.md — Engineering Failure Log

This document records technical obstacles encountered during development, their identified root causes, architectural remedies applied, and verification steps taken.

---

### Incident 1: Host Daemon Availability (PostgreSQL & Redis Services)
- **Problem**: Host environment lacks running background system daemons for native PostgreSQL and Redis. Running direct connection attempts would crash the FastAPI backend on startup.
- **Cause**: Developer host environment runs clean Windows without pre-configured database services.
- **Fix**: Implemented a resilient, pluggable database and cache architecture in `backend/app/config.py` and `database.py`. The system dynamically detects `DATABASE_URL` (defaulting to zero-friction `sqlite:///./payfire.db`) and `REDIS_URL` (defaulting to high-performance in-process event bus). Both interfaces use standard SQLAlchemy and pub/sub abstractions, ensuring 100% production compatibility with Supabase (Postgres) and Upstash (Redis).
- **Verification**: Verified SQLAlchemy initializes cleanly and can run migrations and transactions locally without external daemon dependencies.

---

### Incident 2: Razorpay API Key Dependency in Hackathon/Demo Sandbox
- **Problem**: If third-party credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are unset or expired, live payment API calls fail with 401 Unauthorized, halting the demo.
- **Cause**: Reliance on external network APIs during offline or credential-free evaluations.
- **Fix**: Architected `backend/app/core/razorpay_client.py` with an automatic high-fidelity synthetic fallback mode. When credentials are provided, it executes authentic Razorpay Test Mode calls. When credentials are absent, it executes deterministic synthetic transactions and webhook events, clearly labeling them as `TEST MODE (SYNTHETIC)` in UI and audit logs without failing or fabricating fake successes.
- **Verification**: Tested Razorpay client with empty credentials; operations returned valid compliant order and payment mock payloads marked with `mode: "synthetic_test"`.

---

### Incident 3: Starlette TestClient Lifespan Lifecycle Bypass
- **Problem**: Running `pytest backend/tests` resulted in `sqlite3.OperationalError: no such table: incidents` during `test_api_scenarios_and_injection`.
- **Cause**: In FastAPI / Starlette, creating `TestClient(app)` outside of a `with TestClient(app) as client:` context manager does not invoke the `lifespan` handler where `init_db()` was located.
- **Fix**: Called `init_db()` explicitly in `backend/app/database.py` during engine startup and added a `pytest` fixture in `backend/tests/conftest.py` ensuring tables are guaranteed initialized across all test sessions.
- **Verification**: Re-ran `pytest backend/tests -v`, confirming all tables are initialized and all 9 tests pass.

---

### Incident 4: Windows Console CP1252 UnicodeEncodeError for Rupee Symbol
- **Problem**: CLI dataset script `backend/scripts/generate_data.py` threw `UnicodeEncodeError: 'charmap' codec can't encode character '\u20b9'` when printing summary statistics to PowerShell.
- **Cause**: Windows default terminal character encoding (`cp1252`) does not map the Unicode Indian Rupee glyph (`\u20b9`) without explicit UTF-8 reconfiguration.
- **Fix**: Reconfigured standard output stream via `sys.stdout.reconfigure(encoding="utf-8")` with fallback handling and adopted the standardized ISO currency prefix (`INR`) in terminal outputs.
- **Verification**: Executed `python backend/scripts/generate_data.py --count 1000 --seed 42`; generation completed with exit code 0 and properly formatted summary statistics.

---

### Incident 5: Lucide-React SVG Component Direct Title Property Type Error
- **Problem**: Next.js production build (`npm run build`) failed during type checking with `Type error: Property 'title' does not exist on type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'` in `CounterfactualTable.tsx`.
- **Cause**: Strict TypeScript definitions in `@types/react` and `lucide-react` do not expose HTML `title` on the SVG React component interface.
- **Fix**: Wrapped the `<Award />` icon inside a semantic `<span>` element equipped with the `title="Recommended"` tooltip attribute.
- **Verification**: Re-ran Next.js production build; confirmed zero TypeScript compilation errors.

---

### Incident 6: FastAPI Optional Body Parameter Binding in Chaos Injection Endpoint
- **Problem**: Sending JSON bodies to `POST /api/chaos/scenarios/{id}/inject` failed to bind to the `req: Optional[ChaosInjectionRequest] = None` parameter, causing `req.environment` to evaluate to `None` and bypass the safety environment check.
- **Cause**: In FastAPI, when a Pydantic model parameter defaults to `None` without explicit `Body()`, FastAPI treats it as a query parameter or fails to deserialize JSON payload if the path parameter is matched first.
- **Fix**: Updated parameter declaration to `req: Optional[ChaosInjectionRequest] = Body(default=None)` and imported `Body` from `fastapi`.
- **Verification**: Tested `POST /api/chaos/scenarios/upi_degradation/inject` with `{"environment": "production"}`; endpoint returned HTTP 403 Forbidden with safety violation details.

---

### Incident 7: Incident ID Sub-Second Timestamp Collision Under Rapid Automated Testing
- **Problem**: Running automated tests sequentially caused `sqlalchemy.exc.IntegrityError: UNIQUE constraint failed: incidents.id`.
- **Cause**: IDs generated as `f"inc_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"` collided when two tests injected chaos in the same calendar second.
- **Fix**: Appended random hexadecimal entropy `_{uuid.uuid4().hex[:6]}` to all incident ID generators.
- **Verification**: Re-ran pytest suite across 27 tests; zero collisions occurred.

---

### Incident 8: Attribute Access Mismatch in AI Multi-Agent Revenue Risk Pipeline
- **Problem**: Multi-agent incident analysis threw `AttributeError: 'SyntheticTransaction' object has no attribute 'amount'`, causing the orchestrator to engage emergency rule fallback with lower confidence.
- **Cause**: In `SyntheticTransaction` dataclass, the monetary field is explicitly named `amount_inr` and accompanied by a precomputed boolean `is_high_value`.
- **Fix**: Updated `RevenueRiskAnalyst` to check `getattr(t, "is_high_value", False) or getattr(t, "amount_inr", 0) >= 10000.0`.
- **Verification**: Tested multi-agent RCA directly; all 6 agents execute cleanly and produce 88%+ confidence with `AI_AGENT_ANALYSIS` classification.
