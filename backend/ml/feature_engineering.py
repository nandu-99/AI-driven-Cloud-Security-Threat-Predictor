from typing import Any, Dict


class FeatureEngineering:
    def transform(self, row: Dict[str, Any]) -> Dict[str, float]:
        login_attempts = float(row.get("login_attempts", 0))
        failed_logins = float(row.get("failed_logins", 0))
        file_access = float(row.get("file_access", 0))
        session_minutes = float(row.get("session_minutes", 0))
        baseline = float(row.get("baseline_session_minutes", 1) or 1)
        geo_anomalies = float(row.get("geo_anomalies", 0))
        off_hours = float(row.get("off_hours_access", 0))
        restricted_attempts = float(row.get("restricted_access_attempts", 0))

        failure_rate = failed_logins / login_attempts if login_attempts > 0 else 0.0
        session_ratio = session_minutes / baseline if baseline > 0 else 0.0

        return {
            "login_attempts": login_attempts,
            "failed_logins": failed_logins,
            "failure_rate": failure_rate,
            "file_access": file_access,
            "session_minutes": session_minutes,
            "session_ratio": session_ratio,
            "geo_anomalies": geo_anomalies,
            "off_hours_access": off_hours,
            "restricted_access_attempts": restricted_attempts,
        }
