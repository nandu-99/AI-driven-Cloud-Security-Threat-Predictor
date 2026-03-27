import numpy as np

try:
    from sklearn.ensemble import RandomForestClassifier
except Exception:  # pragma: no cover
    RandomForestClassifier = None


def train_random_forest(x: np.ndarray, y: np.ndarray) -> str:
    if RandomForestClassifier is None:
        return "skipped (scikit-learn not installed)"
    model = RandomForestClassifier(n_estimators=120, random_state=42)
    model.fit(x, y)
    return "trained"
