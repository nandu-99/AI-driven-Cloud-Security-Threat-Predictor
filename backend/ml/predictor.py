from services.app_state import prediction_service


def predict_all():
    return prediction_service.predict_all_users()


def predict_one(payload):
    return prediction_service.predict_one(payload)


def train_models():
    return prediction_service.train_models()
