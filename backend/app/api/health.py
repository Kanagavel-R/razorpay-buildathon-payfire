from fastapi import APIRouter
from app.config import settings
from app.core.razorpay_client import razorpay_client

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def get_system_health():
    """Returns overall platform status, execution modes, and active safety rules."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "postgresql" if "postgresql" in settings.DATABASE_URL else "sqlite_local",
        "razorpay_mode": razorpay_client.get_mode(),
        "safety_guardrails_active": 8,
        "max_retry_limit": settings.MAX_RETRY_ATTEMPTS,
        "high_value_threshold_inr": settings.HIGH_VALUE_THRESHOLD_INR,
    }
