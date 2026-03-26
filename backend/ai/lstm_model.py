import numpy as np

try:
    from tensorflow import keras
except Exception:  # pragma: no cover
    keras = None


def train_lstm(x: np.ndarray, y: np.ndarray) -> str:
    if keras is None:
        return "skipped (tensorflow not installed)"
    x_seq = x.reshape((x.shape[0], 1, x.shape[1]))
    model = keras.Sequential(
        [
            keras.layers.Input(shape=(x_seq.shape[1], x_seq.shape[2])),
            keras.layers.LSTM(24),
            keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    model.fit(x_seq, y, epochs=3, batch_size=8, verbose=0)
    return "trained"
