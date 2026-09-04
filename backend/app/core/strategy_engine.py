"""Recovery Strategy Formulation Engine.

Generates structured multi-vector recovery strategies based on incident RCA and merchant risk profiles.
Supports:
- no_action (Baseline benchmark: What happens if we do nothing?)
- immediate_retry (Immediate Gateway Auto-Retry)
- exponential_backoff (Exponential Backoff & Jitter Cooldown)
- dynamic_reroute (Smart Dynamic Route Rerouting)
- payment_link (Payment Link Recovery & VIP Escalation)
- human_escalation (Manual PayOps Intervention)
"""

from typing import List
from app.schemas.strategy import StrategyItem
from app.schemas.rca import RcaResult


class RecoveryStrategist:
    """Formulates diverse mitigation and recovery strategies for degraded payment routes."""

    @staticmethod
    def generate_strategies(incident_id: str, rca: RcaResult) -> List[StrategyItem]:
        """Generates candidate recovery strategies with structured parameters, stopping conditions, and assumptions."""
        rev_risk = rca.revenue_at_risk_inr
        affected_txns = rca.affected_volume

        # Strategy 0: Baseline - No Action
        strat_0 = StrategyItem(
            id=f"strat_{incident_id}_no_action",
            incident_id=incident_id,
            name="Baseline (No Intervention)",
            strategy_code="no_action",
            description="Maintains current routing configuration without intervening. Establishes the unmitigated financial loss ceiling.",
            action_type="NO_ACTION",
            expected_recovery_rate=0.0,
            expected_recovered_gmv=0.0,
            risk_level="extreme",
            risk_score=1.0,
            latency_impact_ms=0.0,
            customer_friction="high",
            safety_approved=True,
            requires_human_approval=False,
            human_approved=True,
            executed=False,
            expected_benefit="Establishes counterfactual baseline benchmark for financial comparison.",
            assumptions=[
                "Payment failure rate will persist throughout the incident duration.",
                "Customer checkout retry abandonment follows standard e-commerce decay.",
            ],
            affected_transactions=affected_txns,
            stopping_conditions=["Manual incident override by PayOps."],
            confidence=1.0,
        )

        # Strategy 1: Immediate Auto-Retry
        strat_1 = StrategyItem(
            id=f"strat_{incident_id}_imm",
            incident_id=incident_id,
            name="Immediate Gateway Auto-Retry",
            strategy_code="immediate_retry",
            description="Re-submits failed transactions immediately across the identical acquiring channel without backoff.",
            action_type="RETRY_IMMEDIATE",
            expected_recovery_rate=0.35,
            expected_recovered_gmv=round(rev_risk * 0.35, 2),
            risk_level="high",
            risk_score=0.82,
            latency_impact_ms=800.0,
            customer_friction="low",
            safety_approved=False,  # Fails duplicate debit protection rule
            requires_human_approval=False,
            human_approved=False,
            executed=False,
            expected_benefit=f"Recovers ~35% of transient failure volume (estimated INR {round(rev_risk * 0.35, 2):,.2f}).",
            assumptions=[
                "Failure was caused by a transient network blip.",
                "Bank acquiring switch will not reject rapid bursts from the same merchant ID.",
            ],
            affected_transactions=affected_txns,
            stopping_conditions=[
                "Duplicate debit risk detected.",
                "Secondary failure rate exceeds 40%.",
            ],
            confidence=0.65,
        )

        # Strategy 2: Exponential Backoff with Jitter
        strat_2 = StrategyItem(
            id=f"strat_{incident_id}_backoff",
            incident_id=incident_id,
            name="Exponential Backoff & Cooldown",
            strategy_code="exponential_backoff",
            description="Queues failed requests with 5s and 15s exponential backoff intervals with random jitter to relieve gateway pressure.",
            action_type="RETRY_BACKOFF",
            expected_recovery_rate=0.62,
            expected_recovered_gmv=round(rev_risk * 0.62, 2),
            risk_level="medium",
            risk_score=0.35,
            latency_impact_ms=12000.0,
            customer_friction="medium",
            safety_approved=True,
            requires_human_approval=False,
            human_approved=False,
            executed=False,
            expected_benefit=f"Recovers ~62% of failed volume (estimated INR {round(rev_risk * 0.62, 2):,.2f}) while damping upstream queue stampedes.",
            assumptions=[
                "Bank switch recovers within 15 to 30 seconds.",
                "Customers tolerate up to 15 seconds of asynchronous retry feedback.",
            ],
            affected_transactions=affected_txns,
            stopping_conditions=[
                "Retry attempts exceed configured limit of 3.",
                "Queue wait exceeds 30,000ms SLA.",
            ],
            confidence=0.80,
        )

        # Strategy 3: Smart Dynamic Route Rerouting
        strat_3 = StrategyItem(
            id=f"strat_{incident_id}_reroute",
            incident_id=incident_id,
            name="Smart Dynamic Route Rerouting",
            strategy_code="dynamic_reroute",
            description="Automatically reroutes failed and subsequent traffic from degraded Bank A route to healthy secondary bank routes (Bank B / ICICI).",
            action_type="DYNAMIC_REROUTE",
            expected_recovery_rate=0.89,
            expected_recovered_gmv=round(rev_risk * 0.89, 2),
            risk_level="low",
            risk_score=0.12,
            latency_impact_ms=1400.0,
            customer_friction="low",
            safety_approved=True,
            requires_human_approval=True,  # Because high-value transactions > INR 10,000 exist in batch
            human_approved=False,
            executed=False,
            expected_benefit=f"Recovers ~89% of impacted revenue (estimated INR {round(rev_risk * 0.89, 2):,.2f}) by bypassing saturated switch entirely.",
            assumptions=[
                "Secondary acquirers (Bank B / ICICI) maintain healthy success rates (> 97%).",
                "Secondary routing capacity can absorb 5x flash traffic spike.",
            ],
            affected_transactions=affected_txns,
            stopping_conditions=[
                "Secondary route failure rate exceeds 15%.",
                "Acquirer MDR cost variance exceeds budget limits.",
            ],
            confidence=0.92,
        )

        # Strategy 4: Payment Link Recovery & VIP Escalation
        strat_4 = StrategyItem(
            id=f"strat_{incident_id}_link",
            incident_id=incident_id,
            name="Payment Link & VIP Escalation",
            strategy_code="payment_link",
            description="Generates authenticated single-use payment links sent via SMS/WhatsApp with priority human operator routing for high-value orders.",
            action_type="PAYMENT_LINK",
            expected_recovery_rate=0.74,
            expected_recovered_gmv=round(rev_risk * 0.74, 2),
            risk_level="low",
            risk_score=0.08,
            latency_impact_ms=350.0,
            customer_friction="low",
            safety_approved=True,
            requires_human_approval=False,
            human_approved=False,
            executed=False,
            expected_benefit=f"Protects high-value customer carts (estimated INR {round(rev_risk * 0.74, 2):,.2f}) with asynchronous omnichannel checkout.",
            assumptions=[
                "Customers check notification channels within 10 minutes of drop-off.",
                "Payment links expire safely after 15 minutes to prevent stale order fulfillment.",
            ],
            affected_transactions=min(affected_txns, int(affected_txns * 0.4)),
            stopping_conditions=[
                "Customer opt-out received.",
                "Order inventory holds expire.",
            ],
            confidence=0.88,
        )

        # Strategy 5: Human Escalation / PayOps Circuit Breaker
        strat_5 = StrategyItem(
            id=f"strat_{incident_id}_escalate",
            incident_id=incident_id,
            name="PayOps Circuit Breaker & Human Escalation",
            strategy_code="human_escalation",
            description="Freezes autonomous reroutes, flips checkout ingress into queue mode, and pages on-call payment infrastructure engineering team.",
            action_type="HUMAN_ESCALATION",
            expected_recovery_rate=0.45,
            expected_recovered_gmv=round(rev_risk * 0.45, 2),
            risk_level="low",
            risk_score=0.05,
            latency_impact_ms=45000.0,
            customer_friction="high",
            safety_approved=True,
            requires_human_approval=True,
            human_approved=False,
            executed=False,
            expected_benefit=f"Guarantees 100% human oversight for high-risk systemic failures (recovers estimated INR {round(rev_risk * 0.45, 2):,.2f}).",
            assumptions=[
                "On-call engineers acknowledge PagerDuty within 3 minutes.",
                "Merchant accepts checkout queue slowdown to prevent double debits.",
            ],
            affected_transactions=affected_txns,
            stopping_conditions=[
                "On-call engineer takes operational command.",
                "Bank switch publishes resolution notice.",
            ],
            confidence=0.95,
        )

        return [strat_0, strat_1, strat_2, strat_3, strat_4, strat_5]
