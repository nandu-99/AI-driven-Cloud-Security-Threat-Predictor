from typing import Dict, List


class AnalystAbstractionLayer:
    """
    Converts detailed XAI signals into analyst-safe abstraction text.
    Keeps frontend-style language (e.g., "Excess...", "Login from unusual location").
    """

    def summarize(self, features: Dict[str, float], _detailed_reasons: List[str]) -> str:
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
