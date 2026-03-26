import numpy as np
from sklearn.ensemble import RandomForestClassifier


def train_random_forest(x: np.ndarray, y: np.ndarray) -> str:
    model = RandomForestClassifier(n_estimators=120, random_state=42)
    model.fit(x, y)
    return "trained"
