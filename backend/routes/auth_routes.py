from flask import Blueprint, jsonify, request

from services.auth_service import login_user, register_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/auth/register")
def register():
    data = request.get_json() or {}
    payload, code = register_user(
        (data.get("email") or "").strip().lower(),
        data.get("password") or "",
        (data.get("role") or "user").strip().lower(),
    )
    return jsonify(payload), code


@auth_bp.post("/auth/login")
def login():
    data = request.get_json() or {}
    payload, code = login_user(
        (data.get("email") or "").strip().lower(),
        data.get("password") or "",
    )
    return jsonify(payload), code
