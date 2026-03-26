from services.app_state import prediction_service


def get_analyst_alerts():
    return prediction_service.analyst_abstract_view()


def get_analyst_dashboard():
    users = prediction_service.predict_all_users()
    return {
        "users": [
            {
                "id": u["user_id"],
                "risk": u["risk_level"],
                "status": prediction_service.get_case_status(u["user_id"], u["risk_level"]),
            }
            for u in users[:25]
        ],
        "highRisk": len([u for u in users if u["risk_level"] in ("High", "Critical")]),
        "underInvestigation": len([u for u in users if u["risk_level"] == "Medium"]),
        "escalated": len([u for u in users if u["risk_level"] in ("High", "Critical")]),
        "clearedToday": len([u for u in users if u["risk_level"] == "Low"]),
    }


def respond_to_user(user_id: str, message: str):
    # Analyst responses are visible to both user and administrator.
    return prediction_service.send_message("analyst", ["user", "admin"], message, user_id)


def escalate_to_admin(user_id: str, reason: str, receiver_role: str = "admin"):
    if receiver_role != "admin":
        return {"message": "Escalation is allowed only to administrator"}, 400
    prediction_service.set_escalated(user_id)
    result = prediction_service.send_message("analyst", "admin", reason, user_id)
    return result, 200


def mark_user_investigated(user_id: str, note: str = ""):
    return prediction_service.set_investigated(user_id, note)
