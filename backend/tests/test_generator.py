import pytest
from app.core.generator import PaymentStreamGenerator


def test_generator_deterministic_reproducibility():
    gen1 = PaymentStreamGenerator(seed=123)
    gen2 = PaymentStreamGenerator(seed=123)
    
    batch1 = gen1.generate_batch(count=100)
    batch2 = gen2.generate_batch(count=100)

    assert len(batch1) == 100
    assert len(batch2) == 100
    for t1, t2 in zip(batch1, batch2):
        assert t1.id == t2.id
        assert t1.amount_inr == t2.amount_inr
        assert t1.payment_method == t2.payment_method
        assert t1.status == t2.status


def test_generator_distributions():
    gen = PaymentStreamGenerator(seed=42)
    batch = gen.generate_batch(count=1000)

    methods = {t.payment_method for t in batch}
    assert "UPI" in methods
    assert "Cards" in methods

    # UPI should dominate (~60%)
    upi_count = sum(1 for t in batch if t.payment_method == "UPI")
    assert 500 <= upi_count <= 700

    # Amounts are valid positive numbers
    for t in batch:
        assert t.amount_inr >= 50.0
        if t.amount_inr >= 10000.0:
            assert t.is_high_value is True

    # High baseline success rate (>95%)
    captured = sum(1 for t in batch if t.status == "captured")
    assert captured >= 940
