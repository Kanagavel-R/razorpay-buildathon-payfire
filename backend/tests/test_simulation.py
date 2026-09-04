import pytest
import numpy as np
from app.core.generator import PaymentStreamGenerator, SyntheticTransaction
from app.core.chaos_engine import ChaosEngine, ChaosScenario
from app.core.simulation_engine import DiscretePaymentSimulator


def test_synthetic_data_generation_fields():
    """Requirement 1: Verify data model attributes."""
    gen = PaymentStreamGenerator(seed=42)
    batch = gen.generate_batch(count=100)

    assert len(batch) == 100
    for tx in batch:
        assert isinstance(tx.id, str) and tx.id.startswith("pay_")
        assert isinstance(tx.order_id, str) and tx.order_id.startswith("order_")
        assert isinstance(tx.customer_id, str) and tx.customer_id.startswith("cust_")
        assert tx.customer_segment in ["New", "Returning", "VIP"]
        assert tx.payment_method in ["UPI", "Cards", "NetBanking", "Wallets"]
        assert tx.bank in ["Bank A", "Bank B", "Bank C", "Bank D"]
        assert tx.amount_inr >= 50.0
        assert tx.status in ["captured", "failed"]
        assert tx.latency_ms > 0.0
        assert tx.retry_count == 0
        assert tx.timestamp > 0.0
        assert isinstance(tx.created_at_iso, str) and len(tx.created_at_iso) > 10


def test_deterministic_seed_reproducibility():
    """Requirement 8: Verify exact reproducibility with fixed seed."""
    sim1 = DiscretePaymentSimulator(seed=999, merchant_expected_gmv=20000000.0)
    sim2 = DiscretePaymentSimulator(seed=999, merchant_expected_gmv=20000000.0)

    gen1 = PaymentStreamGenerator(seed=999)
    gen2 = PaymentStreamGenerator(seed=999)

    batch1 = gen1.generate_batch(count=500)
    batch2 = gen2.generate_batch(count=500)

    for t1, t2 in zip(batch1, batch2):
        assert t1.id == t2.id
        assert t1.amount_inr == t2.amount_inr
        assert t1.status == t2.status
        assert t1.latency_ms == t2.latency_ms

    outcomes1 = sim1.run_counterfactual_simulations(batch1)
    outcomes2 = sim2.run_counterfactual_simulations(batch2)

    for o1, o2 in zip(outcomes1, outcomes2):
        assert o1.strategy_code == o2.strategy_code
        assert o1.recovered_gmv_inr == o2.recovered_gmv_inr
        assert o1.net_recovery_rate == o2.net_recovery_rate
        assert o1.duplicate_risk_count == o2.duplicate_risk_count


def test_baseline_calculation():
    """Requirement 3: Verify baseline calculation when no strategy is applied."""
    gen = PaymentStreamGenerator(seed=42)
    chaos = ChaosEngine(seed=42)
    baseline_txns = gen.generate_batch(count=1000)

    scenario = chaos.get_scenario("upi_degradation")
    assert scenario is not None

    degraded_txns, _ = chaos.apply_chaos(baseline_txns, scenario, severity_override=0.25)
    sim = DiscretePaymentSimulator(seed=42, merchant_expected_gmv=20000000.0)

    baseline_res = sim.simulate_baseline(
        degraded_transactions=degraded_txns,
        scenario_name=scenario.name,
        scenario_id=scenario.id,
    )

    assert baseline_res.total_transactions == 1000
    assert baseline_res.failed_transactions > 0
    assert baseline_res.successful_transactions + baseline_res.failed_transactions == 1000
    assert baseline_res.failure_rate > 0.05
    assert baseline_res.revenue_at_risk_inr > 0.0
    assert baseline_res.total_gmv_inr == 20000000.0
    assert baseline_res.average_latency_ms > 800.0
    assert baseline_res.affected_customers > 0
    assert baseline_res.data_classification == "SIMULATED RESULT"


def test_revenue_at_risk_formula():
    """Requirement 5: Deterministic mathematical verification of Revenue at Risk."""
    sim = DiscretePaymentSimulator(seed=42, merchant_expected_gmv=10000000.0)  # ₹1 Crore

    # Create synthetic test batch with known values
    txns = [
        SyntheticTransaction(
            id=f"tx_{i}", order_id=f"ord_{i}", customer_id=f"c_{i}",
            customer_segment="New", amount_inr=1000.0, payment_method="UPI",
            bank="Bank A", is_high_value=False,
            status="captured" if i < 80 else "failed",
            latency_ms=800.0, retry_count=0, timestamp=1.0,
        )
        for i in range(100)
    ]
    # Total sample GMV = 100 * 1000 = 100,000
    # Failed sample GMV = 20 * 1000 = 20,000
    # Failed ratio = 20,000 / 100,000 = 0.20
    # Scaled Revenue at Risk = 10,000,000 * 0.20 = 2,000,000.0 (₹20 Lakhs)
    base_res = sim.simulate_baseline(txns, scenario_name="Test", scenario_id="test")
    assert base_res.failed_gmv_inr == 20000.0
    assert base_res.revenue_at_risk_inr == 2000000.0
    assert base_res.failure_rate == 0.20


def test_chaos_injection_all_scenarios():
    """Requirement 4: Verify all 5 required chaos scenarios."""
    gen = PaymentStreamGenerator(seed=42)
    chaos = ChaosEngine(seed=42)
    txns = gen.generate_batch(count=500)

    required_scenarios = [
        "upi_degradation",
        "bank_outage",
        "payment_timeout",
        "webhook_delay",
        "traffic_spike",
    ]

    for sc_id in required_scenarios:
        scenario = chaos.get_scenario(sc_id)
        assert scenario is not None, f"Scenario {sc_id} must be defined"
        degraded, metrics = chaos.apply_chaos(txns, scenario)
        assert metrics["total_transactions"] == 500
        assert metrics["scaled_revenue_at_risk"] > 0
        assert metrics["avg_latency_ms"] > 0


def test_strategy_simulation_and_comparison():
    """Requirement 6 & 7: Verify simulate(strategy, scenario) and compare_baseline_vs_strategy."""
    gen = PaymentStreamGenerator(seed=42)
    chaos = ChaosEngine(seed=42)
    scenario = chaos.get_scenario("upi_degradation")
    degraded, _ = chaos.apply_chaos(gen.generate_batch(count=1000), scenario)

    sim = DiscretePaymentSimulator(seed=42, merchant_expected_gmv=20000000.0)
    baseline = sim.simulate_baseline(degraded, scenario_name=scenario.name, scenario_id=scenario.id)

    # 1. no_action
    res_none = sim.simulate("no_action", degraded, scenario)
    comp_none = sim.compare_baseline_vs_strategy(baseline, res_none)
    assert res_none.recovered_transactions == 0
    assert comp_none.incremental_recovery_inr == 0.0

    # 2. immediate_retry (violates safety due to race conditions)
    res_imm = sim.simulate("immediate_retry", degraded, scenario)
    comp_imm = sim.compare_baseline_vs_strategy(baseline, res_imm)
    assert res_imm.recovered_transactions > 0
    assert res_imm.duplicate_risk_count > 0
    assert res_imm.safety_compliance is False

    # 3. delayed_retry (exponential backoff)
    res_delayed = sim.simulate("delayed_retry", degraded, scenario)
    comp_delayed = sim.compare_baseline_vs_strategy(baseline, res_delayed)
    assert res_delayed.recovered_transactions > 0
    assert res_delayed.duplicate_risk_count == 0
    assert res_delayed.safety_compliance is True
    assert res_delayed.average_latency_ms > baseline.average_latency_ms

    # 4. alternate_route (dynamic rerouting)
    res_route = sim.simulate("alternate_route", degraded, scenario)
    comp_route = sim.compare_baseline_vs_strategy(baseline, res_route)
    assert res_route.recovered_transactions > res_delayed.recovered_transactions
    assert res_route.duplicate_risk_count == 0
    assert res_route.safety_compliance is True
    assert comp_route.incremental_recovery_inr > 0.0
