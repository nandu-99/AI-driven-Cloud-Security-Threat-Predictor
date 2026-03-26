from flask import Blueprint, jsonify, request

from services.app_state import prediction_service
from services.auth_service import token_required

notification_bp = Blueprint("notification", __name__)
VALID_ROLES = {"user", "analyst", "admin"}


@notification_bp.get("/notifications")
@token_required
def get_notifications():
    current_role = (request.current_user or {}).get("role", "user")
    notifications = prediction_service.get_notifications(current_role)
    return jsonify(notifications)


@notification_bp.post("/notifications/send")
@token_required
def send_notifications():
    data = request.get_json() or {}
    sender_role = (request.current_user or {}).get("role", "user")
    message = (data.get("message") or "").strip()
    user_id = (data.get("userId") or "").strip()
    receiver_roles = data.get("receiverRoles") or []

    if not message:
        return jsonify({"message": "message is required"}), 400
    if not isinstance(receiver_roles, list) or not receiver_roles:
        return jsonify({"message": "receiverRoles must be a non-empty array"}), 400

    normalized = []
    for role in receiver_roles:
        role_value = str(role).strip().lower()
        if role_value not in VALID_ROLES:
            return jsonify({"message": f"Invalid role: {role_value}"}), 400
        if role_value not in normalized:
            normalized.append(role_value)

    result = prediction_service.send_message(sender_role, normalized, message, user_id)
    return jsonify(result)


@notification_bp.get("/messages/inbox")
@token_required
def messages_inbox():
    current_role = (request.current_user or {}).get("role", "user")
    inbox = prediction_service.get_inbox(current_role)
    return jsonify(inbox[::-1][:50])
