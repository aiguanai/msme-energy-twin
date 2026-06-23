import json
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import cross_val_predict
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings("ignore")

# Suppress TensorFlow logs
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.models import Sequential, load_model

DATA_FILE = Path(__file__).parent.parent / "msme_data.xlsx"
LSTM_FILE = Path(__file__).parent / "lstm_model.keras"
SCALER_FILE = Path(__file__).parent / "lstm_scaler.joblib"
METRICS_FILE = Path(__file__).parent / "model_metrics.json"


class EnergyModels:
    def __init__(self):
        self.rf_regressor: RandomForestRegressor | None = None
        self.rf_classifier: RandomForestClassifier | None = None

        self.lstm_model: Sequential | None = None
        self.scaler: MinMaxScaler = MinMaxScaler(feature_range=(0, 1))

        self._scaled_energy: np.ndarray | None = None
        self._look_back: int = 3

        self.metrics: dict = {}
        self._residual_sigma: float = 0.0
        self._horizon_cache: list[dict] | None = None

    def train(self, df: pd.DataFrame) -> None:
        # ── Random Forest Regressor + Classifier ──
        # Temporal 80/20 split (no shuffle — respects time order) for honest
        # evaluation metrics, then refit on all rows for serving.
        features = ["Production", "DayOfWeek", "IsWeekend"]
        X = df[features]
        y_energy = df["Total_Energy"]
        y_dg = df["DG_Active"]

        split = int(0.8 * len(df))
        X_train, X_test = X.iloc[:split], X.iloc[split:]
        y_energy_train, y_energy_test = y_energy.iloc[:split], y_energy.iloc[split:]
        y_dg_train, y_dg_test = y_dg.iloc[:split], y_dg.iloc[split:]

        eval_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        eval_regressor.fit(X_train, y_energy_train)
        mae = mean_absolute_error(y_energy_test, eval_regressor.predict(X_test))

        eval_classifier = RandomForestClassifier(
            n_estimators=100, random_state=42, class_weight="balanced"
        )
        eval_classifier.fit(X_train, y_dg_train)
        acc = accuracy_score(y_dg_test, eval_classifier.predict(X_test))

        print(f"[DigiTwin] RF eval (temporal 80/20) | MAE: {mae:.1f} kWh | DG accuracy: {acc:.0%}")

        # Refit on full dataset for serving
        self.rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.rf_regressor.fit(X, y_energy)

        self.rf_classifier = RandomForestClassifier(
            n_estimators=100, random_state=42, class_weight="balanced"
        )
        self.rf_classifier.fit(X, y_dg)

        self.metrics = {"rf_mae": round(float(mae), 1), "rf_dg_accuracy": round(float(acc), 3)}

        # ── Residual-based anomaly detection ──
        # Out-of-sample "expected" energy per day (5-fold CV, so each day is
        # predicted by a model that never saw it). A day is anomalous when its
        # actual energy deviates >2σ from what its production level and weekday
        # justify — catches inefficiency, not just absolute spikes.
        expected = cross_val_predict(
            RandomForestRegressor(n_estimators=100, random_state=42), X, y_energy, cv=5
        )
        residuals = y_energy.to_numpy(dtype=float) - expected
        sigma = float(residuals.std())
        df["Expected"] = np.round(expected, 1)
        df["Anomaly"] = (np.abs(residuals) > 2 * sigma).astype(int)

        # ── LSTM (3-day lookback → next-day energy forecast) ──
        # Cached on disk: retrain only when the data file is newer than the
        # saved model (or no saved model exists).
        self._horizon_cache = None
        if self._load_cached_lstm(df):
            print("[DigiTwin] LSTM loaded from cache.")
            return

        # Honest benchmark on a temporal holdout before the final full fit.
        self.metrics.update(self._benchmark_lstm(df))
        print(
            "[DigiTwin] LSTM benchmark (last 20%) | "
            f"LSTM MAE: {self.metrics['lstm_mae']:.0f} kWh vs "
            f"naive: {self.metrics['naive_mae']:.0f} kWh, "
            f"7-day MA: {self.metrics['ma7_mae']:.0f} kWh"
        )

        self._scaled_energy = self.scaler.fit_transform(df[["Total_Energy"]])
        X_lstm, y_lstm = self._build_sequences(self._scaled_energy)

        self.lstm_model = Sequential([
            LSTM(50, return_sequences=False, input_shape=(self._look_back, 1)),
            Dense(25),
            Dense(1),
        ])
        self.lstm_model.compile(optimizer="adam", loss="mean_squared_error")
        self.lstm_model.fit(X_lstm, y_lstm, batch_size=1, epochs=10, verbose=0)

        # One-step residual σ of the serving model — drives the forecast
        # uncertainty band (± 1.96·σ·√k for k days ahead).
        preds = self.scaler.inverse_transform(self.lstm_model.predict(X_lstm, verbose=0))
        actual = self.scaler.inverse_transform(y_lstm.reshape(-1, 1))
        self._residual_sigma = float(np.std(actual - preds))
        self.metrics["forecast_sigma"] = round(self._residual_sigma, 1)

        self.lstm_model.save(LSTM_FILE)
        joblib.dump(self.scaler, SCALER_FILE)
        METRICS_FILE.write_text(json.dumps(self.metrics))
        print("[DigiTwin] LSTM trained and cached.")

    def _build_sequences(self, scaled: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        X, y = [], []
        for i in range(len(scaled) - self._look_back):
            X.append(scaled[i : i + self._look_back, 0])
            y.append(scaled[i + self._look_back, 0])
        return np.reshape(np.array(X), (-1, self._look_back, 1)), np.array(y)

    def _benchmark_lstm(self, df: pd.DataFrame) -> dict:
        """Temporal 80/20 holdout: eval-LSTM (trained on first 80%) vs naive
        persistence (tomorrow = today) and 7-day moving average."""
        energy = df["Total_Energy"].to_numpy(dtype=float)
        n = len(energy)
        split = int(0.8 * n)

        actual = energy[split:]
        naive_mae = float(np.mean(np.abs(actual - energy[split - 1 : n - 1])))
        ma7 = np.array([energy[max(0, i - 7) : i].mean() for i in range(split, n)])
        ma7_mae = float(np.mean(np.abs(actual - ma7)))

        scaler = MinMaxScaler(feature_range=(0, 1)).fit(energy[:split].reshape(-1, 1))
        X_seq, y_seq = self._build_sequences(scaler.transform(energy.reshape(-1, 1)))
        # Sequence j predicts day j + look_back: train where the target is in
        # the first 80%, test on the rest.
        train_mask = np.arange(len(y_seq)) + self._look_back < split

        eval_model = Sequential([
            LSTM(50, return_sequences=False, input_shape=(self._look_back, 1)),
            Dense(25),
            Dense(1),
        ])
        eval_model.compile(optimizer="adam", loss="mean_squared_error")
        eval_model.fit(X_seq[train_mask], y_seq[train_mask], batch_size=1, epochs=10, verbose=0)

        preds = scaler.inverse_transform(eval_model.predict(X_seq[~train_mask], verbose=0)).ravel()
        truth = scaler.inverse_transform(y_seq[~train_mask].reshape(-1, 1)).ravel()
        lstm_mae = float(np.mean(np.abs(truth - preds)))

        return {
            "lstm_mae": round(lstm_mae, 1),
            "naive_mae": round(naive_mae, 1),
            "ma7_mae": round(ma7_mae, 1),
            "n_test": int((~train_mask).sum()),
        }

    def _load_cached_lstm(self, df: pd.DataFrame) -> bool:
        """Load LSTM + scaler + metrics from disk if cache is newer than the data file."""
        if not (
            LSTM_FILE.exists() and SCALER_FILE.exists()
            and METRICS_FILE.exists() and DATA_FILE.exists()
        ):
            return False
        if DATA_FILE.stat().st_mtime > LSTM_FILE.stat().st_mtime:
            return False  # data changed since last train
        try:
            self.lstm_model = load_model(LSTM_FILE)
            self.scaler = joblib.load(SCALER_FILE)
            self._scaled_energy = self.scaler.transform(df[["Total_Energy"]])
            cached = json.loads(METRICS_FILE.read_text())
            self._residual_sigma = float(cached.get("forecast_sigma", 0.0))
            self.metrics = {**cached, **self.metrics}  # RF metrics are fresh
            return True
        except Exception:
            return False

    def forecast_horizon(self, days: int = 7) -> list[dict]:
        """Recursive multi-day LSTM forecast with a widening uncertainty band.

        Each step feeds the previous prediction back in as input. The band is
        ± 1.96·σ·√k where σ is the one-step residual std of the serving model.
        """
        assert self.lstm_model is not None and self._scaled_energy is not None
        if self._horizon_cache is not None and len(self._horizon_cache) >= days:
            return self._horizon_cache[:days]

        seq = list(self._scaled_energy[-self._look_back :, 0])
        horizon: list[dict] = []
        for k in range(1, days + 1):
            window = np.reshape(np.array(seq[-self._look_back :]), (1, self._look_back, 1))
            p_scaled = float(self.lstm_model.predict(window, verbose=0)[0][0])
            seq.append(p_scaled)
            p = float(self.scaler.inverse_transform([[p_scaled]])[0][0])
            half = 1.96 * self._residual_sigma * float(np.sqrt(k))
            horizon.append({
                "day": k,
                "predicted_kwh": round(p, 2),
                "lo": round(max(p - half, 0.0), 2),
                "hi": round(p + half, 2),
            })

        self._horizon_cache = horizon
        return horizon

    def forecast_tomorrow(self) -> float:
        """LSTM forecast for the next day (first point of the horizon)."""
        return self.forecast_horizon(days=1)[0]["predicted_kwh"]

    def predict_whatif(self, production: int, day_of_week: int = 2) -> tuple[float, int, float]:
        """RF Regressor + Classifier for what-if scenario prediction."""
        assert self.rf_regressor is not None and self.rf_classifier is not None
        is_weekend = 1 if day_of_week >= 5 else 0
        X = pd.DataFrame(
            [{"Production": production, "DayOfWeek": day_of_week, "IsWeekend": is_weekend}]
        )
        energy = float(self.rf_regressor.predict(X)[0])
        dg_active = int(self.rf_classifier.predict(X)[0])
        dg_prob = float(self.rf_classifier.predict_proba(X)[0][1])
        return energy, dg_active, dg_prob


models = EnergyModels()
