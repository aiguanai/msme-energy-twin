# msme-energy-twin

**AI-Driven Digital Twin for Smart Energy Optimization in MSMEs Using IoT-Based Energy Analytics**

An interdisciplinary project that builds an intelligent energy management system for Micro, Small, and Medium Enterprises (MSMEs). The system combines IoT-based data collection, a digital twin model, machine learning, and an AI-powered optimization dashboard to reduce energy costs and carbon emissions.

---

## What This Repo Builds

A full-stack web application that wraps the trained ML models into a live, interactive dashboard:

- **AI Forecast** — Predicts tomorrow's energy demand using an XGBoost time-series model trained on historical EB/DG data
- **Load Balancing** — Compares grid-only vs DG-triggered cost, calculates savings from load shifting
- **Schedule Advisor** — Recommends an hour-by-hour production schedule to stay within the safe grid limit (9,000 kWh)
- **What-If Simulator** — Drag a slider to any production target; Random Forest predicts energy, DG need, cost and CO₂ in real time
- **Anomaly Detection** — Flags days with consumption deviating >2σ from the 7-day rolling mean
- **KPI Dashboard** — Animated summary cards for total energy, cost, CO₂, grid utilisation, and DG days

---

## Tech Stack

**Backend**
- Python 3.11
- FastAPI + Uvicorn
- scikit-learn (Random Forest Regressor + Classifier)
- XGBoost (time-series energy forecaster)
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
│   ├── data.py          # Loads msme_data.xlsx, computes KPIs, anomaly detection
│   ├── models.py        # Trains RF + XGBoost models at startup
│   ├── main.py          # FastAPI app — 6 REST endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Typed fetch wrappers
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

### 2. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Install frontend dependencies

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
uvicorn main:app --reload --port 8080
```

The server starts, loads the data, and trains the models. You should see:
```
[DigiTwin] Loaded 59 records — models ready.
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
| `GET /api/history` | Full daily history for trend charts |
| `GET /api/forecast` | XGBoost next-day demand prediction + load-shift recommendation |
| `GET /api/schedule` | Hourly load schedule optimised against forecast |
| `GET /api/whatif?production=4500` | RF prediction for any production scenario |
| `GET /api/anomalies` | Days flagged as anomalous (>2σ from 7-day rolling mean) |

Interactive API docs available at **http://localhost:8080/docs** when the backend is running.

---

## Data
We used the `Project_Calcs` sheet of `msme_data.xlsx` with production values, EB/DG units, cost, and CO₂ pre-computed.