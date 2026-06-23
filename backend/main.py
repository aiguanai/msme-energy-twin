from contextlib import asynccontextmanager

import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from data import (
    CO2_FACTOR,
    DG_RATE,
    EB_RATE,
    GRID_CO2_FACTOR,
    compute_kpis,
    load_data,
    safe_grid_limit,
)
from models import models

_df: pd.DataFrame | None = None
_safe_limit: float = 9740.0  # overwritten at startup from data


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _df, _safe_limit
    _df = load_data()
    _safe_limit = safe_grid_limit(_df)
    models.train(_df)
    print(f"[DigiTwin] Loaded {len(_df)} records | Safe Grid Limit: {_safe_limit} kWh | models ready.")
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
    horizon = [dict(h) for h in models.forecast_horizon(days=7)]
    last_date = _df_safe()["Date"].max()
    for h in horizon:
        h["date"] = (last_date + pd.Timedelta(days=h["day"])).strftime("%d %b")

    predicted = horizon[0]["predicted_kwh"]
    safe = predicted <= _safe_limit

    if safe:
        projected_cost = predicted * EB_RATE
        recommendation = None
    else:
        dg_load = predicted - _safe_limit
        cost_unoptimized = _safe_limit * EB_RATE + dg_load * DG_RATE
        cost_optimized = predicted * EB_RATE
        projected_cost = cost_unoptimized
        # Net CO2 avoided by serving dg_load from the grid instead of diesel:
        # diesel emissions removed minus grid emissions added (grid isn't carbon-free).
        co2_avoided = dg_load * (CO2_FACTOR - GRID_CO2_FACTOR)
        recommendation = {
            "action": f"Shift {dg_load:.0f} kWh of load to off-peak hours",
            "cost_without_shifting": round(cost_unoptimized, 2),
            "cost_after_shifting": round(cost_optimized, 2),
            "savings": round(cost_unoptimized - cost_optimized, 2),
            "co2_avoided_kg": round(co2_avoided, 2),
        }

    return {
        "predicted_kwh": round(predicted, 2),
        "safe": safe,
        "projected_cost": round(projected_cost, 2),
        "safe_grid_limit": _safe_limit,
        "recommendation": recommendation,
        "horizon": horizon,
    }


@app.get("/api/schedule")
def get_schedule():
    predicted = models.forecast_tomorrow()
    safe = predicted <= _safe_limit

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

    base = [float(s["base_load"]) for s in slots]
    FLOOR = 20.0

    if safe:
        # Forecast is within the safe grid limit: no rescheduling needed.
        for s in slots:
            s["recommended_load"] = s["base_load"]
            s["shifted"] = False
        return {
            "predicted_kwh": round(predicted, 2),
            "safe": safe,
            "grid_ceiling": None,
            "generator_required": False,
            "slots": slots,
        }

    # Unsafe: the forecast exceeds the safe grid limit, so the peak periods
    # would otherwise force costly diesel use. Instead of hardcoded shifts, we
    # derive a per-slot grid ceiling from how far demand exceeds the limit and
    # then move the *minimum* load needed to bring every slot under that
    # ceiling, pouring it into the lowest-load (off-peak) slots first. Total
    # load is conserved — energy is rescheduled, not reduced.
    ratio = _safe_limit / predicted          # < 1 when unsafe
    cap = max(base) * ratio                   # ceiling each slot must respect

    rec = list(base)

    # 1. Trim every over-ceiling (peak) slot down to the cap; pool the excess.
    excess = 0.0
    for i, b in enumerate(base):
        if b > cap:
            excess += b - cap
            rec[i] = cap

    # 2. Pour the pooled load into off-peak slots, most-headroom (lowest base
    #    load) first, filling each only up to the cap so no new peak is created.
    for i in sorted(range(len(base)), key=lambda j: base[j]):
        if excess <= 1e-9:
            break
        if base[i] > cap:        # already trimmed; skip the peak slots
            continue
        add = min(cap - rec[i], excess)
        rec[i] += add
        excess -= add

    # 3. If load remains after every slot is filled to the cap, the grid
    #    genuinely cannot serve the day: spread the remainder evenly and flag
    #    that some diesel generation is unavoidable.
    generator_required = excess > 1e-6
    if generator_required:
        share = excess / len(rec)
        rec = [r + share for r in rec]

    for i, s in enumerate(slots):
        s["recommended_load"] = max(FLOOR, round(rec[i], 1))
        s["shifted"] = rec[i] < base[i] - 1e-9

    return {
        "predicted_kwh": round(predicted, 2),
        "safe": safe,
        "grid_ceiling": round(cap, 1),
        "generator_required": generator_required,
        "slots": slots,
    }


@app.get("/api/whatif")
def get_whatif(
    production: int = Query(default=4500, ge=1000, le=8000),
    day_of_week: int = Query(default=2, ge=0, le=6),
):
    energy, dg_active, dg_prob = models.predict_whatif(production, day_of_week)
    safe = energy <= _safe_limit

    # Cost/CO2 and dg_needed follow the physical split against the grid limit —
    # any energy above the safe limit must come from DG regardless of what the
    # classifier predicts. dg_probability stays classifier-driven (confidence only).
    eb_units = min(energy, _safe_limit)
    dg_units = max(0.0, energy - _safe_limit)
    cost = eb_units * EB_RATE + dg_units * DG_RATE
    # Total carbon footprint = grid emissions + diesel-generator emissions.
    co2 = eb_units * GRID_CO2_FACTOR + dg_units * CO2_FACTOR

    return {
        "production": production,
        "predicted_energy_kwh": round(energy, 2),
        # Physical flag: diesel is required only when demand exceeds the safe
        # grid limit. This keeps dg_needed consistent with the cost and CO2
        # values above. The classifier's view is reported separately as
        # dg_probability (an ML early-warning signal, not a cost driver).
        "dg_needed": bool(dg_units > 0),
        "dg_probability": round(dg_prob * 100, 1),
        "projected_cost_rs": round(cost, 2),
        "co2_kg": round(co2, 2),
        "safe": safe,
    }


@app.get("/api/anomalies")
def get_anomalies():
    df = _df_safe().copy()
    df["Date"] = df["Date"].dt.strftime("%d %b %Y")
    df["deviation_pct"] = ((df["Total_Energy"] - df["Expected"]) / df["Expected"] * 100).round(1)
    return df[["Date", "Total_Energy", "Expected", "deviation_pct", "Anomaly"]].rename(
        columns={
            "Date": "date",
            "Total_Energy": "energy",
            "Expected": "expected",
            "Anomaly": "anomaly",
        }
    ).to_dict(orient="records")


@app.get("/api/models/metrics")
def get_model_metrics():
    return models.metrics
