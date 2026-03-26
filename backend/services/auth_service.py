import datetime
import json
import os
from pathlib import Path
from functools import wraps
from typing import Dict

import jwt
from flask import jsonify, request

from services.app_state import prediction_service

SECRET_KEY = "sec-threat-predictor-secret-2026"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

DEFAULT_USERS: Dict[str, Dict[str, str]] = {
    "user@gmail.com": {"password": "user123", "role": "user", "loginAttempts": 0, "failedLogins": 0},
    "analyst@gmail.com": {"password": "analyst123", "role": "analyst", "loginAttempts": 0, "failedLogins": 0},
    "admin@gmail.com": {"password": "admin123", "role": "admin", "loginAttempts": 0, "failedLogins": 0},
}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_DB_PATH = DATA_DIR / "users.json"

USERS: Dict[str, Dict[str, str]] = {}

def _user_id_from_email(email: str) -> str:
    """
    Keep user-id mapping consistent with the frontend mock.
    """
    email_key = (email or "").strip().lower()
    demo_map = {"user@gmail.com": "USR-1021", "analyst@gmail.com": "USR-1043", "admin@gmail.com": "USR-1072"}
    if demo_map.get(email_key):
        return demo_map[email_key]
    base = (email_key.split("@")[0] or "user")[:6].upper()
    return f"USR-{base}"


def _load_users_from_disk() -> Dict[str, Dict[str, str]]:
    try:
        if not USERS_DB_PATH.exists():
            return {}
        raw = USERS_DB_PATH.read_text(encoding="utf-8")
        parsed = json.loads(raw) if raw else {}
        if not isinstance(parsed, dict):
            return {}
        normalized: Dict[str, Dict[str, str]] = {}
        for email, value in parsed.items():
            if not isinstance(email, str) or not isinstance(value, dict):
                continue
            password = value.get("password")
            role = value.get("role")
            login_attempts = value.get("loginAttempts", 0)
            failed_logins = value.get("failedLogins", 0)
            if not isinstance(password, str) or not isinstance(role, str):
                continue
            try:
                login_attempts = int(login_attempts)
            except Exception:
                login_attempts = 0
            try:
                failed_logins = int(failed_logins)
            except Exception:
                failed_logins = 0
            normalized[email.strip().lower()] = {
                "password": password,
                "role": role.strip().lower(),
                "loginAttempts": login_attempts,
                "failedLogins": failed_logins,
            }
        return normalized
    except Exception:
        return {}


def _persist_users_to_disk():
    # Best-effort persistence in a local JSON file.
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        tmp_path = USERS_DB_PATH.with_suffix(".json.tmp")
        tmp_path.write_text(json.dumps(USERS, indent=2), encoding="utf-8")
        os.replace(tmp_path, USERS_DB_PATH)
    except Exception:
        # Never break auth flow because of a disk write failure.
        pass


# Load persisted users at import time.
USERS.update(DEFAULT_USERS)
USERS.update(_load_users_from_disk())


def register_user(email: str, password: str, role: str):
    if not email or not password:
        return {"message": "Email and password are required"}, 400
    if not email.endswith("@gmail.com"):
        return {"message": "Only @gmail.com emails are allowed"}, 400
    role = role.strip().lower()
    if role not in ("user", "analyst", "admin"):
        return {"message": "Invalid role"}, 400
    if email in USERS:
        return {"message": "Email already registered"}, 409
    USERS[email] = {"password": password, "role": role, "loginAttempts": 0, "failedLogins": 0}
    _persist_users_to_disk()
    return {"success": True, "message": "Registration successful"}, 200


def login_user(email: str, password: str):
    email = email.strip().lower()
    user = USERS.get(email)
    if not user:
        # Demo-friendly: auto-create user on first login in persistent mode.
        # Role is inferred from email keywords; otherwise defaults to 'user'.
        if email.endswith("@gmail.com"):
            guessed_role = "admin" if "admin" in email else "analyst" if "analyst" in email else "user"
            USERS[email] = {"password": password, "role": guessed_role, "loginAttempts": 0, "failedLogins": 0}
            _persist_users_to_disk()
            user = USERS.get(email)
        else:
            return {"message": "Invalid credentials"}, 401

    if not user:
        return {"message": "Invalid credentials"}, 401

    # Update counters
    user["loginAttempts"] = int(user.get("loginAttempts", 0)) + 1
    if user["password"] != password:
        user["failedLogins"] = int(user.get("failedLogins", 0)) + 1
        login_attempts = int(user.get("loginAttempts", 0))
        failed_logins = int(user.get("failedLogins", 0))
        user_id = _user_id_from_email(email)

        prediction_service._push_notification(
            "analyst",
            f"Failed login: {login_attempts} attempts, {failed_logins} failed for {user_id}",
        )
        prediction_service._push_notification(
            "admin",
            f"Failed login: {login_attempts} attempts, {failed_logins} failed for {user_id}",
        )

        _persist_users_to_disk()
        return {"message": "Invalid credentials"}, 401

    _persist_users_to_disk()
    login_attempts = int(user.get("loginAttempts", 0))
    failed_logins = int(user.get("failedLogins", 0))
    user_id = _user_id_from_email(email)

    prediction_service._push_notification(
        "analyst",
        f"Login success: {login_attempts} attempts, {failed_logins} failed for {user_id}",
    )
    prediction_service._push_notification(
        "admin",
        f"Login success: {login_attempts} attempts, {failed_logins} failed for {user_id}",
    )

    payload = {
        "email": email,
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
    return {
        "token": token,
        "user": {"email": email, "role": user["role"]},
        "loginAttempts": user.get("loginAttempts", 0),
        "failedLogins": user.get("failedLogins", 0),
    }, 200


def token_required(f):
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
