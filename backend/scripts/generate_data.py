"""CLI utility to generate reproducible synthetic payment dataset CSVs.

Usage:
    python -m scripts.generate_data --count 5000 --seed 42 --output data/synthetic_transactions.csv
"""

import os
import sys
import argparse
from pathlib import Path

# Add backend root to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.generator import PaymentStreamGenerator


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic payment transactions.")
    parser.add_argument("--count", type=int, default=5000, help="Number of synthetic transactions to generate.")
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed.")
    parser.add_argument("--output", type=str, default="data/synthetic_payments.csv", help="Output file path.")

    args = parser.parse_args()

    print(f"Generating {args.count} synthetic transactions with seed={args.seed}...")
    generator = PaymentStreamGenerator(seed=args.seed)
    transactions = generator.generate_batch(count=args.count)
    df = generator.to_dataframe(transactions)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    print(f"Saved {len(df)} transactions to {out_path.resolve()}.")
    print(f"Summary Statistics:")
    print(f"- Total GMV: INR {df['amount_inr'].sum():,.2f}")
    print(f"- Success Rate: {(df['status'] == 'captured').mean() * 100:.2f}%")
    print(f"- Average Latency: {df['latency_ms'].mean():.1f} ms")
    print(f"- High Value (>10,000 INR): {df['is_high_value'].sum()} transactions")


if __name__ == "__main__":
    main()
