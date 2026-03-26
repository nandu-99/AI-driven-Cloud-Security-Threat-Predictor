from flask import Blueprint, jsonify, request

from services.admin_service import admin_user_action, get_admin_dashboard, get_admin_logs, set_monitoring_settings
from services.auth_service import token_required
from services.explain_ai import get_admin_raw_xai

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/admin/logs")
@token_required
def admin_logs():
    return jsonify(get_admin_logs())


@admin_bp.get("/admin/dashboard")
@token_required
def admin_dashboard():
    return jsonify(get_admin_dashboard())


@admin_bp.post("/admin/user-action")
@token_required
def admin_action():
    data = request.get_json() or {}
    payload, code = admin_user_action(data.get("userId") or "", data.get("action") or "")
    return jsonify(payload), code


@admin_bp.post("/admin/monitoring-settings")
@token_required
def monitoring_settings():
    data = request.get_json() or {}
    return jsonify(set_monitoring_settings(data.get("hours", "00"), data.get("minutes", "30")))


@admin_bp.get("/admin/xai/raw")
@token_required
def admin_raw_xai():
    return jsonify(get_admin_raw_xai())
