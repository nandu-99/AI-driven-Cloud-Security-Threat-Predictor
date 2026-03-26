import datetime

from flask import Blueprint, jsonify, request

from services.app_state import prediction_service
from services.auth_service import token_required

user_bp = Blueprint("user", __name__)


@user_bp.get("/user/dashboard")
@token_required
def user_dashboard():
    return jsonify({"accountStatus": "Active", "lastLogin": "Today 09:14 AM", "sessionsToday": 3, "alerts": 1})


@user_bp.post("/user/support")
@token_required
def user_support():
    data = request.get_json() or {}
    subject = data.get("subject") or ""
    message = data.get("message") or ""
    if not subject or not message:
        return jsonify({"message": "Subject and message are required"}), 400
    ticket_id = f"TKT-{datetime.datetime.utcnow().strftime('%H%M%S')}"
    prediction_service.send_support_ticket(subject, message, user_id=ticket_id)
    return jsonify(
        {
            "success": True,
            "ticketId": ticket_id,
            "routedTo": ["analyst", "admin"],
        }
    )


@user_bp.post("/user/simulate-activity")
@token_required
def simulate_activity():
    data = request.get_json() or {}
    activity = (data.get("activity") or "").strip()
    if not activity:
        return jsonify({"message": "activity is required"}), 400

    email = (request.current_user or {}).get("email") or ""
    user_id = f"USR-{abs(hash(email)) % 10000:04d}" if email else "USR-0000"
    result = prediction_service.record_user_activity(user_id, activity)
    return jsonify(result)
