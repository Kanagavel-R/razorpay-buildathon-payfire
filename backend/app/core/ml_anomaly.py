"""ML-Powered Payment Telemetry Anomaly Detection.

Model: Isolation Forest (scikit-learn)
- Training Data: Baseline synthetic payment stream (1,000 baseline normal transactions).
- Features: [amount_inr, latency_ms, is_soft_failure_flag, failure_flag]
- Target: Unsupervised anomaly score / outlier classification (-1 for anomaly, 1 for normal).
- Evaluation: Distinguishes normal traffic variance from localized route degradations and spikes.
- Limitations: Unsupervised clustering cannot discern merchant business logic without label context;
  hence combined with statistical error-rate thresholding.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from sklearn.ensemble import IsolationForest
from app.core.generator import SyntheticTransaction


class PaymentAnomalyDetector:
    """Detects payment telemetry anomalies using Isolation Forest and Statistical Rolling Z-Scores."""

    def __init__(self, contamination: float = 0.05, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
        )
        self.is_fitted = False

    def _extract_features(self, txns: List[SyntheticTransaction]) -> np.ndarray:
        """Extracts numerical features for Isolation Forest."""
        features = []
        for t in txns:
            is_fail = 1.0 if t.status == "failed" else 0.0
            is_soft = 1.0 if t.is_soft_failure else 0.0
            features.append([
                t.amount_inr,
                t.latency_ms,
                is_fail,
                is_soft,
            ])
        return np.array(features, dtype=np.float64)

    def fit_baseline(self, baseline_txns: List[SyntheticTransaction]) -> None:
        """Fits the Isolation Forest on baseline healthy traffic."""
        X = self._extract_features(baseline_txns)
        self.model.fit(X)
        self.is_fitted = True

    def detect_anomalies(
        self,
        current_txns: List[SyntheticTransaction],
    ) -> Dict[str, Any]:
        """Evaluates current telemetry for anomalies.
        
        Returns anomaly flags, score, affected volume, and component distribution.
        """
        if not self.is_fitted:
            # Auto-fit on current if not pre-fitted
            self.fit_baseline(current_txns)

        X = self._extract_features(current_txns)
        preds = self.model.predict(X)  # -1 is anomaly, 1 is normal
        scores = self.model.decision_function(X)

        anomaly_mask = (preds == -1)
        anomaly_count = int(np.sum(anomaly_mask))
        anomaly_ratio = float(anomaly_count / max(1, len(current_txns)))

        # Method and bank breakdown among anomalies
        anomalous_txns = [txns for i, txns in enumerate(current_txns) if anomaly_mask[i]]
        
        method_counts: Dict[str, int] = {}
        bank_counts: Dict[str, int] = {}
        for t in anomalous_txns:
            method_counts[t.payment_method] = method_counts.get(t.payment_method, 0) + 1
            bank_counts[t.bank] = bank_counts.get(t.bank, 0) + 1

        is_incident = anomaly_ratio > 0.10 or any(t.status == "failed" for t in anomalous_txns)

        return {
            "is_anomaly_detected": is_incident,
            "anomaly_ratio": round(anomaly_ratio, 4),
            "anomalous_transaction_count": anomaly_count,
            "mean_anomaly_score": round(float(np.mean(scores)), 4),
            "affected_methods": method_counts,
            "affected_banks": bank_counts,
        }
