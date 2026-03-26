from typing import Dict


class RiskEngine:
    def score(self, features: Dict[str, float]) -> Dict[str, float]:
        weighted = (
            1.2 * features["login_attempts"]
            + 24.0 * features["failure_rate"]
            + 0.7 * features["file_access"]
            + 8.0 * features["session_ratio"]
            + 12.0 * features["geo_anomalies"]
            + 16.0 * features["off_hours_access"]
            + 10.0 * features["restricted_access_attempts"]
        )
        risk_score = min(100.0, round(weighted / 2.2, 2))
        anomaly_score = min(100.0, round((features["failure_rate"] * 70 + features["geo_anomalies"] * 8 + features["off_hours_access"] * 14), 2))
        drift_score = min(100.0, round((features["session_ratio"] * 20 + features["file_access"] * 0.45), 2))

        if risk_score >= 90:
            risk_level = "Critical"
        elif risk_score >= 80:
            risk_level = "High"
        elif risk_score >= 50:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        return {
            "risk_score": risk_score,
            "anomaly_score": anomaly_score,
            "drift_score": drift_score,
            "risk_level": risk_level,
        }
