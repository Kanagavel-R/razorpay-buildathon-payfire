"""Payment Chaos Engine for PayFire.

Allows merchants to intentionally inject controlled payment failures into the
synthetic payment environment and observe the financial and operational impact.

Supported Scenarios:
1. UPI DEGRADATION (failure rate increase, latency increase, configurable duration)
2. BANK OUTAGE (select bank route, fail or redirect transactions)
3. PAYMENT TIMEOUT (processing latency inflation, timeout probability)
4. WEBHOOK DELAY (delay webhook delivery events)
5. TRAFFIC SPIKE (traffic multiplier e.g. 2x, 5x, 10x)
6. CARD DECLINE SPIKE (card issuer authorization declines)
7. CUSTOM CHAOS (user-defined method, bank, severity, latency, duration)

Strict Safety:
- Chaos ONLY operates against synthetic and simulation environments.
- Live production execution is strictly blocked.
"""

import copy
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

from app.core.generator import SyntheticTransaction, PaymentStreamGenerator
from app.schemas.chaos import (
    ChaosScenario,
    ScenarioStatus,
    ChaosType,
    BeforeAfterAnalysis,
    TelemetrySnapshot,
    ChaosTimelineEvent,
)
from app.config import settings


class ChaosSafetyViolation(Exception):
    """Raised when chaos injection violates safety guardrails."""
    pass


class ChaosEngine:
    """Manages preset and custom chaos scenarios, applies parametric perturbations, and generates before/after impact analytics."""

    # 7 Supported Standard Scenarios + Predefined Flash Sale Demo
    PRESET_SCENARIOS: Dict[str, ChaosScenario] = {
        # Predefined Hackathon Demo Scenario
        "flash_sale_upi_degrade": ChaosScenario(
            id="flash_sale_upi_degrade",
            name="FLASH SALE — UPI DEGRADATION",
            type="upi_degradation",
            description="Flash sale high-concurrency surge (5x) combined with a 15% UPI acquiring degradation on Bank A due to NPCI switch throttling.",
            affected_payment_method="UPI",
            affected_bank="Bank A",
            failure_percentage=0.15,
            latency_increase_ms=3800.0,
            traffic_multiplier=5.0,
            duration_minutes=10,
            webhook_delay_seconds=45,
            parameters={"expected_transactions": 100000, "expected_gmv": 20000000.0},
            status=ScenarioStatus.READY,
        ),
        # 1. UPI Degradation
        "upi_degradation": ChaosScenario(
            id="upi_degradation",
            name="UPI Route Degradation",
            type="upi_degradation",
            description="UPI acquiring route degradation concentrated in Bank A acquiring channel due to NPCI switch throttling.",
            affected_payment_method="UPI",
            affected_bank="Bank A",
            failure_percentage=0.20,
            latency_increase_ms=3500.0,
            traffic_multiplier=1.5,
            duration_minutes=15,
            webhook_delay_seconds=30,
            status=ScenarioStatus.READY,
        ),
        # 2. Bank Outage
        "bank_outage": ChaosScenario(
            id="bank_outage",
            name="Bank B Complete Gateway Outage",
            type="bank_outage",
            description="Total core-banking API breakdown on Bank B route causing 92% decline rates across all affected transactions.",
            affected_payment_method="All",
            affected_bank="Bank B",
            failure_percentage=0.92,
            latency_increase_ms=5000.0,
            traffic_multiplier=1.2,
            duration_minutes=30,
            webhook_delay_seconds=180,
            status=ScenarioStatus.READY,
        ),
        # 3. Payment Timeout
        "payment_timeout": ChaosScenario(
            id="payment_timeout",
            name="Payment Gateway Processing Timeout",
            type="payment_timeout",
            description="Acquiring gateway switch encounters severe queue saturation, resulting in 4,500ms latency spikes and frequent timeouts.",
            affected_payment_method="All",
            affected_bank="Bank A",
            failure_percentage=0.30,
            latency_increase_ms=4500.0,
            traffic_multiplier=2.0,
            duration_minutes=20,
            webhook_delay_seconds=60,
            status=ScenarioStatus.READY,
        ),
        # 4. Webhook Delay
        "webhook_delay": ChaosScenario(
            id="webhook_delay",
            name="Payment Webhook Ingestion Stall",
            type="webhook_delay",
            description="Upstream gateway webhook dispatch pipeline stalls by 4 minutes, causing order status desynchronization and customer drop-off.",
            affected_payment_method="All",
            affected_bank="Gateway Direct",
            failure_percentage=0.15,
            latency_increase_ms=1200.0,
            traffic_multiplier=1.5,
            duration_minutes=15,
            webhook_delay_seconds=240,
            status=ScenarioStatus.READY,
        ),
        # 5. Traffic Spike
        "traffic_spike": ChaosScenario(
            id="traffic_spike",
            name="Flash Sale Traffic Spike (5x)",
            type="traffic_spike",
            description="Flash sale volume surges 5x, causing queue saturation, 2,500ms queuing latency inflation, and intermittent gateway backpressure.",
            affected_payment_method="All",
            affected_bank="Gateway Direct",
            failure_percentage=0.18,
            latency_increase_ms=2500.0,
            traffic_multiplier=5.0,
            duration_minutes=30,
            webhook_delay_seconds=90,
            status=ScenarioStatus.READY,
        ),
        # 6. Card Decline Spike
        "card_decline_spike": ChaosScenario(
            id="card_decline_spike",
            name="3D Secure / Card OTP Decline Spike",
            type="card_decline_spike",
            description="Card issuer ACS servers fail to deliver 2FA SMS/push authentications, causing a 35% decline spike in credit/debit card checkouts.",
            affected_payment_method="Cards",
            affected_bank="Bank C",
            failure_percentage=0.35,
            latency_increase_ms=4200.0,
            traffic_multiplier=1.0,
            duration_minutes=25,
            webhook_delay_seconds=10,
            status=ScenarioStatus.READY,
        ),
        # Backward-compatible alias for card otp timeout
        "card_otp_timeout": ChaosScenario(
            id="card_otp_timeout",
            name="3D Secure / OTP Verification Timeout",
            type="card_decline_spike",
            description="Issuer ACS servers fail to deliver 2FA SMS/push authentications, causing a 35% drop in credit/debit card completion.",
            affected_payment_method="Cards",
            affected_bank="Bank C",
            failure_percentage=0.35,
            latency_increase_ms=4200.0,
            traffic_multiplier=1.0,
            duration_minutes=25,
            webhook_delay_seconds=10,
            status=ScenarioStatus.READY,
        ),
    }

    def __init__(self, seed: int = 42, merchant_expected_gmv: float = 20000000.0):
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        self.merchant_expected_gmv = merchant_expected_gmv
        self.custom_scenarios: Dict[str, ChaosScenario] = {}

    def get_scenario(self, scenario_id: str) -> Optional[ChaosScenario]:
        return self.custom_scenarios.get(scenario_id) or self.PRESET_SCENARIOS.get(scenario_id)

    def list_scenarios(self) -> List[ChaosScenario]:
        merged = {**self.PRESET_SCENARIOS, **self.custom_scenarios}
        return list(merged.values())

    def register_custom_scenario(self, scenario: ChaosScenario) -> ChaosScenario:
        """Validates and registers a custom user-configured chaos scenario."""
        self._validate_scenario(scenario)
        self.custom_scenarios[scenario.id] = scenario
        return scenario

    def _validate_scenario(self, scenario: ChaosScenario) -> None:
        """Validates scenario parameters and enforces safety guardrails."""
        if not (0.0 <= scenario.failure_percentage <= 1.0):
            raise ValueError(f"failure_percentage must be between 0.0 and 1.0, got {scenario.failure_percentage}")
        if scenario.duration_minutes < 1 or scenario.duration_minutes > 180:
            raise ValueError(f"duration_minutes must be between 1 and 180, got {scenario.duration_minutes}")
        if scenario.traffic_multiplier < 0.1 or scenario.traffic_multiplier > 20.0:
            raise ValueError(f"traffic_multiplier must be between 0.1 and 20.0, got {scenario.traffic_multiplier}")
        if scenario.latency_increase_ms < 0:
            raise ValueError("latency_increase_ms must be non-negative")

    def validate_safety_environment(self, environment: str) -> None:
        """Enforces Section 9 Safety Rule: Chaos must NEVER target live production payments."""
        env_lower = environment.lower().strip()
        if env_lower in ["live", "production", "prod"]:
            raise ChaosSafetyViolation(
                "SAFETY VIOLATION: Chaos injection is strictly forbidden against live/production environments. "
                "Chaos operations are only permitted in 'sandbox' or 'simulation' mode."
            )

    def apply_chaos(
        self,
        transactions: List[SyntheticTransaction],
        scenario: ChaosScenario,
        severity_override: Optional[float] = None,
        traffic_multiplier_override: Optional[float] = None,
    ) -> Tuple[List[SyntheticTransaction], Dict[str, Any]]:
        """Applies parametric chaos perturbations to a baseline transaction stream."""
        self._validate_scenario(scenario)

        severity = severity_override if severity_override is not None else scenario.failure_percentage
        traffic_mult = traffic_multiplier_override if traffic_multiplier_override is not None else scenario.traffic_multiplier
        perturbed: List[SyntheticTransaction] = []

        total_txns = len(transactions)
        affected_count = 0
        failed_count = 0
        failed_gmv = 0.0
        total_latency = 0.0
        affected_customers = set()

        for tx_original in transactions:
            tx = copy.deepcopy(tx_original)

            matches_method = (
                scenario.affected_payment_method == "All"
                or tx.payment_method == scenario.affected_payment_method
            )
            matches_bank = (
                scenario.affected_bank == "Gateway Direct"
                or tx.bank == scenario.affected_bank
            )

            if matches_method and matches_bank:
                affected_count += 1
                affected_customers.add(tx.customer_id)

                # Inject latency spike
                tx.latency_ms += float(scenario.latency_increase_ms * (0.8 + 0.4 * self.rng.rand()))

                # Traffic multiplier latency queue penalty
                if traffic_mult > 1.0:
                    tx.latency_ms += float(150.0 * (traffic_mult - 1.0) * self.rng.rand())

                # Inject failure probability
                if self.rng.rand() < severity:
                    tx.status = "failed"
                    tx.is_soft_failure = True
                    tx.failure_code = f"CHAOS_{scenario.type.upper()}"
                    tx.failure_reason = (
                        f"Chaos scenario '{scenario.name}' degraded route {tx.bank} [{tx.payment_method}]: "
                        f"latency exceeded threshold."
                    )

            if tx.status == "failed":
                failed_count += 1
                failed_gmv += tx.amount_inr

            total_latency += tx.latency_ms
            perturbed.append(tx)

        success_rate = (total_txns - failed_count) / max(1, total_txns)
        failure_rate = failed_count / max(1, total_txns)
        avg_latency = total_latency / max(1, total_txns)

        # Exact Deterministic Revenue at Risk Formula:
        # Revenue at Risk = Merchant Expected GMV * (Failed Sample GMV / Total Sample GMV)
        sample_total_gmv = sum(t.amount_inr for t in transactions)
        sample_failure_ratio = failed_gmv / max(1.0, sample_total_gmv)
        scaled_revenue_at_risk = round(self.merchant_expected_gmv * sample_failure_ratio, 2)

        metrics = {
            "total_transactions": total_txns,
            "successful_transactions": total_txns - failed_count,
            "failed_transactions": failed_count,
            "sample_total_gmv": round(sample_total_gmv, 2),
            "sample_failed_gmv": round(failed_gmv, 2),
            "scaled_revenue_at_risk": scaled_revenue_at_risk,
            "success_rate": round(success_rate, 4),
            "failure_rate": round(failure_rate, 4),
            "avg_latency_ms": round(avg_latency, 1),
            "affected_transactions": affected_count,
            "affected_customers": len(affected_customers),
        }

        return perturbed, metrics

    def compute_before_after_analysis(
        self,
        baseline_txns: List[SyntheticTransaction],
        degraded_txns: List[SyntheticTransaction],
    ) -> BeforeAfterAnalysis:
        """Section 5: Computes Before Chaos vs. After Chaos telemetry and deltas."""
        # Before Chaos (Nominal)
        b_total = len(baseline_txns)
        b_failed = sum(1 for t in baseline_txns if t.status == "failed")
        b_succ = b_total - b_failed
        b_sample_gmv = sum(t.amount_inr for t in baseline_txns)
        b_failed_gmv = sum(t.amount_inr for t in baseline_txns if t.status == "failed")
        b_lat = float(np.mean([t.latency_ms for t in baseline_txns])) if baseline_txns else 0.0

        before = TelemetrySnapshot(
            transaction_volume=b_total,
            success_rate=round(b_succ / max(1, b_total), 4),
            failure_rate=round(b_failed / max(1, b_total), 4),
            total_gmv_inr=self.merchant_expected_gmv,
            failed_gmv_inr=round(b_failed_gmv, 2),
            average_latency_ms=round(b_lat, 1),
            revenue_at_risk_inr=round(self.merchant_expected_gmv * (b_failed_gmv / max(1.0, b_sample_gmv)), 2),
            affected_transactions=0,
            affected_customers=0,
        )

        # After Chaos (Degraded)
        a_total = len(degraded_txns)
        a_failed = sum(1 for t in degraded_txns if t.status == "failed")
        a_succ = a_total - a_failed
        a_sample_gmv = sum(t.amount_inr for t in degraded_txns)
        a_failed_gmv = sum(t.amount_inr for t in degraded_txns if t.status == "failed")
        a_lat = float(np.mean([t.latency_ms for t in degraded_txns])) if degraded_txns else 0.0
        a_aff_tx = sum(1 for b, a in zip(baseline_txns, degraded_txns) if b.status != a.status or a.latency_ms > b.latency_ms + 500)
        a_aff_cust = len({t.customer_id for t in degraded_txns if t.status == "failed"})
        a_rev_risk = round(self.merchant_expected_gmv * (a_failed_gmv / max(1.0, a_sample_gmv)), 2)

        after = TelemetrySnapshot(
            transaction_volume=a_total,
            success_rate=round(a_succ / max(1, a_total), 4),
            failure_rate=round(a_failed / max(1, a_total), 4),
            total_gmv_inr=self.merchant_expected_gmv,
            failed_gmv_inr=round(a_failed_gmv, 2),
            average_latency_ms=round(a_lat, 1),
            revenue_at_risk_inr=a_rev_risk,
            affected_transactions=a_aff_tx,
            affected_customers=a_aff_cust,
        )

        # Deltas
        delta = {
            "success_rate_drop": round(before.success_rate - after.success_rate, 4),
            "failure_rate_increase": round(after.failure_rate - before.failure_rate, 4),
            "latency_increase_ms": round(after.average_latency_ms - before.average_latency_ms, 1),
            "failed_gmv_increase_inr": round(after.failed_gmv_inr - before.failed_gmv_inr, 2),
            "revenue_at_risk_inr": a_rev_risk,
            "volume_delta": a_total - b_total,
        }

        return BeforeAfterAnalysis(
            before_chaos=before,
            after_chaos=after,
            delta=delta,
        )

    def generate_chaos_timeline(
        self,
        scenario: ChaosScenario,
        metrics: Dict[str, Any],
        base_time: Optional[datetime] = None,
    ) -> List[ChaosTimelineEvent]:
        """Section 6: Creates an immutable event timeline tracking the life of a chaos incident."""
        now = base_time or datetime.now(timezone.utc)

        return [
            ChaosTimelineEvent(
                state="NORMAL",
                timestamp=(now - timedelta(minutes=4)).isoformat(),
                description="Payment network operating nominally (98.5% success rate, 820ms average latency).",
                details={"status": "healthy", "baseline_success_rate": 0.985},
            ),
            ChaosTimelineEvent(
                state="CHAOS_INJECTED",
                timestamp=(now - timedelta(minutes=3)).isoformat(),
                description=f"Chaos scenario '{scenario.name}' injected targeting route {scenario.affected_bank} [{scenario.affected_payment_method}].",
                details={"scenario_id": scenario.id, "severity": scenario.failure_percentage},
            ),
            ChaosTimelineEvent(
                state="DEGRADATION_DETECTED",
                timestamp=(now - timedelta(minutes=2)).isoformat(),
                description=f"Telemetry anomaly detected: Success rate fell to {metrics['success_rate']*100:.1f}%; average latency spiked to {metrics['avg_latency_ms']:.0f}ms.",
                details={"current_success_rate": metrics["success_rate"], "avg_latency_ms": metrics["avg_latency_ms"]},
            ),
            ChaosTimelineEvent(
                state="IMPACT_CALCULATED",
                timestamp=(now - timedelta(minutes=1)).isoformat(),
                description=f"Revenue at Risk calculated deterministically at INR {metrics['scaled_revenue_at_risk']:,.2f} across {metrics['affected_transactions']} affected transactions.",
                details={"revenue_at_risk_inr": metrics["scaled_revenue_at_risk"], "failed_transactions": metrics["failed_transactions"]},
            ),
            ChaosTimelineEvent(
                state="SIMULATION_COMPLETED",
                timestamp=now.isoformat(),
                description="Synthetic chaos simulation completed. System ready for AI RCA and counterfactual recovery simulation.",
                details={"status": "degraded", "simulation_classification": "SIMULATED SCENARIO"},
            ),
        ]
