import numpy as np
from sklearn.ensemble import IsolationForest


def train_isolation_forest(x: np.ndarray) -> str:
    model = IsolationForest(contamination=0.2, random_state=42)
    model.fit(x)
    return "trained"
