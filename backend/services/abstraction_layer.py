import datetime
from typing import Any, Dict, List, Optional, Union

from ai.abstraction_layer import AnalystAbstractionLayer
from ai.explainable_ai import ExplainableAI
from database.db import DatasetRepository
from ml.feature_engineering import FeatureEngineering
from ml.model_trainer import ModelTrainer
from services.risk_engine import RiskEngine


class ThreatPredictionService:
    """
    Abstraction layer between raw datasets and API responses.
    It orchestrates: load -> feature engineering -> risk engine -> explainable AI.
    """

    def __init__(self) -> None:
        self.repo = DatasetRepository()
        self.fe = FeatureEngineering()
        self.engine = RiskEngine()
        self.xai = ExplainableAI()
        self.analyst_layer = AnalystAbstractionLayer()
        self.trainer = ModelTrainer()
        self.messages: List[Dict[str, Any]] = []
        self.notifications: Dict[str, List[Dict[str, str]]] = {
            "user": [],
            "analyst": [],
            "admin": [],
        }
        self.user_activity_state: Dict[str, Dict[str, Any]] = {}
        self.user_case_status: Dict[str, str] = {}
        self.user_lock_state: Dict[str, bool] = {}

    def predict_all_users(self) -> List[Dict[str, Any]]:
        rows = self.repo.load_security_rows()
        output = [self._build_output(row) for row in rows]
        for state in self.user_activity_state.values():
            output.append(self._build_output(self._simulated_row_from_state(state)))
        return output

    def train_models(self) -> Dict[str, str]:
        rows = self.repo.load_security_rows()
        features = [self.fe.transform(r) for r in rows]
        return self.trainer.train_all(features)

    def predict_one(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Missing payload fields are filled from frontend-like dummy sample.
        default = self.repo._dummy_rows_from_frontend_mock()[0]
        merged = {**default, **payload}
        return self._build_output(merged)

    def explain_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        for row in self.repo.load_security_rows():
            if str(row.get("user_id")) == str(user_id):
                output = self._build_output(row)
                return {
                    "user_id": output["user_id"],
                    "risk_level": output["risk_level"],
                    "risk_score": output["risk_score"],
                    "explanation": output["explanation"],
                }
        return None

    def _build_output(self, row: Dict[str, Any]) -> Dict[str, Any]:
        features = self.fe.transform(row)
        scores = self.engine.score(features)
        explanation = self.xai.explain(features, scores)

        return {
            "user_id": row.get("user_id"),
            "role": row.get("role", "user"),
            "source": row.get("source", "mixed"),
            "activity": row.get("activity", ""),
            "risk_level": scores["risk_level"],
            "risk_score": scores["risk_score"],
            "anomaly_score": scores["anomaly_score"],
            "drift_score": scores["drift_score"],
            "features": features,
            "raw_data": row,
            "explanation": explanation,
            "analyst_reason": self.analyst_layer.summarize(features, explanation),
        }

    def _simulated_row_from_state(self, state: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "user_id": state["user_id"],
            "role": "user",
            "source": "simulated",
            "activity": state["last_activity"],
            "login_attempts": state["login_attempts"],
            "failed_logins": state["failed_logins"],
            "file_access": state["file_access"],
            "session_minutes": state["session_minutes"],
            "geo_anomalies": state["geo_anomalies"],
            "off_hours_access": state["off_hours_access"],
            "restricted_access_attempts": state["restricted_access_attempts"],
            "baseline_session_minutes": 60,
            "start": state["updated_at"],
            "raw_details": "Generated from user dashboard activity simulation",
        }

    def admin_raw_view(self) -> List[Dict[str, Any]]:
        return self.predict_all_users()

    def analyst_abstract_view(self) -> List[Dict[str, Any]]:
        output = []
        for row in self.predict_all_users():
            output.append(
                {
                    "id": row["user_id"],
                    "level": row["risk_level"].lower(),
                    "desc": row["analyst_reason"],
                    "time": row["raw_data"].get("start") or row["raw_data"].get("end") or "--:--",
                }
            )
        return output

    def _push_notification(self, role: str, title: str) -> None:
        if role in self.notifications:
            self.notifications[role].insert(0, {"title": title, "time": "just now"})

    def send_message(
        self, sender_role: str, receiver_role: Union[str, List[str]], text: str, user_id: str = ""
    ) -> Dict[str, Any]:
        receivers = receiver_role if isinstance(receiver_role, list) else [receiver_role]
        deliveries: List[Dict[str, Any]] = []
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        for role in receivers:
            entry = {
                "sender_role": sender_role,
                "receiver_role": role,
                "user_id": user_id,
                "text": text,
                "time": now,
            }
            self.messages.append(entry)
            deliveries.append(entry)
            self._push_notification(role, f"New message from {sender_role}: {text[:60]}")

        # sender also sees delivery confirmation in notifications panel
        self._push_notification(sender_role, f"Message delivered to {', '.join(receivers)}")
        return {"success": True, "message": "Message sent", "data": deliveries}

    def send_support_ticket(self, subject: str, message: str, user_id: str = "") -> Dict[str, Any]:
        text = f"Support ticket: {subject} - {message}"
        return self.send_message("user", ["analyst", "admin"], text, user_id)

    def record_user_activity(self, user_id: str, activity: str) -> Dict[str, Any]:
        state = self.user_activity_state.get(
            user_id,
            {
                "user_id": user_id,
                "count": 0,
                "login_attempts": 1.0,
                "failed_logins": 0.0,
                "file_access": 2.0,
                "session_minutes": 40.0,
                "geo_anomalies": 0.0,
                "off_hours_access": 0.0,
                "restricted_access_attempts": 0.0,
                "last_activity": "normal",
                "updated_at": "",
                "session_flags": [],
                "hybrid_count": 0,
            },
        )

        state["count"] += 1
        state["last_activity"] = activity
        state["updated_at"] = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        if activity == "privileged_file_access":
            state["file_access"] += 9
            state["restricted_access_attempts"] += 1
        elif activity == "multiple_login_attempts":
            state["login_attempts"] += 6
            state["failed_logins"] += 4
            state["geo_anomalies"] += 1
        elif activity == "unusual_login_time":
            state["off_hours_access"] = 1
            state["session_minutes"] += 35
        else:
            state["session_minutes"] += 10

        # Hybrid detection: file access + failed login pattern in same session.
        if activity in ("privileged_file_access", "multiple_login_attempts"):
            if activity not in state["session_flags"]:
                state["session_flags"].append(activity)
            if len(state["session_flags"]) == 2:
                state["hybrid_count"] += 1
                state["session_flags"] = []

        self.user_activity_state[user_id] = state
        snapshot = self._build_output(self._simulated_row_from_state(state))
        risk_level = snapshot["risk_level"].lower()

        hybrid_alert_triggered = state["hybrid_count"] >= 2
        new_ip_alert = False
        if hybrid_alert_triggered:
            # Hybrid behavior repeated in same session: raise geo anomaly/new IP signal.
            state["geo_anomalies"] += 1
            new_ip_alert = True
            self.user_activity_state[user_id] = state
            self.send_message(
                "system",
                ["user", "analyst", "admin"],
                f"Hybrid threat alert for {user_id}: repeated failed-login + file-access pattern detected",
                user_id,
            )
            self.send_message(
                "system",
                ["user", "analyst", "admin"],
                f"New IP address alert for {user_id}: login from an unrecognized source",
                user_id,
            )

        self.send_message(
            "user",
            ["analyst", "admin"],
            f"Activity simulated for {user_id}: {activity} (risk: {risk_level})",
            user_id,
        )
        return {
            "success": True,
            "userId": user_id,
            "activity": activity,
            "riskLevel": risk_level,
            "riskScore": snapshot["risk_score"],
            "count": state["count"],
            "hybridCount": state["hybrid_count"],
            "hybridAlert": hybrid_alert_triggered,
            "newIpAlert": new_ip_alert,
        }

    def get_inbox(self, role: str) -> List[Dict[str, Any]]:
        return [m for m in self.messages if m["receiver_role"] == role]

    def get_notifications(self, role: str) -> List[Dict[str, str]]:
        return self.notifications.get(role, [])

    def set_investigated(self, user_id: str, note: str = "") -> Dict[str, Any]:
        self.user_case_status[user_id] = "Investigated"
        text = f"{user_id} marked as investigated"
        if note:
            text = f"{text}. Note: {note}"
        self.send_message("analyst", ["admin", "user"], text, user_id)
        return {"success": True, "userId": user_id, "status": "Investigated"}

    def set_escalated(self, user_id: str) -> Dict[str, Any]:
        self.user_case_status[user_id] = "Escalated"
        return {"success": True, "userId": user_id, "status": "Escalated"}

    def get_case_status(self, user_id: str, risk_level: str = "") -> str:
        status = self.user_case_status.get(user_id)
        if status:
            return status
        if risk_level in ("High", "Critical"):
            return "Escalated"
        if risk_level == "Medium":
            return "Under Investigation"
        return "Monitoring"

    def toggle_lock(self, user_id: str) -> Dict[str, Any]:
        new_state = not self.user_lock_state.get(user_id, False)
        self.user_lock_state[user_id] = new_state
        action = "locked" if new_state else "unlocked"
        self.send_message("admin", ["analyst"], f"Account {action} for {user_id}", user_id)
        return {"success": True, "userId": user_id, "locked": new_state, "action": action}

    def is_locked(self, user_id: str) -> bool:
        return self.user_lock_state.get(user_id, False)
