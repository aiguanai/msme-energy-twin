import { useEffect, useState } from 'react'
import {
  api,
  type AnomalyRecord,
  type Forecast,
  type HistoryRecord,
  type KPIs,
  type Schedule,
} from './api/client'
import AnomalyChart from './components/AnomalyChart'
import EnergyChart from './components/EnergyChart'
import ForecastPanel from './components/ForecastPanel'
import Header from './components/Header'
import KPICard from './components/KPICard'
import LoadBalance from './components/LoadBalance'
import ScheduleAdvisor from './components/ScheduleAdvisor'
import WhatIfSimulator from './components/WhatIfSimulator'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[11px] text-slate-600 font-medium tracking-widest uppercase">
        {children}
      </span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  )
}

export default function App() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.kpis(), api.history(), api.forecast(), api.schedule(), api.anomalies()])
      .then(([k, h, f, s, a]) => {
        setKpis(k)
        setHistory(h)
        setForecast(f)
        setSchedule(s)
        setAnomalies(a)
      })
      .catch((e) => setError(String(e)))
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <p className="text-rose-400 text-3xl mb-3">⚠</p>
          <h2 className="text-white font-semibold text-lg mb-2">Backend Unreachable</h2>
          <p className="text-slate-500 text-sm mb-4">
            Start the FastAPI server before opening the dashboard:
          </p>
          <code className="block bg-white/5 rounded-lg px-4 py-3 text-cyan-400 text-sm">
            cd backend &amp;&amp; uvicorn main:app --reload
          </code>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-10">
        {/* KPI Row */}
        <section>
          <SectionLabel>System Overview</SectionLabel>
          <div className="grid grid-cols-5 gap-4">
            <KPICard
              label="Total Energy Consumed"
              value={kpis?.total_energy_kwh ?? 0}
              unit="kWh"
              icon="⚡"
              color="cyan"
              format={(v) => `${(v / 1000).toFixed(1)}K`}
              subtitle={`${kpis?.total_days ?? 0} days`}
            />
            <KPICard
              label="Total Operating Cost"
              value={kpis?.total_cost_rs ?? 0}
              unit="Indian Rupees"
              icon="₹"
              color="violet"
              format={(v) => `${(v / 100000).toFixed(2)}L`}
            />
            <KPICard
              label="CO₂ Emissions (DG)"
              value={kpis?.co2_kg ?? 0}
              unit="Kilograms"
              icon="🌿"
              color="rose"
              format={(v) => Math.round(v).toLocaleString('en-IN')}
            />
            <KPICard
              label="Grid Utilization"
              value={kpis?.grid_pct ?? 0}
              unit="% via EB Grid"
              icon="🔌"
              color="emerald"
              format={(v) => `${v.toFixed(1)}%`}
            />
            <KPICard
              label="DG Activation Days"
              value={kpis?.dg_days ?? 0}
              unit="days DG was used"
              icon="🛢"
              color="amber"
            />
          </div>
        </section>

        {/* Energy Trend */}
        <section>
          <SectionLabel>Historical Analysis</SectionLabel>
          <EnergyChart data={history} />
        </section>

        {/* Forecast + Load Balance */}
        <section>
          <SectionLabel>AI Prediction & Optimization</SectionLabel>
          <div className="grid grid-cols-2 gap-5">
            <ForecastPanel data={forecast} />
            <LoadBalance forecast={forecast} kpis={kpis} />
          </div>
        </section>

        {/* Schedule Advisor */}
        <section>
          <SectionLabel>Load Scheduling</SectionLabel>
          <ScheduleAdvisor data={schedule} />
        </section>

        {/* What-If + Anomaly */}
        <section>
          <SectionLabel>Simulation & Anomaly Detection</SectionLabel>
          <div className="grid grid-cols-2 gap-5">
            <WhatIfSimulator />
            <AnomalyChart data={anomalies} />
          </div>
        </section>
      </main>
    </div>
  )
}
