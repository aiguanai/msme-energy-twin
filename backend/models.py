import warnings

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# Suppress TensorFlow logs
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.models import Sequential


class EnergyModels:
    def __init__(self):
        # Cell 0 models
        self.rf_regressor: RandomForestRegressor | None = None
        self.rf_classifier: RandomForestClassifier | None = None

        # Cell 1 models
        self.xgb_classifier: XGBClassifier | None = None
        self.lstm_model: Sequential | None = None
        self.scaler: MinMaxScaler = MinMaxScaler(feature_range=(0, 1))

        self._scaled_energy: np.ndarray | None = None
        self._look_back: int = 3

    def train(self, df: pd.DataFrame) -> None:
        # ── Cell 0: RF Regressor + RF Classifier (with train_test_split) ──
        features = ["Production", "DayOfWeek", "IsWeekend"]
        X = df[features]
        y_total_energy = df["Total_Energy"]
        y_dg_active = df["DG_Active"]

        X_train, _, y_energy_train, _, y_dg_train, _ = (
            train_test_split(X, y_total_energy, y_dg_active, test_size=0.2, random_state=42)
        )

        self.rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.rf_regressor.fit(X_train, y_energy_train)

        self.rf_classifier = RandomForestClassifier(
            n_estimators=100, random_state=42, class_weight="balanced"
        )
        self.rf_classifier.fit(X_train, y_dg_train)

        # ── Cell 1: XGBoost Classifier (lag1, lag2 → DG_Active) ──
        df2 = df.copy()
        df2["Total_Energy_Lag1"] = df2["Total_Energy"].shift(1)
        df2["Total_Energy_Lag2"] = df2["Total_Energy"].shift(2)
        df_xgb = df2.dropna(subset=["Total_Energy_Lag1", "Total_Energy_Lag2"])

        X_xgb = df_xgb[["Total_Energy_Lag1", "Total_Energy_Lag2"]]
        y_xgb = df_xgb["DG_Active"]

        self.xgb_classifier = XGBClassifier(eval_metric="logloss", random_state=42)
        self.xgb_classifier.fit(X_xgb, y_xgb)

        # ── Cell 1: LSTM (3-day lookback → next-day energy forecast) ──
        self._scaled_energy = self.scaler.fit_transform(df[["Total_Energy"]])

        X_lstm, y_lstm = [], []
        for i in range(len(self._scaled_energy) - self._look_back):
            X_lstm.append(self._scaled_energy[i : i + self._look_back, 0])
            y_lstm.append(self._scaled_energy[i + self._look_back, 0])

        X_lstm = np.reshape(np.array(X_lstm), (-1, self._look_back, 1))
        y_lstm = np.array(y_lstm)

        self.lstm_model = Sequential([
            LSTM(50, return_sequences=False, input_shape=(self._look_back, 1)),
            Dense(25),
            Dense(1),
        ])
        self.lstm_model.compile(optimizer="adam", loss="mean_squared_error")
        self.lstm_model.fit(X_lstm, y_lstm, batch_size=1, epochs=10, verbose=0)

        print("[DigiTwin] LSTM trained successfully.")

    def forecast_tomorrow(self) -> float:
        """LSTM forecast — uses last 3 days of scaled energy."""
        assert self.lstm_model is not None and self._scaled_energy is not None
        last_3 = self._scaled_energy[-self._look_back :]
        last_3_reshaped = np.reshape(last_3, (1, self._look_back, 1))
        predicted_scaled = self.lstm_model.predict(last_3_reshaped, verbose=0)
        return float(self.scaler.inverse_transform(predicted_scaled)[0][0])

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
