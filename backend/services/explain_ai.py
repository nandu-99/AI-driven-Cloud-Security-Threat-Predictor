from services.app_state import prediction_service


def get_admin_raw_xai():
    return prediction_service.admin_raw_view()


def get_analyst_abstraction():
    return prediction_service.analyst_abstract_view()


def get_user_explanation(user_id: str):
    return prediction_service.explain_user(user_id)
