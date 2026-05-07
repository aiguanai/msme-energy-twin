from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from data import CO2_FACTOR, DG_RATE, EB_RATE, SAFE_GRID_LIMIT, compute_kpis, load_data
from models import models

_df: pd.DataFrame | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _df
    _df = load_data()
    models.train(_df)
    print(f"[DigiTwin] Loaded {len(_df)} records — models ready.")
    yield


app = FastAPI(title="MSME Digital Twin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _df_safe() -> pd.DataFrame:
    assert _df is not None, "Data not loaded"
    return _df


@app.get("/api/kpis")
def get_kpis():
    return compute_kpis(_df_safe())


@app.get("/api/history")
def get_history():
    df = _df_safe().copy()
    df["Date"] = df["Date"].dt.strftime("%d %b %Y")
    return df[["Date", "EB_Units", "DG_Units", "Total_Energy", "DG_Active"]].to_dict(
        orient="records"
    )


@app.get("/api/forecast")
def get_forecast():
    predicted = models.forecast_tomorrow()
    safe = predicted <= SAFE_GRID_LIMIT

    if safe:
        projected_cost = predicted * EB_RATE
        recommendation = None
    else:
        dg_load = predicted - SAFE_GRID_LIMIT
        cost_unoptimized = SAFE_GRID_LIMIT * EB_RATE + dg_load * DG_RATE
        cost_optimized = predicted * EB_RATE
        projected_cost = cost_unoptimized
        recommendation = {
            "action": f"Shift {dg_load:.0f} kWh of load to off-peak hours",
            "cost_without_shifting": round(cost_unoptimized, 2),
            "cost_after_shifting": round(cost_optimized, 2),
            "savings": round(cost_unoptimized - cost_optimized, 2),
        }

    return {
        "predicted_kwh": round(predicted, 2),
        "safe": safe,
        "projected_cost": round(projected_cost, 2),
        "safe_grid_limit": SAFE_GRID_LIMIT,
        "recommendation": recommendation,
    }


@app.get("/api/schedule")
def get_schedule():
    predicted = models.forecast_tomorrow()
    safe = predicted <= SAFE_GRID_LIMIT

    slots = [
        {"slot": "00:00–06:00", "label": "Night", "base_load": 30},
        {"slot": "06:00–08:00", "label": "Early Morning", "base_load": 50},
        {"slot": "08:00–10:00", "label": "Morning Peak", "base_load": 90},
        {"slot": "10:00–12:00", "label": "Mid Morning", "base_load": 90},
        {"slot": "12:00–14:00", "label": "Afternoon", "base_load": 80},
        {"slot": "14:00–16:00", "label": "Late Afternoon", "base_load": 80},
        {"slot": "16:00–18:00", "label": "Evening", "base_load": 70},
        {"slot": "18:00–24:00", "label": "Night Shift", "base_load": 40},
    ]

    if not safe:
        # Shift heavy production earlier to avoid DG trigger in afternoon
        adjustments = [0, 10, 0, 0, -40, -40, -30, 10]
        for slot, adj in zip(slots, adjustments):
            slot["recommended_load"] = max(20, slot["base_load"] + adj)
            slot["shifted"] = adj < 0
    else:
        for slot in slots:
            slot["recommended_load"] = slot["base_load"]
            slot["shifted"] = False

    return {"predicted_kwh": round(predicted, 2), "safe": safe, "slots": slots}


@app.get("/api/whatif")
def get_whatif(production: int = Query(default=4500, ge=1000, le=8000)):
    energy, dg_active, dg_prob = models.predict_whatif(production)
    safe = energy <= SAFE_GRID_LIMIT

    eb_units = min(energy, SAFE_GRID_LIMIT) if dg_active else energy
    dg_units = max(0.0, energy - SAFE_GRID_LIMIT) if dg_active else 0.0
    cost = eb_units * EB_RATE + dg_units * DG_RATE
    co2 = dg_units * CO2_FACTOR

    return {
        "production": production,
        "predicted_energy_kwh": round(energy, 2),
        "dg_needed": bool(dg_active),
        "dg_probability": round(dg_prob * 100, 1),
        "projected_cost_rs": round(cost, 2),
        "co2_kg": round(co2, 2),
        "safe": safe,
    }


@app.get("/api/anomalies")
def get_anomalies():
    df = _df_safe().copy()
    df["Date"] = df["Date"].dt.strftime("%d %b %Y")
    return df[["Date", "Total_Energy", "Anomaly"]].rename(
        columns={"Date": "date", "Total_Energy": "energy", "Anomaly": "anomaly"}
    ).to_dict(orient="records")
