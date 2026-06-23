# Watchtower

**AI-Driven Digital Twin for Smart Energy Optimization in MSMEs Using IoT-Based Energy Analytics**

An interdisciplinary project that builds an intelligent energy management system for Micro, Small, and Medium Enterprises (MSMEs). The system combines IoT-based data collection, a digital twin model, machine learning, and an AI-powered optimization dashboard to reduce energy costs and carbon emissions.

---

## What This Repo Builds

A full-stack web application that wraps trained ML models into a live, interactive decision-support dashboard:

- **Forecast Hero**: LSTM predicts the next 7 days of energy demand with a 95% uncertainty band, SAFE / DG Risk status, and load-shift savings
- **KPI Strip**: Total energy, cost, CO₂, grid utilisation, and DG activation days
- **Energy Trend**: 30-day area chart showing EB, DG, and total consumption history
- **AI Schedule Advisor**: Hour-by-hour production load recommendations with plain-English operational guidance
- **What-If Simulator**: Interactive slider + day-of-week selector; Random Forest predicts energy, DG probability, cost and CO₂ live
- **Anomaly Detection**: Actual vs expected energy per day (cross-validated RF residuals); flags days whose consumption deviates >2σ from what their production level justifies
- **Model Performance**: Honest holdout metrics: RF MAE / DG accuracy, and the LSTM benchmarked against naive persistence and a 7-day moving average

The UI uses **Aurora** dark theme: void-black (`#090B11`) surfaces with teal/violet accents, observatory glow effects, and bold entrance animations.

---

## ML Models Used

| Model | Type | Purpose |
|---|---|---|
| Random Forest Regressor | sklearn | Predicts energy demand from production target |
| Random Forest Classifier | sklearn | Classifies whether DG will activate |
| LSTM (50 units, 3-day lookback) | TensorFlow / Keras | Time-series forecast of next-day energy demand |

Safe Grid Limit is derived from data: **95% × max observed EB energy**, not hardcoded.

---

## Tech Stack

**Backend**
- Python 3.11
- FastAPI + Uvicorn
- TensorFlow / Keras (LSTM forecaster)
- scikit-learn (Random Forest Regressor + Classifier)
- pandas, openpyxl

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS v3
- Recharts

---

## Project Layout

```
Watchtower/
├── backend/
│   ├── data.py          # Loads msme_data.xlsx, computes KPIs + dynamic safe grid limit
│   ├── models.py        # Trains RF + LSTM at startup (LSTM cached on disk)
│   ├── main.py          # FastAPI app, 7 REST endpoints
│   ├── requirements.txt
│   └── *.keras, *.joblib  # Model cache (generated at runtime)
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed fetch wrappers for all endpoints
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── IntroSplash.tsx    # Full-screen radar scan intro + fade transition
│   │   │   ├── ForecastHero.tsx   # 7-day forecast with uncertainty band + load-shift recommendation
│   │   │   ├── KPIStrip.tsx       # Energy, cost, CO₂, grid %, DG days
│   │   │   ├── EnergyChart.tsx    # 30-day history trend
│   │   │   ├── ScheduleAdvisor.tsx # Hourly load recommendations
│   │   │   ├── WhatIfSimulator.tsx # Interactive RF prediction
│   │   │   ├── AnomalyChart.tsx   # Anomaly detection
│   │   │   ├── ModelMetricsCard.tsx # Benchmark: RF + LSTM vs baselines
│   │   │   └── InfoTip.tsx        # Tooltip component
│   │   ├── hooks/useReveal.ts     # Scroll-triggered entrance animation
│   │   └── App.tsx
│   ├── public/
│   │   ├── logo_icon.png, logo_name.png   # Branding assets
│   │   └── fonts/                 # Self-hosted woff2 fonts (Hanken Grotesk, Space Grotesk)
│   ├── src/index.css              # Global styles: Aurora theme, animations, glow effects
│   ├── tailwind.config.js         # Theme colors, typography, animations
│   └── vite.config.ts
├── msme_data.xlsx        # ⚠ Not tracked by git, add manually (see Setup)
└── .gitignore
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Add the data file

The data file is not tracked by git. Place `msme_data.xlsx` in the project root before running.

```
msme-energy-twin/
└── msme_data.xlsx   ← place here
```

### 2. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

> Note: `tensorflow` is included and required for the LSTM model. Installation may take a few minutes.

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the App

Open **two terminals** from the project root.

**Terminal 1: Backend**
```bash
cd backend
venv\Scripts\activate      # Windows
uvicorn main:app --reload --port 8080
```

On startup you will see:
```
[DigiTwin] RF eval (temporal 80/20) | MAE: ... kWh | DG accuracy: ...%
[DigiTwin] LSTM benchmark (last 20%) | LSTM MAE: ... kWh vs naive: ... kWh, 7-day MA: ... kWh
[DigiTwin] LSTM trained and cached.
[DigiTwin] Loaded 59 records | Safe Grid Limit: 9742.25 kWh | models ready.
```

> The LSTM is cached to `backend/lstm_model.keras`; subsequent restarts load it from disk
> ("LSTM loaded from cache.") and retrain only when `msme_data.xlsx` changes.

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/kpis` | Baseline KPIs: total energy, cost, CO₂, grid %, DG days |
| `GET /api/history` | Full daily history for energy trend charts |
| `GET /api/forecast` | LSTM 7-day demand forecast with uncertainty band + load-shift recommendation |
| `GET /api/schedule` | Hourly production schedule optimised against forecast |
| `GET /api/whatif?production=4500` | RF prediction for any production + day-of-week scenario |
| `GET /api/anomalies` | Actual vs expected energy per day; anomalies = >2σ residual vs production level |
| `GET /api/models/metrics` | Holdout metrics: RF MAE/accuracy, LSTM vs naive vs 7-day MA |

Interactive API docs: **http://localhost:8080/docs**

---
