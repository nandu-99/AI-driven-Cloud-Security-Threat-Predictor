import numpy as np

try:
    from xgboost import XGBClassifier
except Exception:  # pragma: no cover
    XGBClassifier = None


def train_xgboost(x: np.ndarray, y: np.ndarray) -> str:
    if XGBClassifier is None:
        return "skipped (xgboost not installed)"
    model = XGBClassifier(n_estimators=80, max_depth=4, learning_rate=0.1, eval_metric="logloss")
    model.fit(x, y)
    return "trained"
