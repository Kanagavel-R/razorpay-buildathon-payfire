# PayFire Backend Deployment Guide (Render)

**Project**: PayFire — AI Payment Chaos Lab  
**Service**: FastAPI Production Backend  
**Deployment Target**: [Render](https://render.com) (Web Service)

---

## 1. Quick Specifications

| Item | Value |
|---|---|
| **Runtime** | Python 3.10 / 3.11 / 3.12 |
| **Root Directory** | `backend` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/api/health` |
| **Auto-Deploy** | Yes (on git push) |

---

## 2. Step-by-Step Deployment Instructions

### Method A: Connect via Render Blueprint (`render.yaml`)

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository: `PayFire`.
4. Render will automatically detect [render.yaml](file:///c:/Users/KANAGAVEL%20R/OneDrive/Documents/Antigravity/PayFire/render.yaml) and configure the `payfire-backend` Web Service.
5. Click **Apply**.

---

### Method B: Manual Web Service Setup

1. In Render Dashboard, select **New +** → **Web Service**.
2. Select repository `PayFire`.
3. Configure settings:
   - **Name**: `payfire-backend`
   - **Region**: Oregon (or closest to your users)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: Free or Starter
4. Expand **Advanced Settings**:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes

---

## 3. Environment Variables Configuration

Set these in the **Environment** tab of your Render Web Service:

| Environment Variable | Required | Default / Recommended Value | Description |
|---|:---:|---|---|
| `PYTHON_VERSION` | Yes | `3.11.9` | Ensures stable Linux wheel compilation |
| `ENVIRONMENT` | Yes | `production` | Production environment tag |
| `DEBUG` | Yes | `false` | Disables debug logs |
| `DATABASE_URL` | Optional | `sqlite:///./payfire.db` | PostgreSQL URL or local SQLite |
| `RAZORPAY_KEY_ID` | Optional | *(Empty for Synthetic)* | Live test key for Razorpay API |
| `RAZORPAY_KEY_SECRET` | Optional | *(Empty for Synthetic)* | Secret key for Razorpay API |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | *(Empty for Synthetic)* | Webhook secret verification |
| `GEMINI_API_KEY` | Optional | *(Empty for Fallback)* | Gemini AI Reasoning Key |
| `OPENAI_API_KEY` | Optional | *(Empty for Fallback)* | OpenAI GPT Reasoning Key |
| `MAX_RETRY_ATTEMPTS` | No | `3` | Guardrail G1 maximum retry cap |
| `HIGH_VALUE_THRESHOLD_INR` | No | `10000.0` | Guardrail G2 supervisor sign-off threshold |
| `CONFIDENCE_THRESHOLD` | No | `0.75` | Guardrail G6 autonomous action threshold |
| `RETRY_COOLDOWN_SECONDS` | No | `60` | Guardrail G5 retry cooldown interval |

> **Note on Zero-Config Fallbacks**:  
> If `RAZORPAY_KEY_ID`, `GEMINI_API_KEY`, or `DATABASE_URL` are not provided, PayFire automatically switches to its deterministic synthetic simulation and mathematical reasoning engines.

---

## 4. Database Setup (Optional PostgreSQL)

If you wish to use managed PostgreSQL instead of SQLite:
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Name it `payfire-db` and select the Free tier.
3. Copy the **Internal Database URL** (e.g., `postgres://user:pass@dpg-xxx/payfire`).
4. Set `DATABASE_URL` in your Web Service environment.
5. PayFire automatically handles `postgres://` to `postgresql://` conversion for SQLAlchemy 2.0.

---

## 5. Post-Deployment Verification

Once Render displays **Live**, verify using `curl` or browser:

```bash
# 1. Check health endpoint (should return 200 OK)
curl https://<your-render-app>.onrender.com/api/health

# Expected response:
# {
#   "status": "healthy",
#   "app_name": "PayFire",
#   "version": "1.0.0",
#   "environment": "production",
#   "safety_guardrails_active": 8
# }

# 2. Check Swagger API Documentation
https://<your-render-app>.onrender.com/docs
```
