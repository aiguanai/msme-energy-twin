import pandas as pd
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / "msme_data.xlsx"
SHEET = "Project_Calcs"

# Columns in Project_Calcs (0-indexed after header row):
#  0: Date  1: Month  2: Production  3: E_EB  4: E_DG  5: E_total
#  6: EPU   7: Efficiency  8: Cost_RS  9: CO2_kg  10: CO2_per_unit
COL_IDX  = [0, 2, 3, 4, 5, 8, 9]
COL_NAMES = ["Date", "Production", "EB_Units", "DG_Units", "Total_Energy", "Cost_RS", "CO2_kg"]

EB_RATE      = 6
DG_RATE      = 15
CO2_FACTOR   = 0.8
SAFETY_MARGIN = 0.95  # 5% below max observed EB energy


def safe_grid_limit(df: pd.DataFrame) -> float:
    """Safe Grid Limit = 95% × max observed EB energy from data."""
    return round(SAFETY_MARGIN * float(df["EB_Units"].max()), 2)


def load_data() -> pd.DataFrame:
    df = pd.read_excel(DATA_FILE, sheet_name=SHEET, header=0)
    df = df.iloc[:, COL_IDX].set_axis(COL_NAMES, axis=1)

    for col in ["Production", "EB_Units", "DG_Units", "Total_Energy", "Cost_RS", "CO2_kg"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df = df.dropna(subset=["Date"])
    df = df[df["Total_Energy"] > 0].reset_index(drop=True)
    df = df.sort_values("Date").reset_index(drop=True)

    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["IsWeekend"]  = (df["DayOfWeek"] >= 5).astype(int)
    df["DG_Active"]  = (df["DG_Units"] > 0).astype(int)

    # Anomaly detection: days where energy deviates >2σ from 7-day rolling mean
    rolling      = df["Total_Energy"].rolling(7, min_periods=3)
    rolling_mean = rolling.mean()
    rolling_std  = rolling.std().fillna(1)
    df["Anomaly"] = (abs(df["Total_Energy"] - rolling_mean) > 2 * rolling_std).astype(int)

    return df


def compute_kpis(df: pd.DataFrame) -> dict:
    total_energy = float(df["Total_Energy"].sum())
    total_eb     = float(df["EB_Units"].sum())
    total_dg     = float(df["DG_Units"].sum())
    total_cost   = float(df["Cost_RS"].sum())   # pre-computed by teammates
    total_co2    = float(df["CO2_kg"].sum())     # pre-computed by teammates
    dg_days      = int(df["DG_Active"].sum())
    grid_pct     = round((total_eb / total_energy * 100) if total_energy > 0 else 100.0, 1)

    return {
        "total_energy_kwh": round(total_energy, 2),
        "total_cost_rs":    round(total_cost, 2),
        "co2_kg":           round(total_co2, 2),
        "grid_pct":         grid_pct,
        "dg_days":          dg_days,
        "total_days":       len(df),
        "eb_rate":          EB_RATE,
        "dg_rate":          DG_RATE,
        "safe_grid_limit":  safe_grid_limit(df),
    }
