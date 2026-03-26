import datetime
from functools import wraps
from typing import Dict

import jwt
from flask import Blueprint, jsonify, request

from services.abstraction_layer import ThreatPredictionService

app_bp = Blueprint("app", __name__)
service = ThreatPredictionService()

SECRET_KEY = "sec-threat-predictor-secret-2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

USERS: Dict[str, Dict[str, str]] = {
    "user@gmail.com": {"password": "user123", "role": "user"},
    "analyst@gmail.com": {"password": "analyst123", "role": "analyst"},
    "admin@gmail.com": {"password": "admin123", "role": "admin"},
}

MONITORING_SETTINGS = {"hours": "00", "minutes": "30"}


def _generate_token(email: str, role: str) -> str:
    payload = {
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def _token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"message": "Token missing"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            request.current_user = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        except Exception:
            return jsonify({"message": "Token invalid or expired"}), 401
        return f(*args, **kwargs)

    return decorated


@app_bp.post("/auth/register")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip().lower()
    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400
    if not email.endswith("@gmail.com"):
        return jsonify({"message": "Only @gmail.com emails are allowed"}), 400
    if role not in ("user", "analyst", "admin"):
        return jsonify({"message": "Invalid role"}), 400
    if email in USERS:
        return jsonify({"message": "Email already registered"}), 409
    USERS[email] = {"password": password, "role": role}
    return jsonify({"success": True, "message": "Registration successful"})


@app_bp.post("/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    user = USERS.get(email)
    if not user or user["password"] != password:
        return jsonify({"message": "Invalid credentials"}), 401
    return jsonify(
        {
            "token": _generate_token(email, user["role"]),
            "user": {"email": email, "role": user["role"]},
        }
    )


@app_bp.get("/user/dashboard")
@_token_required
def user_dashboard():
    return jsonify({"accountStatus": "Active", "lastLogin": "Today 09:14 AM", "sessionsToday": 3, "alerts": 1})


@app_bp.post("/user/support")
@_token_required
def user_support():
    data = request.get_json() or {}
    subject = data.get("subject") or ""
    message = data.get("message") or ""
    if not subject or not message:
        return jsonify({"message": "Subject and message are required"}), 400
    service.send_message("user", "analyst", f"{subject}: {message}")
    return jsonify({"success": True, "ticketId": f"TKT-{datetime.datetime.utcnow().strftime('%H%M%S')}"})


@app_bp.get("/analyst/alerts")
@_token_required
def analyst_alerts():
    return jsonify(service.analyst_abstract_view())


@app_bp.get("/analyst/dashboard")
@_token_required
def analyst_dashboard():
    users = service.predict_all_users()
    return jsonify(
        {
            "users": [
                {
                    "id": u["user_id"],
                    "risk": u["risk_level"],
                    "status": "Escalated" if u["risk_level"] == "High" else "Monitoring",
                }
                for u in users[:25]
            ],
            "highRisk": len([u for u in users if u["risk_level"] == "High"]),
            "underInvestigation": len([u for u in users if u["risk_level"] == "Medium"]),
            "escalated": len([u for u in users if u["risk_level"] == "High"]),
            "clearedToday": len([u for u in users if u["risk_level"] == "Low"]),
        }
    )


@app_bp.post("/analyst/respond")
@_token_required
def analyst_respond():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    message = data.get("message") or ""
    if not user_id or not message:
        return jsonify({"message": "userId and message are required"}), 400
    service.send_message("analyst", "user", message, user_id)
    return jsonify({"success": True, "message": f"Response sent to {user_id}"})


@app_bp.post("/analyst/escalate")
@_token_required
def analyst_escalate():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    reason = data.get("reason") or "Escalation"
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
    service.send_message("analyst", "admin", reason, user_id)
    return jsonify({"success": True, "message": f"{user_id} escalated to Security Administrator"})


@app_bp.post("/analyst/mark-investigated")
@_token_required
def mark_investigated():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
    return jsonify({"success": True, "message": f"{user_id} marked as investigated"})


@app_bp.get("/admin/logs")
@_token_required
def admin_logs():
    raw = service.admin_raw_view()
    return jsonify(
        [
            {
                "id": r["user_id"],
                "risk": r["risk_level"],
                "status": "Escalated" if r["risk_level"] == "High" else "Monitoring",
                "loginAttempts": int(r["features"]["login_attempts"]),
                "failedLogins": int(r["features"]["failed_logins"]),
                "fileAccess": int(r["features"]["file_access"]),
                "session": f"{int(r['features']['session_minutes']//60)}h {int(r['features']['session_minutes']%60)}m",
                "ts": r["raw_data"].get("start") or r["raw_data"].get("end") or "",
            }
            for r in raw[:50]
        ]
    )


@app_bp.get("/admin/dashboard")
@_token_required
def admin_dashboard():
    rows = service.predict_all_users()
    return jsonify(
        {
            "totalUsers": len(rows),
            "activeSessions": max(1, len(rows) // 3),
            "criticalAlerts": len([r for r in rows if r["risk_level"] == "High"]),
            "lockedAccounts": 2,
        }
    )


@app_bp.post("/admin/user-action")
@_token_required
def admin_user_action():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    action = data.get("action") or ""
    labels = {"lock": "Account locked", "unlock": "Account unlocked", "reset": "Force password reset triggered"}
    if action not in labels:
        return jsonify({"message": "Invalid action"}), 400
    if user_id:
        service.send_message("admin", "analyst", f"{labels[action]} for {user_id}", user_id)
    return jsonify({"success": True, "message": f"{labels[action]} — {user_id}"})


@app_bp.post("/admin/monitoring-settings")
@_token_required
def set_monitoring_settings():
    data = request.get_json() or {}
    MONITORING_SETTINGS["hours"] = str(data.get("hours", "00"))
    MONITORING_SETTINGS["minutes"] = str(data.get("minutes", "30"))
    return jsonify({"success": True, "interval": f"{MONITORING_SETTINGS['hours']}:{MONITORING_SETTINGS['minutes']}"})
