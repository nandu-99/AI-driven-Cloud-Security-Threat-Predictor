from flask import Blueprint, jsonify, request

from services.analyst_service import (
    escalate_to_admin,
    get_analyst_alerts,
    get_analyst_dashboard,
    mark_user_investigated,
    respond_to_user,
)
from services.auth_service import token_required

analyst_bp = Blueprint("analyst", __name__)


@analyst_bp.get("/analyst/alerts")
@token_required
def analyst_alerts():
    return jsonify(get_analyst_alerts())


@analyst_bp.get("/analyst/dashboard")
@token_required
def analyst_dashboard():
    return jsonify(get_analyst_dashboard())


@analyst_bp.post("/analyst/respond")
@token_required
def analyst_respond():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    message = data.get("message") or ""
    if not user_id or not message:
        return jsonify({"message": "userId and message are required"}), 400
    respond_to_user(user_id, message)
    return jsonify({"success": True, "message": f"Response sent to {user_id}"})


@analyst_bp.post("/analyst/escalate")
@token_required
def analyst_escalate():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    reason = data.get("reason") or "Escalation"
    receiver_role = data.get("receiverRole") or "admin"
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
    payload, code = escalate_to_admin(user_id, reason, receiver_role)
    if code != 200:
        return jsonify(payload), code
    return jsonify({"success": True, "message": f"{user_id} escalated to Security Administrator only"})


@analyst_bp.post("/analyst/mark-investigated")
@token_required
def mark_investigated():
    data = request.get_json() or {}
    user_id = data.get("userId") or ""
    note = data.get("note") or ""
    if not user_id:
        return jsonify({"message": "userId is required"}), 400
    result = mark_user_investigated(user_id, note)
    return jsonify({"success": True, "message": f"{user_id} marked as investigated", "status": result["status"]})
