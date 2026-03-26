from typing import Dict, List


class ExplainableAI:
    def explain(self, features: Dict[str, float], scores: Dict[str, float]) -> List[str]:
        reasons: List[str] = []

        if features["failed_logins"] >= 5:
            reasons.append(
                f"High failed logins: {int(features['failed_logins'])} failures with {features['failure_rate']:.0%} failure rate."
            )
        if features["file_access"] >= 40:
            reasons.append(f"Privileged file access spike: {int(features['file_access'])} files accessed.")
        if features["session_ratio"] >= 2:
            reasons.append(
                f"Session duration anomaly: {features['session_minutes']:.0f} minutes ({features['session_ratio']:.1f}x baseline)."
            )
        if features["geo_anomalies"] > 0:
            reasons.append(f"Geolocation anomalies detected: {int(features['geo_anomalies'])} unusual location events.")
        if features["off_hours_access"] >= 1:
            reasons.append("Off-hours activity detected for this account.")
        if features["restricted_access_attempts"] > 0:
            reasons.append(
                f"Restricted access attempts: {int(features['restricted_access_attempts'])} blocked attempts."
            )

        if not reasons:
            reasons.append("No major anomalies detected; behavior is within expected baseline.")

        reasons.append(
            f"Model output => risk: {scores['risk_score']}, anomaly: {scores['anomaly_score']}, drift: {scores['drift_score']}."
        )
        return reasons

    def abstract_explain(self, features: Dict[str, float]) -> str:
        tags: List[str] = []
        if features["failed_logins"] >= 5:
            tags.append("Excess failed login attempts")
        if features["file_access"] >= 35:
            tags.append("Excess privileged file access")
        if features["session_ratio"] >= 2:
            tags.append("Session duration exceeded normal baseline")
        if features["geo_anomalies"] > 0:
            tags.append("Login from unusual location")
        if features["off_hours_access"] >= 1:
            tags.append("Off-hours activity detected")
        if features["restricted_access_attempts"] > 0:
            tags.append("Attempted restricted resource access")
        if not tags:
            return "No unusual activity detected"
        return "; ".join(tags)
