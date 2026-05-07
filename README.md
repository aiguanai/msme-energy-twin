# msme-energy-twin

**AI-Driven Digital Twin for Smart Energy Optimization in MSMEs Using IoT-Based Energy Analytics**

An interdisciplinary project that builds an intelligent energy management system for Micro, Small, and Medium Enterprises (MSMEs). The system combines IoT-based data collection, a digital twin model, machine learning, and an AI-powered optimization dashboard to reduce energy costs and carbon emissions.

---

## What This Repo Builds

A full-stack web application that wraps trained ML models into a live, interactive decision-support dashboard:

- **KPI Dashboard** — Animated summary cards for total energy, cost, CO₂, grid utilisation, and DG activation days
- **Energy Trend** — 30-day area chart showing EB, DG, and total consumption history
- **AI Forecast** — LSTM time-series model predicts tomorrow's energy demand with a SAFE / DG Risk status badge
- **Load Balancing** — Cost comparison between unoptimised (DG-triggered) and optimised (load-shifted) plans with exact savings
- **AI Schedule Advisor** — Hour-by-hour production load recommendations with plain-English operational guidance
- **What-If Simulator** — Interactive slider + day-of-week selector; Random Forest predicts energy, DG probability, cost and CO₂ live
- **Anomaly Detection** — Line chart flagging days with consumption deviating >2σ from the 7-day rolling mean

---

## ML Models Used

| Model | Type | Purpose |
|---|---|---|
| Random Forest Regressor | sklearn | Predicts energy demand from production target |
| Random Forest Classifier | sklearn | Classifies whether DG will activate |
| LSTM (50 units, 3-day lookback) | TensorFlow / Keras | Time-series forecast of next-day energy demand |

Safe Grid Limit is derived from data: **95% × max observed EB energy** — not hardcoded.

---

## Tech Stack

**Backend**
- Python 3.11
- FastAPI + Uvicorn
- TensorFlow / Keras (LSTM forecaster)
- scikit-learn (Random Forest Regressor + Classifier)
- XGBoost
- pandas, openpyxl

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS v3
- Recharts

---

## Project Layout

```
msme-energy-twin/
├── backend/
│   ├── data.py          # Loads msme_data.xlsx, computes KPIs + dynamic safe grid limit
│   ├── models.py        # Trains RF (Cell 0) + XGBoost + LSTM (Cell 1) at startup
│   ├── main.py          # FastAPI app — 6 REST endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed fetch wrappers for all endpoints
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── EnergyChart.tsx
│   │   │   ├── ForecastPanel.tsx
│   │   │   ├── LoadBalance.tsx
│   │   │   ├── ScheduleAdvisor.tsx
│   │   │   ├── WhatIfSimulator.tsx
│   │   │   └── AnomalyChart.tsx
│   │   └── App.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts
├── msme_data.xlsx        # ⚠ Not tracked by git — add manually (see Setup)
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

**Terminal 1 — Backend**
```bash
cd backend
venv\Scripts\activate      # Windows
uvicorn main:app --reload --port 8080
```

On startup you will see:
```
[DigiTwin] LSTM trained successfully.
[DigiTwin] Loaded 59 records — Safe Grid Limit: 9742.25 kWh — models ready.
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/kpis` | Baseline KPIs — total energy, cost, CO₂, grid %, DG days |
| `GET /api/history` | Full daily history for energy trend charts |
| `GET /api/forecast` | LSTM next-day demand prediction + load-shift recommendation |
| `GET /api/schedule` | Hourly production schedule optimised against forecast |
| `GET /api/whatif?production=4500` | RF prediction for any production + day-of-week scenario |
| `GET /api/anomalies` | Days flagged as anomalous (>2σ from 7-day rolling mean) |

Interactive API docs: **http://localhost:8080/docs**

---

## Data

Source: `Project_Calcs` sheet of `msme_data.xlsx` — 59 days (January–February 2026) with real production values, EB/DG units, cost, and CO₂ pre-computed by the team.

| KPI | Value |
|---|---|
| Total Energy | 526,625 kWh |
| Total Cost | Rs 3,230,130 |
| CO₂ Emissions | 6,256 kg |
| Grid Utilisation | 98.5% |
| DG Activation Days | 6 |
| Safe Grid Limit | 9,742 kWh (derived from data) |
