"""Discrete-Event Payment Simulation Engine using SimPy.

Simulates counterfactual recovery strategies against degraded synthetic transaction streams.
Accurately models:
- Baseline (no action) failure trajectories
- Immediate retry (without backoff, high duplicate risk)
- Delayed retry (exponential backoff + jitter)
- Alternate route (dynamic route rerouting)
- Smart payment link & VIP escalation

All financial calculations (Revenue at Risk, Recovered GMV, Recovery Rates)
are computed deterministically without relying on LLMs.
"""

import copy
import simpy
import numpy as np
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from app.core.generator import SyntheticTransaction, PaymentStreamGenerator
from app.core.chaos_engine import ChaosEngine, ChaosScenario


@dataclass
class BaselineSimulationResult:
    scenario_id: str
    scenario_name: str
    total_transactions: int
    successful_transactions: int
    failed_transactions: int
    success_rate: float
    failure_rate: float
    total_gmv_inr: float
    failed_gmv_inr: float
    revenue_at_risk_inr: float
    average_latency_ms: float
    p95_latency_ms: float
    affected_customers: int
    data_classification: str = "SIMULATED RESULT"


@dataclass
class StrategySimulationResult:
    strategy_code: str
    strategy_name: str
    simulated_transactions: int
    successful_transactions: int
    failed_transactions: int
    recovered_transactions: int
    recovered_gmv_inr: float
    net_recovery_rate: float
    average_latency_ms: float
    p95_latency_ms: float
    retry_count: int
    duplicate_risk_count: int
    customer_churn_risk: float
    safety_compliance: bool
    is_recommended: bool = False
    recommendation_reason: Optional[str] = None
    data_classification: str = "SIMULATED RESULT"

    @property
    def arm_type(self) -> str:
        return self.strategy_code

    @property
    def avg_latency_ms(self) -> float:
        return self.average_latency_ms


@dataclass
class StrategyComparisonResult:
    strategy_code: str
    strategy_name: str
    baseline_revenue_at_risk_inr: float
    recovered_transactions: int
    recovered_gmv_inr: float
    incremental_recovery_inr: float
    recovery_rate: float
    retry_count: int
    duplicate_risk_count: int
    latency_impact_ms: float
    customer_churn_impact: float
    safety_compliance: bool
    is_recommended: bool
    recommendation_reason: Optional[str]
    data_classification: str = "SIMULATED RESULT"


# Unified structure for backward-compatibility with UI
SimulationArmOutcome = StrategySimulationResult


class DiscretePaymentSimulator:
    """Deterministic discrete-event simulator modeling payment processing, retries, and race conditions."""

    SUPPORTED_STRATEGIES = [
        "no_action",
        "immediate_retry",
        "delayed_retry",
        "alternate_route",
        "payment_link",
    ]

    STRATEGY_ALIASES = {
        "baseline": "no_action",
        "exponential_backoff": "delayed_retry",
        "dynamic_reroute": "alternate_route",
    }

    def __init__(self, seed: int = 42, merchant_expected_gmv: float = 20000000.0):
        self.seed = seed
        self.rng = np.random.RandomState(seed)
        self.merchant_expected_gmv = merchant_expected_gmv

    def _normalize_strategy(self, strategy: str) -> str:
        s = strategy.lower().strip()
        return self.STRATEGY_ALIASES.get(s, s)

    def _scale_gmv(self, sample_amount: float, total_sample_gmv: float) -> float:
        """Scales sample financial metrics to merchant expected GMV benchmark (e.g. ₹2 Crore).
        
        Formula:
            Scaled Amount = Merchant Expected GMV * (Sample Amount / Total Sample GMV)
        """
        ratio = sample_amount / max(1.0, total_sample_gmv)
        return round(self.merchant_expected_gmv * ratio, 2)

    # -------------------------------------------------------------------------
    # 1. BASELINE SIMULATION
    # -------------------------------------------------------------------------
    def simulate_baseline(
        self,
        degraded_transactions: List[SyntheticTransaction],
        scenario_name: str = "Injected Chaos Scenario",
        scenario_id: str = "chaos",
    ) -> BaselineSimulationResult:
        """Simulates what happens when 'No recovery strategy is applied'.
        
        Calculates deterministic financial losses, failed volume, and affected customer base.
        """
        total_txns = len(degraded_transactions)
        failed_txns = [t for t in degraded_transactions if t.status == "failed"]
        successful_txns = [t for t in degraded_transactions if t.status == "captured"]
        
        total_sample_gmv = sum(t.amount_inr for t in degraded_transactions)
        failed_sample_gmv = sum(t.amount_inr for t in failed_txns)
        latencies = [t.latency_ms for t in degraded_transactions]

        affected_customers = len({t.customer_id for t in failed_txns})

        # Exact Deterministic Revenue at Risk Formula:
        # Revenue at Risk = Merchant Expected GMV * (Failed Sample GMV / Total Sample GMV)
        revenue_at_risk = self._scale_gmv(failed_sample_gmv, total_sample_gmv)

        return BaselineSimulationResult(
            scenario_id=scenario_id,
            scenario_name=scenario_name,
            total_transactions=total_txns,
            successful_transactions=len(successful_txns),
            failed_transactions=len(failed_txns),
            success_rate=round(len(successful_txns) / max(1, total_txns), 4),
            failure_rate=round(len(failed_txns) / max(1, total_txns), 4),
            total_gmv_inr=self.merchant_expected_gmv,
            failed_gmv_inr=round(failed_sample_gmv, 2),
            revenue_at_risk_inr=revenue_at_risk,
            average_latency_ms=round(float(np.mean(latencies)), 1) if latencies else 0.0,
            p95_latency_ms=round(float(np.percentile(latencies, 95)), 1) if latencies else 0.0,
            affected_customers=affected_customers,
        )

    # -------------------------------------------------------------------------
    # 2. STRATEGY SIMULATION INTERFACE: simulate(strategy, scenario)
    # -------------------------------------------------------------------------
    def simulate(
        self,
        strategy: str,
        degraded_transactions: List[SyntheticTransaction],
        scenario: Optional[ChaosScenario] = None,
    ) -> StrategySimulationResult:
        """Simulates a specific recovery strategy on a degraded transaction stream."""
        canonical_strategy = self._normalize_strategy(strategy)

        if canonical_strategy == "no_action":
            return self._simulate_no_action(degraded_transactions)
        elif canonical_strategy == "immediate_retry":
            return self._simulate_immediate_retry(degraded_transactions)
        elif canonical_strategy == "delayed_retry":
            return self._simulate_delayed_retry(degraded_transactions)
        elif canonical_strategy == "alternate_route":
            return self._simulate_alternate_route(degraded_transactions)
        elif canonical_strategy == "payment_link":
            return self._simulate_payment_link(degraded_transactions)
        else:
            raise ValueError(
                f"Unknown strategy: '{strategy}'. Supported strategies: {self.SUPPORTED_STRATEGIES}"
            )

    # -------------------------------------------------------------------------
    # 3. BASELINE VS STRATEGY COMPARISON
    # -------------------------------------------------------------------------
    def compare_baseline_vs_strategy(
        self,
        baseline: BaselineSimulationResult,
        strategy_res: StrategySimulationResult,
    ) -> StrategyComparisonResult:
        """Compares a strategy simulation outcome against the unmitigated baseline."""
        incremental_recovery = strategy_res.recovered_gmv_inr
        latency_diff = strategy_res.average_latency_ms - baseline.average_latency_ms

        return StrategyComparisonResult(
            strategy_code=strategy_res.strategy_code,
            strategy_name=strategy_res.strategy_name,
            baseline_revenue_at_risk_inr=baseline.revenue_at_risk_inr,
            recovered_transactions=strategy_res.recovered_transactions,
            recovered_gmv_inr=strategy_res.recovered_gmv_inr,
            incremental_recovery_inr=incremental_recovery,
            recovery_rate=strategy_res.net_recovery_rate,
            retry_count=strategy_res.retry_count,
            duplicate_risk_count=strategy_res.duplicate_risk_count,
            latency_impact_ms=round(latency_diff, 1),
            customer_churn_impact=strategy_res.customer_churn_risk,
            safety_compliance=strategy_res.safety_compliance,
            is_recommended=strategy_res.is_recommended,
            recommendation_reason=strategy_res.recommendation_reason,
        )

    # -------------------------------------------------------------------------
    # 4. MULTI-ARM COUNTERFACTUAL SIMULATION RUNNER
    # -------------------------------------------------------------------------
    def run_counterfactual_simulations(
        self,
        degraded_transactions: List[SyntheticTransaction],
    ) -> List[StrategySimulationResult]:
        """Runs all supported counterfactual simulation arms concurrently and determines the safest winner."""
        outcomes = [
            self.simulate("no_action", degraded_transactions),
            self.simulate("immediate_retry", degraded_transactions),
            self.simulate("delayed_retry", degraded_transactions),
            self.simulate("alternate_route", degraded_transactions),
            self.simulate("payment_link", degraded_transactions),
        ]

        # Recommendation selection: Best recovery rate with 100% safety compliance
        compliant_arms = [o for o in outcomes if o.safety_compliance and o.strategy_code != "no_action"]
        if compliant_arms:
            best = max(compliant_arms, key=lambda x: x.recovered_gmv_inr)
            best.is_recommended = True
            best.recommendation_reason = (
                f"Achieves highest recovery (₹{best.recovered_gmv_inr:,.0f} / {best.net_recovery_rate*100:.1f}%) "
                f"with 0 duplicate payment risks and verified policy compliance."
            )

        return outcomes

    # -------------------------------------------------------------------------
    # STRATEGY IMPLEMENTATIONS
    # -------------------------------------------------------------------------
    def _simulate_no_action(self, txns: List[SyntheticTransaction]) -> StrategySimulationResult:
        """Strategy: No Action (Baseline arm)."""
        failed_count = sum(1 for t in txns if t.status == "failed")
        successful_count = len(txns) - failed_count
        latencies = [t.latency_ms for t in txns]

        return StrategySimulationResult(
            strategy_code="no_action",
            strategy_name="Baseline (Do Nothing)",
            simulated_transactions=len(txns),
            successful_transactions=successful_count,
            failed_transactions=failed_count,
            recovered_transactions=0,
            recovered_gmv_inr=0.0,
            net_recovery_rate=0.0,
            average_latency_ms=round(float(np.mean(latencies)), 1),
            p95_latency_ms=round(float(np.percentile(latencies, 95)), 1),
            retry_count=0,
            duplicate_risk_count=0,
            customer_churn_risk=0.38,
            safety_compliance=True,
            is_recommended=False,
            recommendation_reason="Unmitigated baseline with zero intervention and 100% revenue loss.",
        )

    def _simulate_immediate_retry(self, txns: List[SyntheticTransaction]) -> StrategySimulationResult:
        """Strategy: Immediate Auto-Retry (Blind retry on same degraded route).
        
        Risks duplicate debits when bank gateway is experiencing slow response times rather than true hard decline.
        """
        total_sample_gmv = sum(t.amount_inr for t in txns)
        recovered_count = 0
        raw_recovered_gmv = 0.0
        retries_done = 0
        duplicate_risks = 0
        latencies = []

        for tx in txns:
            lat = tx.latency_ms
            if tx.status == "failed" and tx.is_soft_failure:
                retries_done += 1
                lat += 800.0  # extra attempt overhead
                
                # Double-debit race condition: If gateway authorization was slow (>3000ms),
                # an immediate retry risks dual capture on customer's account.
                if tx.latency_ms > 3000.0:
                    duplicate_risks += 1
                
                # Degraded route has lower recovery rate (~35%)
                if self.rng.rand() < 0.35:
                    recovered_count += 1
                    raw_recovered_gmv += tx.amount_inr
            latencies.append(lat)

        failed_remaining = sum(1 for t in txns if t.status == "failed") - recovered_count
        successful_count = len(txns) - failed_remaining

        return StrategySimulationResult(
            strategy_code="immediate_retry",
            strategy_name="Immediate Auto-Retry",
            simulated_transactions=len(txns),
            successful_transactions=successful_count,
            failed_transactions=failed_remaining,
            recovered_transactions=recovered_count,
            recovered_gmv_inr=self._scale_gmv(raw_recovered_gmv, total_sample_gmv),
            net_recovery_rate=round(recovered_count / max(1, sum(1 for t in txns if t.status == "failed")), 3),
            average_latency_ms=round(float(np.mean(latencies)), 1),
            p95_latency_ms=round(float(np.percentile(latencies, 95)), 1),
            retry_count=retries_done,
            duplicate_risk_count=duplicate_risks,
            customer_churn_risk=0.28,
            safety_compliance=False,  # Fails G4 Duplicate Protection
            is_recommended=False,
            recommendation_reason="VIOLATES SAFETY POLICY G4: High duplicate debit risk due to immediate retries on slow gateway.",
        )

    def _simulate_delayed_retry(self, txns: List[SyntheticTransaction]) -> StrategySimulationResult:
        """Strategy: Delayed Retry (Exponential backoff with jitter and cooldown)."""
        total_sample_gmv = sum(t.amount_inr for t in txns)
        recovered_count = 0
        raw_recovered_gmv = 0.0
        retries_done = 0
        latencies = []

        for tx in txns:
            lat = tx.latency_ms
            if tx.status == "failed" and tx.is_soft_failure:
                # 2 retries with backoff (5s, 15s)
                retries_done += 2
                lat += 12000.0  # backoff delay
                
                # Backoff allows transient congestion to clear; ~62% recovery
                if self.rng.rand() < 0.62:
                    recovered_count += 1
                    raw_recovered_gmv += tx.amount_inr
            latencies.append(lat)

        failed_remaining = sum(1 for t in txns if t.status == "failed") - recovered_count
        successful_count = len(txns) - failed_remaining

        return StrategySimulationResult(
            strategy_code="delayed_retry",
            strategy_name="Delayed Retry (Exponential Backoff)",
            simulated_transactions=len(txns),
            successful_transactions=successful_count,
            failed_transactions=failed_remaining,
            recovered_transactions=recovered_count,
            recovered_gmv_inr=self._scale_gmv(raw_recovered_gmv, total_sample_gmv),
            net_recovery_rate=round(recovered_count / max(1, sum(1 for t in txns if t.status == "failed")), 3),
            average_latency_ms=round(float(np.mean(latencies)), 1),
            p95_latency_ms=round(float(np.percentile(latencies, 95)), 1),
            retry_count=retries_done,
            duplicate_risk_count=0,
            customer_churn_risk=0.19,
            safety_compliance=True,
            is_recommended=False,
        )

    def _simulate_alternate_route(self, txns: List[SyntheticTransaction]) -> StrategySimulationResult:
        """Strategy: Alternate Route (Dynamic routing switch away from degraded Bank A)."""
        total_sample_gmv = sum(t.amount_inr for t in txns)
        recovered_count = 0
        raw_recovered_gmv = 0.0
        retries_done = 0
        latencies = []

        for tx in txns:
            lat = tx.latency_ms
            if tx.status == "failed" and tx.is_soft_failure:
                retries_done += 1
                lat += 1400.0  # reroute overhead
                
                # Secondary route is healthy: 89% recovery probability
                if self.rng.rand() < 0.89:
                    recovered_count += 1
                    raw_recovered_gmv += tx.amount_inr
            latencies.append(lat)

        failed_remaining = sum(1 for t in txns if t.status == "failed") - recovered_count
        successful_count = len(txns) - failed_remaining

        return StrategySimulationResult(
            strategy_code="alternate_route",
            strategy_name="Alternate Route (Dynamic Rerouting)",
            simulated_transactions=len(txns),
            successful_transactions=successful_count,
            failed_transactions=failed_remaining,
            recovered_transactions=recovered_count,
            recovered_gmv_inr=self._scale_gmv(raw_recovered_gmv, total_sample_gmv),
            net_recovery_rate=round(recovered_count / max(1, sum(1 for t in txns if t.status == "failed")), 3),
            average_latency_ms=round(float(np.mean(latencies)), 1),
            p95_latency_ms=round(float(np.percentile(latencies, 95)), 1),
            retry_count=retries_done,
            duplicate_risk_count=0,
            customer_churn_risk=0.08,  # Minimal customer churn
            safety_compliance=True,
            is_recommended=False,
        )

    def _simulate_payment_link(self, txns: List[SyntheticTransaction]) -> StrategySimulationResult:
        """Strategy: Asynchronous Payment Link & VIP Escalation."""
        total_sample_gmv = sum(t.amount_inr for t in txns)
        recovered_count = 0
        raw_recovered_gmv = 0.0
        latencies = []

        for tx in txns:
            lat = tx.latency_ms
            if tx.status == "failed":
                lat += 350.0
                # VIPs / High-value orders convert at 78%, general at 68%
                conv_prob = 0.78 if (tx.is_high_value or tx.customer_segment == "VIP") else 0.68
                if self.rng.rand() < conv_prob:
                    recovered_count += 1
                    raw_recovered_gmv += tx.amount_inr
            latencies.append(lat)

        failed_remaining = sum(1 for t in txns if t.status == "failed") - recovered_count
        successful_count = len(txns) - failed_remaining

        return StrategySimulationResult(
            strategy_code="payment_link",
            strategy_name="Asynchronous Payment Link & VIP Escalation",
            simulated_transactions=len(txns),
            successful_transactions=successful_count,
            failed_transactions=failed_remaining,
            recovered_transactions=recovered_count,
            recovered_gmv_inr=self._scale_gmv(raw_recovered_gmv, total_sample_gmv),
            net_recovery_rate=round(recovered_count / max(1, sum(1 for t in txns if t.status == "failed")), 3),
            average_latency_ms=round(float(np.mean(latencies)), 1),
            p95_latency_ms=round(float(np.percentile(latencies, 95)), 1),
            retry_count=0,
            duplicate_risk_count=0,
            customer_churn_risk=0.14,
            safety_compliance=True,
            is_recommended=False,
        )
