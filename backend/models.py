import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBRegressor


class EnergyModels:
    def __init__(self):
        self.rf_regressor: RandomForestRegressor | None = None
        self.rf_classifier: RandomForestClassifier | None = None
        self.xgb_forecaster: XGBRegressor | None = None
        self._last_3: np.ndarray | None = None
        self._next_dow: int = 2
        self._next_is_weekend: int = 0

    def train(self, df: pd.DataFrame) -> None:
        # Random Forest — same as notebook Cell 0
        features = ["Production", "DayOfWeek", "IsWeekend"]
        X = df[features]

        self.rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.rf_regressor.fit(X, df["Total_Energy"])

        self.rf_classifier = RandomForestClassifier(
            n_estimators=100, random_state=42, class_weight="balanced"
        )
        self.rf_classifier.fit(X, df["DG_Active"])

        # XGBoost time-series forecaster with lag features (replaces LSTM)
        df2 = df.copy()
        for lag in (1, 2, 3):
            df2[f"Lag{lag}"] = df2["Total_Energy"].shift(lag)
        df2 = df2.dropna(subset=["Lag1", "Lag2", "Lag3"])

        X_ts = df2[["Lag1", "Lag2", "Lag3", "DayOfWeek", "IsWeekend"]]
        y_ts = df2["Total_Energy"]

        self.xgb_forecaster = XGBRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
        self.xgb_forecaster.fit(X_ts, y_ts)

        # Store state for next-day inference
        self._last_3 = df["Total_Energy"].values[-3:]
        last_dow = int(df["DayOfWeek"].values[-1])
        self._next_dow = (last_dow + 1) % 7
        self._next_is_weekend = 1 if self._next_dow >= 5 else 0

    def forecast_tomorrow(self) -> float:
        assert self.xgb_forecaster is not None and self._last_3 is not None
        X = pd.DataFrame(
            [
                {
                    "Lag1": float(self._last_3[-1]),
                    "Lag2": float(self._last_3[-2]),
                    "Lag3": float(self._last_3[-3]),
                    "DayOfWeek": self._next_dow,
                    "IsWeekend": self._next_is_weekend,
                }
            ]
        )
        return float(self.xgb_forecaster.predict(X)[0])

    def predict_whatif(self, production: int, day_of_week: int = 2) -> tuple[float, int, float]:
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
