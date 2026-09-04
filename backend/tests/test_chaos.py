import pytest
from app.core.generator import PaymentStreamGenerator
from app.core.chaos_engine import ChaosEngine


def test_chaos_injection_upi_degradation():
    gen = PaymentStreamGenerator(seed=42)
    chaos = ChaosEngine(seed=42)

    baseline_txns = gen.generate_batch(count=1000)
    scenario = chaos.get_scenario("flash_sale_upi_degrade")
    assert scenario is not None

    perturbed, metrics = chaos.apply_chaos(baseline_txns, scenario, severity_override=0.25)

    assert metrics["failed_transactions"] > sum(1 for t in baseline_txns if t.status == "failed")
    assert metrics["scaled_revenue_at_risk"] > 0.0
    assert metrics["success_rate"] < 0.98
    assert metrics["avg_latency_ms"] > 1000.0

    # Verify that UPI on Bank A received the failure codes
    upi_bank_a_fails = [
        t for t in perturbed 
        if t.payment_method == "UPI" and t.bank == "Bank A" and t.status == "failed"
    ]
    assert len(upi_bank_a_fails) > 0
