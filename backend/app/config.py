import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "PayFire"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database: SQLite fallback for zero-friction local run, or PostgreSQL
    DATABASE_URL: str = "sqlite:///./payfire.db"

    # Redis: None = In-Memory cache fallback
    REDIS_URL: Optional[str] = None

    # Razorpay Test Mode Credentials (Optional: Synthetic sandbox fallback if empty)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None

    # AI / LLM Configuration (Optional: Deterministic reasoning fallback if empty)
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Safety Guardrail Defaults
    MAX_RETRY_ATTEMPTS: int = 3
    HIGH_VALUE_THRESHOLD_INR: float = 10000.0
    CONFIDENCE_THRESHOLD: float = 0.75
    RETRY_COOLDOWN_SECONDS: int = 60
    SECONDARY_ROUTE_CIRCUIT_BREAKER_FAIL_RATE: float = 0.25

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
