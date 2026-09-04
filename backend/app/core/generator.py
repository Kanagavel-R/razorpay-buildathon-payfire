"""Synthetic payment telemetry and stream generator for PayFire.

Generates realistic, seeded distributions for:
- Customers (customer_id, customer_segment)
- Transactions & Orders (id, order_id, status, amount_inr)
- Payment methods (UPI, Cards, NetBanking, Wallets)
- Acquiring bank routes (Bank A, Bank B, Bank C, Bank D)
- Success / failure status and realistic failure reasons
- Latency and retry counts
- Timestamps
- Normal baseline latency and error rates
"""

import time
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class SyntheticTransaction:
    id: str
    order_id: str
    customer_id: str
    customer_segment: str  # VIP, Returning, New
    amount_inr: float
    payment_method: str    # UPI, Cards, NetBanking, Wallets
    bank: str              # Bank A (HDFC), Bank B (ICICI), Bank C (SBI), Bank D (Axis)
    is_high_value: bool
    status: str            # captured, failed, pending
    latency_ms: float
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    is_soft_failure: bool = False
    retry_count: int = 0
    timestamp: float = 0.0          # Unix epoch seconds
    created_at_iso: str = ""        # ISO 8601 string


class PaymentStreamGenerator:
    """Generates synthetic high-volume transaction batches with deterministic reproducibility."""

    PAYMENT_METHODS = ["UPI", "Cards", "NetBanking", "Wallets"]
    METHOD_WEIGHTS = [0.60, 0.25, 0.10, 0.05]

    BANKS = ["Bank A", "Bank B", "Bank C", "Bank D"]
    BANK_WEIGHTS = [0.35, 0.30, 0.25, 0.10]

    CUSTOMER_SEGMENTS = ["New", "Returning", "VIP"]
    SEGMENT_WEIGHTS = [0.45, 0.45, 0.10]

    # Baseline healthy performance profiles
    BASE_LATENCY_PARAMS = {
        "UPI": (800, 150),         # mean_ms, std_ms
        "Cards": (1800, 300),
        "NetBanking": (3200, 500),
        "Wallets": (900, 180),
    }

    BASE_SUCCESS_RATES = {
        "UPI": 0.985,
        "Cards": 0.965,
        "NetBanking": 0.940,
        "Wallets": 0.980,
    }

    def __init__(self, seed: int = 42, base_timestamp: Optional[float] = None):
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        self.base_timestamp = base_timestamp or 1772688000.0  # Fixed reproducible reference epoch (2026-03-05)

    def generate_batch(self, count: int = 1000) -> List[SyntheticTransaction]:
        """Generates a synthetic transaction batch adhering to realistic distribution curves."""
        methods = self.rng.choice(self.PAYMENT_METHODS, size=count, p=self.METHOD_WEIGHTS)
        banks = self.rng.choice(self.BANKS, size=count, p=self.BANK_WEIGHTS)
        segments = self.rng.choice(self.CUSTOMER_SEGMENTS, size=count, p=self.SEGMENT_WEIGHTS)

        # Lognormal transaction amounts: median ~₹800, mean ~₹2,000, clip [50, 50000]
        raw_amounts = self.rng.lognormal(mean=6.7, sigma=1.0, size=count)
        amounts = np.clip(raw_amounts, 50.0, 50000.0)

        # Inter-arrival times (Poisson process / exponential inter-arrival)
        inter_arrivals = self.rng.exponential(scale=0.05, size=count)  # ~20 txns/sec
        cumulative_time = np.cumsum(inter_arrivals)

        transactions = []
        for i in range(count):
            method = methods[i]
            bank = banks[i]
            segment = segments[i]
            amount = float(amounts[i])
            if segment == "VIP":
                amount = min(50000.0, amount * 2.2)

            amount = round(amount, 2)
            is_high_val = amount >= 10000.0

            # Baseline latency
            mean_lat, std_lat = self.BASE_LATENCY_PARAMS[method]
            latency = float(max(150.0, self.rng.normal(mean_lat, std_lat)))

            # Baseline success check
            base_success = self.BASE_SUCCESS_RATES[method]
            is_success = self.rng.rand() < base_success

            status = "captured" if is_success else "failed"
            failure_code = None
            failure_reason = None
            is_soft = False

            if not is_success:
                # 80% of baseline failures are soft (timeout, network flake)
                if self.rng.rand() < 0.80:
                    is_soft = True
                    failure_code = "GATEWAY_TIMEOUT"
                    failure_reason = "Payment gateway response timed out after 5000ms"
                else:
                    is_soft = False
                    failure_code = "INSUFFICIENT_FUNDS"
                    failure_reason = "Customer account has insufficient funds"

            tx_timestamp = self.base_timestamp + float(cumulative_time[i])
            iso_timestamp = datetime.fromtimestamp(tx_timestamp, tz=timezone.utc).isoformat()

            tx = SyntheticTransaction(
                id=f"pay_{self.seed}_{i:05d}",
                order_id=f"order_{self.seed}_{i:05d}",
                customer_id=f"cust_{self.rng.randint(10000, 99999)}",
                customer_segment=segment,
                amount_inr=amount,
                payment_method=method,
                bank=bank,
                is_high_value=is_high_val,
                status=status,
                latency_ms=round(latency, 1),
                failure_code=failure_code,
                failure_reason=failure_reason,
                is_soft_failure=is_soft,
                retry_count=0,
                timestamp=round(tx_timestamp, 3),
                created_at_iso=iso_timestamp,
            )
            transactions.append(tx)

        return transactions

    def to_dataframe(self, transactions: List[SyntheticTransaction]) -> pd.DataFrame:
        """Converts transaction list to Pandas DataFrame."""
        return pd.DataFrame([asdict(tx) for tx in transactions])
