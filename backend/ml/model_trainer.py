from typing import Dict, List

import numpy as np

try:
    from sklearn.preprocessing import StandardScaler
except Exception:  # pragma: no cover
    StandardScaler = None

from ai.lstm_model import train_lstm
from ml.isolation_forest_model import train_isolation_forest
from ml.random_forest_model import train_random_forest
from ml.xgboost_model import train_xgboost


class ModelTrainer:
    def __init__(self) -> None:
        if StandardScaler:
            self.scaler = StandardScaler()
        else:
            self.scaler = None

    def train_all(self, feature_rows: List[Dict[str, float]]) -> Dict[str, str]:
        x = np.array(
            [
                [
                    r["login_attempts"],
                    r["failed_logins"],
                    r["failure_rate"],
                    r["file_access"],
                    r["session_ratio"],
                    r["geo_anomalies"],
                    r["off_hours_access"],
                    r["restricted_access_attempts"],
                ]
                for r in feature_rows
            ],
            dtype=float,
        )
        if len(x) < 3:
            return {
                "random_forest": "skipped (need >= 3 rows)",
                "isolation_forest": "skipped (need >= 3 rows)",
                "xgboost": "skipped (need >= 3 rows)",
                "hybrid": "skipped (need >= 3 rows)",
                "lstm": "skipped (need >= 3 rows)",
            }

        y = self._pseudo_labels(x)
        
        if self.scaler is None:
            status: Dict[str, str] = {
                "random_forest": "skipped (scikit-learn not installed)",
                "isolation_forest": "skipped (scikit-learn not installed)",
                "xgboost": "skipped",
                "hybrid": "skipped",
                "lstm": "skipped",
            }
            # Still try to call them to get their own 'skip' messages if they handle it
            status["random_forest"] = train_random_forest(x, y)
            status["isolation_forest"] = train_isolation_forest(x)
            status["xgboost"] = train_xgboost(x, y)
            status["lstm"] = train_lstm(x, y)
            return status

        x_scaled = self.scaler.fit_transform(x)

        status: Dict[str, str] = {}
        status["random_forest"] = train_random_forest(x_scaled, y)
        status["isolation_forest"] = train_isolation_forest(x_scaled)
        status["xgboost"] = train_xgboost(x_scaled, y)
        status["hybrid"] = "ready (ensemble: random_forest + isolation_forest + xgboost)"
        status["lstm"] = train_lstm(x_scaled, y)
        return status

    def _pseudo_labels(self, x: np.ndarray) -> np.ndarray:
        risk_proxy = x[:, 1] * 2.0 + x[:, 3] * 0.3 + x[:, 5] * 3.0 + x[:, 6] * 5.0
        return (risk_proxy >= np.median(risk_proxy)).astype(int)

