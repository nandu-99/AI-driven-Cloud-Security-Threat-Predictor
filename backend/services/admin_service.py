from services.app_state import prediction_service

MONITORING_SETTINGS = {"hours": "00", "minutes": "30"}


def get_admin_logs():
    raw = prediction_service.admin_raw_view()
    return [
        {
            "id": r["user_id"],
            "risk": r["risk_level"],
            "status": prediction_service.get_case_status(r["user_id"], r["risk_level"]),
            "locked": prediction_service.is_locked(r["user_id"]),
            "loginAttempts": int(r["features"]["login_attempts"]),
            "failedLogins": int(r["features"]["failed_logins"]),
            "fileAccess": int(r["features"]["file_access"]),
            "session": f"{int(r['features']['session_minutes']//60)}h {int(r['features']['session_minutes']%60)}m",
            "ts": r["raw_data"].get("start") or r["raw_data"].get("end") or "",
        }
        for r in raw[:50]
    ]


def get_admin_dashboard():
    rows = prediction_service.predict_all_users()
    return {
        "totalUsers": len(rows),
        "activeSessions": max(1, len(rows) // 3),
        "criticalAlerts": len([r for r in rows if r["risk_level"] in ("High", "Critical")]),
        "lockedAccounts": len([r for r in rows if prediction_service.is_locked(r["user_id"])]),
        "users": [
            {
                "id": r["user_id"],
                "risk": r["risk_level"],
                "status": prediction_service.get_case_status(r["user_id"], r["risk_level"]),
                "locked": prediction_service.is_locked(r["user_id"]),
            }
            for r in rows[:25]
        ],
    }


def admin_user_action(user_id: str, action: str):
    labels = {"lock": "Account locked", "unlock": "Account unlocked", "reset": "Force password reset triggered"}
    if action not in ("lock", "unlock", "reset"):
        return {"message": "Invalid action"}, 400
    if not user_id:
        return {"message": "userId is required"}, 400

    if action in ("lock", "unlock"):
        result = prediction_service.toggle_lock(user_id)
        next_action = "unlock" if result["locked"] else "lock"
        current_label = labels["lock"] if result["locked"] else labels["unlock"]
        return {"success": True, "message": f"{current_label} — {user_id}", "locked": result["locked"], "nextAction": next_action}, 200

    prediction_service.send_message("admin", "analyst", f"{labels[action]} for {user_id}", user_id)
    return {"success": True, "message": f"{labels[action]} — {user_id}"}, 200


def set_monitoring_settings(hours: str, minutes: str):
    MONITORING_SETTINGS["hours"] = str(hours)
    MONITORING_SETTINGS["minutes"] = str(minutes)
    return {"success": True, "interval": f"{MONITORING_SETTINGS['hours']}:{MONITORING_SETTINGS['minutes']}"}
