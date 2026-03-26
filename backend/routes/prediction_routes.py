from flask import Blueprint, jsonify, request

from ml.predictor import predict_all, predict_one, train_models as run_train_models
from services.app_state import prediction_service
from services.explain_ai import get_analyst_abstraction, get_user_explanation as get_user_explanation_service

prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.get("/ml/users")
def get_users_prediction():
    results = predict_all()
    return jsonify(results)


@prediction_bp.post("/ml/predict")
def predict_single():
    payload = request.get_json(silent=True) or {}
    result = predict_one(payload)
    return jsonify(result)


@prediction_bp.get("/ml/explanations/<user_id>")
def get_user_explanation(user_id: str):
    result = get_user_explanation_service(user_id)
    if not result:
        return jsonify({"message": "User not found"}), 404
    return jsonify(result)


@prediction_bp.post("/ml/train")
def train_models():
    return jsonify(run_train_models())


@prediction_bp.get("/analyst/xai/abstract")
def analyst_abstraction():
    return jsonify(get_analyst_abstraction())


@prediction_bp.post("/messages/send")
def send_message():
    payload = request.get_json(silent=True) or {}
    sender_role = payload.get("senderRole", "user")
    receiver_role = payload.get("receiverRole", "analyst")
    receiver_roles = payload.get("receiverRoles")
    text = payload.get("text", "").strip()
    user_id = payload.get("userId", "")
    if not text:
        return jsonify({"message": "text is required"}), 400
    target = receiver_roles if isinstance(receiver_roles, list) and receiver_roles else receiver_role
    return jsonify(prediction_service.send_message(sender_role, target, text, user_id))


@prediction_bp.get("/messages/inbox/<role>")
def inbox(role: str):
    return jsonify(prediction_service.get_inbox(role))


@prediction_bp.get("/notifications/<role>")
def notifications(role: str):
    return jsonify(prediction_service.get_notifications(role))
