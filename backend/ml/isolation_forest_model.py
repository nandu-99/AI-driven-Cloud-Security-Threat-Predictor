import numpy as np

try:
    from sklearn.ensemble import IsolationForest
except Exception:  # pragma: no cover
    IsolationForest = None


def train_isolation_forest(x: np.ndarray) -> str:
    if IsolationForest is None:
        return "skipped (scikit-learn not installed)"
    model = IsolationForest(contamination=0.2, random_state=42)
    model.fit(x)
    return "trained"
