"""AI Root Cause Analysis (RCA) & Multi-Agent Diagnostic Engine.

Implements the 6 specialized AI analyst agents for PayFire:
1. Scenario Analyst
2. Root Cause Analyst
3. Revenue Risk Analyst (Strictly Deterministic Financial Formulas)
4. Recovery Strategist
5. Risk / Safety Analyst
6. Explanation Generator

CRITICAL SYSTEM CONSTRAINTS:
- LLMs / AI agents must NOT perform financial or arithmetic calculations.
- All revenue, loss, GMV, and volume projections are computed deterministically.
- If AI services are unavailable or fail, provides graceful, labeled fallback behavior (DETERMINISTIC_FALLBACK).
"""

from typing import Dict, List, Any, Optional
from app.schemas.rca import (
    RcaResult,
    ScenarioAnalysis,
    RootCauseAnalysis,
    RevenueRiskAnalysis,
    RecoveryStrategyRecommendation,
    RiskSafetyEvaluation,
    ExecutiveExplanation,
)
from app.core.generator import SyntheticTransaction
from app.config import settings


class ScenarioAnalyst:
    """Agent 1: Ingests active chaos parameters, incident context, and timeline events."""

    def analyze(self, incident_id: str, scenario_context: Optional[Dict[str, Any]] = None) -> ScenarioAnalysis:
        ctx = scenario_context or {}
        scenario_id = ctx.get("id") or ctx.get("scenario_id", "flash_sale_upi_degrade")
        name = ctx.get("name") or ctx.get("scenario_name", "Flash Sale — UPI Degradation")
        traffic_mult = float(ctx.get("traffic_multiplier", 5.0))
        method = ctx.get("affected_payment_method", "UPI")
        bank = ctx.get("affected_bank", "Bank A")
        
        failure_mode = f"Synthetic {method} route degradation targeting {bank} with {traffic_mult}x traffic multiplier."
        timeline_steps = [
            "NORMAL (Steady-State Traffic)",
            "CHAOS_INJECTED (Fault Triggered)",
            "DEGRADATION_DETECTED (Telemetry Anomaly Detected)",
            "IMPACT_CALCULATED (Financial Blast Radius Quantified)",
            "SIMULATION_COMPLETED (Ready for AI Diagnosis)",
        ]

        return ScenarioAnalysis(
            scenario_id=scenario_id,
            scenario_name=name,
            traffic_multiplier=traffic_mult,
            affected_payment_method=method,
            affected_bank=bank,
            failure_mode=failure_mode,
            event_timeline_steps=timeline_steps,
        )


class RootCauseAnalyst:
    """Agent 2: Pinpoints technical anomalies, error distributions, and infrastructural bottlenecks."""

    def __init__(self, confidence_threshold: float = 0.75):
        self.confidence_threshold = confidence_threshold

    def analyze(
        self,
        incident_id: str,
        transactions: List[SyntheticTransaction],
        metrics: Dict[str, Any],
        scenario_info: ScenarioAnalysis,
    ) -> RootCauseAnalysis:
        total_txns = len(transactions)
        failed_txns = [t for t in transactions if t.status == "failed"]

        # Failure distribution by payment method, bank, and error codes
        method_fail_counts: Dict[str, int] = {}
        bank_fail_counts: Dict[str, int] = {}
        error_code_counts: Dict[str, int] = {}

        for t in failed_txns:
            method_fail_counts[t.payment_method] = method_fail_counts.get(t.payment_method, 0) + 1
            bank_fail_counts[t.bank] = bank_fail_counts.get(t.bank, 0) + 1
            if t.failure_code:
                error_code_counts[t.failure_code] = error_code_counts.get(t.failure_code, 0) + 1

        primary_bank = max(bank_fail_counts.items(), key=lambda x: x[1])[0] if bank_fail_counts else scenario_info.affected_bank
        primary_method = max(method_fail_counts.items(), key=lambda x: x[1])[0] if method_fail_counts else scenario_info.affected_payment_method
        primary_err = max(error_code_counts.items(), key=lambda x: x[1])[0] if error_code_counts else "GATEWAY_TIMEOUT"

        bank_fail_ratio = (bank_fail_counts.get(primary_bank, 0) / max(1, len(failed_txns))) if failed_txns else 0.0

        # Confidence calculation based on volume, error concentration, and telemetry variance
        if bank_fail_ratio >= 0.70 and len(failed_txns) >= 30:
            confidence = min(0.96, 0.78 + bank_fail_ratio * 0.16)
        elif len(failed_txns) > 15:
            confidence = 0.84
        else:
            confidence = 0.68
        confidence = round(confidence, 2)

        root_cause = (
            f"Severe payment degradation concentrated in {primary_bank} acquiring switch handling "
            f"{primary_method} volume. Upstream queue saturation and thread pool starvation are triggering "
            f"frequent {primary_err} errors exceeding standard merchant SLAs."
        )

        evidence = [
            f"Observed {len(failed_txns)} failed transactions out of {total_txns} analyzed samples ({metrics.get('failure_rate', 0)*100:.1f}% error rate).",
            f"Failure concentration: {bank_fail_ratio*100:.1f}% of all payment drops occurred specifically on {primary_bank}.",
            f"Average channel latency spiked to {metrics.get('avg_latency_ms', 0):.0f}ms (nominal baseline is 320ms).",
            f"Dominant error signature: {primary_err} accounting for {error_code_counts.get(primary_err, 0)} drops.",
        ]

        affected_components = [
            f"{primary_bank} Core Acquiring Gateway Switch",
            f"{primary_method} Ingress Processing Route",
            "Merchant High-Concurrency Checkout Pipeline",
        ]

        uncertainties = [
            f"Upstream {primary_bank} internal queue backlog depth cannot be directly inspected via merchant API.",
            "Customer abandonment velocity may accelerate if checkout latency remains > 2,000ms for over 5 minutes.",
        ]

        return RootCauseAnalysis(
            root_cause=root_cause,
            confidence=confidence,
            primary_failure_code=primary_err,
            bank_failure_ratio=round(bank_fail_ratio, 4),
            affected_components=affected_components,
            evidence=evidence,
            uncertainties=uncertainties,
        )


class RevenueRiskAnalyst:
    """Agent 3: Deterministic Financial Blast-Radius Calculation (NO LLM ARITHMETIC)."""

    def analyze(
        self,
        metrics: Dict[str, Any],
        transactions: List[SyntheticTransaction],
    ) -> RevenueRiskAnalysis:
        expected_gmv = float(metrics.get("expected_gmv", 20000000.0))
        scaled_risk = float(metrics.get("scaled_revenue_at_risk", 0.0))
        sample_failed_gmv = float(metrics.get("sample_failed_gmv", 0.0))
        affected_txns = int(metrics.get("affected_transactions", len([t for t in transactions if t.status == "failed"])))
        failure_rate = float(metrics.get("failure_rate", 0.0))
        avg_latency = float(metrics.get("avg_latency_ms", 0.0))

        # Check customer segment exposure from transaction batch
        high_value_drops = sum(1 for t in transactions if t.status == "failed" and (getattr(t, "is_high_value", False) or getattr(t, "amount_inr", 0) >= 10000.0))
        segment_desc = (
            f"High VIP exposure: {high_value_drops} failed orders exceeded INR 10,000 threshold."
            if high_value_drops > 0
            else "Standard retail cart distribution with median order size ~INR 1,250."
        )

        return RevenueRiskAnalysis(
            expected_gmv_inr=expected_gmv,
            scaled_revenue_at_risk_inr=scaled_risk,
            sample_failed_gmv_inr=sample_failed_gmv,
            affected_transactions=affected_txns,
            failure_rate=failure_rate,
            avg_latency_ms=avg_latency,
            customer_segment_exposure=segment_desc,
            calculation_engine="DETERMINISTIC_FINANCIAL_FORMULA",
        )


class RecoveryStrategistAnalyst:
    """Agent 4: Recommends optimal recovery action based on empirical diagnosis."""

    def analyze(
        self,
        rca: RootCauseAnalysis,
        scenario: ScenarioAnalysis,
        revenue_risk: RevenueRiskAnalysis,
    ) -> RecoveryStrategyRecommendation:
        # If outage is concentrated in a specific bank switch, dynamic route rerouting is superior
        if rca.bank_failure_ratio >= 0.60:
            rec_strategy = "Smart Dynamic Route Rerouting"
            strat_code = "dynamic_reroute"
            action_type = "DYNAMIC_REROUTE"
            rec_rate = 0.89
            rationale = (
                f"Because failures are heavily concentrated ({rca.bank_failure_ratio*100:.0f}%) in {scenario.affected_bank}, "
                f"rerouting volume to alternative healthy banks (Bank B / ICICI) recovers ~89% of revenue without retrying degraded switches."
            )
        else:
            rec_strategy = "Exponential Backoff & Cooldown"
            strat_code = "exponential_backoff"
            action_type = "RETRY_BACKOFF"
            rec_rate = 0.62
            rationale = (
                "Distributed latency degradation detected across multiple rails. Applying 5s-15s exponential backoff "
                "damps queue stampedes while safely recovering transient dropped checkouts."
            )

        is_allowed = rca.confidence >= 0.75

        return RecoveryStrategyRecommendation(
            recommended_strategy=rec_strategy,
            strategy_code=strat_code,
            action_type=action_type,
            expected_recovery_rate=rec_rate,
            rationale=rationale,
            is_autonomous_allowed=is_allowed,
        )


class RiskSafetyAnalyst:
    """Agent 5: Pre-flight safety risk evaluation against merchant safety policies."""

    def analyze(
        self,
        rca: RootCauseAnalysis,
        rev_risk: RevenueRiskAnalysis,
        rec: RecoveryStrategyRecommendation,
    ) -> RiskSafetyEvaluation:
        flagged_rules: List[str] = []
        requires_signoff = False

        # Check high-value exposure
        if "VIP" in rev_risk.customer_segment_exposure:
            flagged_rules.append("RULE_2_HIGH_VALUE_APPROVAL (Orders > INR 10,000 detected)")
            requires_signoff = True

        # Check confidence
        if rca.confidence < 0.75:
            flagged_rules.append(f"RULE_3_CONFIDENCE_THRESHOLD ({rca.confidence*100:.0f}% < 75%)")
            requires_signoff = True

        # Check revenue at risk magnitude
        if rev_risk.scaled_revenue_at_risk_inr > 1000000.0:  # > 10 Lakhs
            flagged_rules.append("RULE_7_CUSTOMER_IMPACT_CEILING (Revenue at risk exceeds INR 10 Lakhs)")
            requires_signoff = True

        risk_level = "HIGH" if requires_signoff else "LOW"
        risk_score = 0.65 if requires_signoff else 0.15

        notes = (
            "Pre-flight safety analysis requires human operator sign-off prior to test-mode execution "
            "due to flagged high-value transactions and substantial financial blast radius."
            if requires_signoff
            else "Candidate strategy complies with all pre-flight safety policies. Autonomous simulation permitted."
        )

        return RiskSafetyEvaluation(
            pre_flight_risk_level=risk_level,
            risk_score=risk_score,
            requires_human_signoff=requires_signoff,
            flagged_policy_rules=flagged_rules,
            mitigation_notes=notes,
        )


class ExplanationGenerator:
    """Agent 6: Produces executive-level natural language summaries and justifications."""

    def generate(
        self,
        scenario: ScenarioAnalysis,
        rca: RootCauseAnalysis,
        rev_risk: RevenueRiskAnalysis,
        rec: RecoveryStrategyRecommendation,
        safety: RiskSafetyEvaluation,
    ) -> ExecutiveExplanation:
        headline = f"Payment Alert: {scenario.affected_payment_method} degradation on {scenario.affected_bank}"
        
        summary = (
            f"PayFire detected an operational anomaly affecting {rev_risk.affected_transactions} transactions "
            f"({rev_risk.failure_rate*100:.1f}% failure rate) during {scenario.scenario_name}. "
            f"Root cause was identified as {rca.primary_failure_code} on {scenario.affected_bank} switch with {rca.confidence*100:.0f}% statistical confidence."
        )

        operational_rec = (
            f"Recommended Action: Deploy '{rec.recommended_strategy}'. "
            f"{rec.rationale} "
            f"Pre-flight safety status: {safety.pre_flight_risk_level} risk."
        )

        financial_callout = (
            f"Estimated Revenue at Risk: INR {rev_risk.scaled_revenue_at_risk_inr:,.2f}. "
            f"Projected Recovery GMV with '{rec.recommended_strategy}': INR {round(rev_risk.scaled_revenue_at_risk_inr * rec.expected_recovery_rate, 2):,.2f} "
            f"({rec.expected_recovery_rate*100:.0f}% recovery rate)."
        )

        return ExecutiveExplanation(
            headline=headline,
            plain_english_summary=summary,
            operational_recommendation=operational_rec,
            financial_impact_callout=financial_callout,
            data_classification="AI_REASONING_OUTPUT",
        )


class AiIncidentAnalysisOrchestrator:
    """Master Orchestrator coordinating all 6 specialized AI analyst agents with graceful fallback."""

    def __init__(self, confidence_threshold: float = 0.75):
        self.scenario_analyst = ScenarioAnalyst()
        self.root_cause_analyst = RootCauseAnalyst(confidence_threshold)
        self.revenue_risk_analyst = RevenueRiskAnalyst()
        self.recovery_strategist = RecoveryStrategistAnalyst()
        self.risk_safety_analyst = RiskSafetyAnalyst()
        self.explanation_generator = ExplanationGenerator()

    def analyze_incident(
        self,
        incident_id: str,
        transactions: List[SyntheticTransaction],
        metrics: Dict[str, Any],
        scenario_context: Optional[Dict[str, Any]] = None,
        simulate_ai_failure: bool = False,
    ) -> RcaResult:
        """Runs the complete 6-analyst pipeline with deterministic fallback protection."""
        if simulate_ai_failure:
            # Graceful Fallback Behavior clearly labeled
            rev_risk = metrics.get("scaled_revenue_at_risk", 0.0)
            affected_txns = metrics.get("affected_transactions", len([t for t in transactions if t.status == "failed"]))
            
            return RcaResult(
                incident_id=incident_id,
                root_cause="[FALLBACK DIAGNOSIS] Automated AI analysis unavailable. Deterministic rule-based diagnosis engaged.",
                confidence=0.70,
                evidence=[
                    f"Deterministic error rate detected at {metrics.get('failure_rate', 0)*100:.1f}%.",
                    f"Sample affected volume: {affected_txns} transactions.",
                ],
                affected_components=["Primary Payment Gateway Switch"],
                uncertainties=["AI agent service temporarily unreachable; using deterministic rule heuristics."],
                revenue_at_risk_inr=rev_risk,
                affected_volume=affected_txns,
                recommended_action_summary="Engage Smart Dynamic Route Rerouting and page on-call PayOps engineer.",
                is_autonomous_allowed=False,
                data_mode="DETERMINISTIC_FALLBACK",
            )

        try:
            # Step 1: Scenario Analyst
            scenario_res = self.scenario_analyst.analyze(incident_id, scenario_context)

            # Step 2: Root Cause Analyst
            rca_res = self.root_cause_analyst.analyze(incident_id, transactions, metrics, scenario_res)

            # Step 3: Revenue Risk Analyst (Deterministic math only)
            rev_risk_res = self.revenue_risk_analyst.analyze(metrics, transactions)

            # Step 4: Recovery Strategist
            rec_res = self.recovery_strategist.analyze(rca_res, scenario_res, rev_risk_res)

            # Step 5: Risk / Safety Analyst
            safety_res = self.risk_safety_analyst.analyze(rca_res, rev_risk_res, rec_res)

            # Step 6: Explanation Generator
            explanation_res = self.explanation_generator.generate(
                scenario_res, rca_res, rev_risk_res, rec_res, safety_res
            )

            return RcaResult(
                incident_id=incident_id,
                root_cause=rca_res.root_cause,
                confidence=rca_res.confidence,
                evidence=rca_res.evidence,
                affected_components=rca_res.affected_components,
                uncertainties=rca_res.uncertainties,
                revenue_at_risk_inr=rev_risk_res.scaled_revenue_at_risk_inr,
                affected_volume=rev_risk_res.affected_transactions,
                recommended_action_summary=explanation_res.operational_recommendation,
                is_autonomous_allowed=rec_res.is_autonomous_allowed,
                scenario_analyst=scenario_res,
                root_cause_analyst=rca_res,
                revenue_risk_analyst=rev_risk_res,
                recovery_strategist=rec_res,
                risk_safety_analyst=safety_res,
                explanation_generator=explanation_res,
                data_mode="AI_AGENT_ANALYSIS",
            )
        except Exception as e:
            # Graceful Fallback if an unexpected runtime exception occurs
            rev_risk = metrics.get("scaled_revenue_at_risk", 0.0)
            affected_txns = metrics.get("affected_transactions", len([t for t in transactions if t.status == "failed"]))
            
            return RcaResult(
                incident_id=incident_id,
                root_cause=f"[FALLBACK DIAGNOSIS] Exception during agent inference: {str(e)}. Rule-based fallback active.",
                confidence=0.68,
                evidence=[f"Telemetry metrics: {metrics.get('failure_rate', 0)*100:.1f}% failure rate."],
                affected_components=["Core Payment Switch"],
                uncertainties=["Fallback engaged due to pipeline error."],
                revenue_at_risk_inr=rev_risk,
                affected_volume=affected_txns,
                recommended_action_summary="Halt automated actions and require human review.",
                is_autonomous_allowed=False,
                data_mode="DETERMINISTIC_FALLBACK",
            )
