import { useCallback, useEffect, useState } from 'react'
import { AlertCircle } from 'tabler-icons-react'
import {
  api,
  type AnomalyRecord,
  type Forecast,
  type HistoryRecord,
  type KPIs,
  type ModelMetrics,
  type Schedule,
} from './api/client'
import AnomalyChart from './components/AnomalyChart'
import EnergyChart from './components/EnergyChart'
import ForecastHero from './components/ForecastHero'
import Header from './components/Header'
import IntroSplash from './components/IntroSplash'
import KPIStrip from './components/KPIStrip'
import ModelMetricsCard from './components/ModelMetricsCard'
import ScheduleAdvisor from './components/ScheduleAdvisor'
import WhatIfSimulator from './components/WhatIfSimulator'
import { useReveal } from './hooks/useReveal'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 mb-4">
      <span className="text-[11px] text-[#5E6B7E] font-semibold tracking-[0.2em] uppercase">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-teal-400/25 to-transparent" />
    </div>
  )
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useReveal<HTMLElement>(delay)
  return (
    <section ref={ref} className="reveal">
      {children}
    </section>
  )
}

export default function App() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([])
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [splashGone, setSplashGone] = useState(false)

  const fetchAll = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.kpis(),
      api.history(),
      api.forecast(),
      api.schedule(),
      api.anomalies(),
      api.metrics(),
    ])
      .then(([k, h, f, s, a, m]) => {
        setKpis(k)
        setHistory(h)
        setForecast(f)
        setSchedule(s)
        setAnomalies(a)
        setMetrics(m)
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="text-rose-400 w-12 h-12 mx-auto mb-3" />
          <h2 className="text-white font-semibold text-lg mb-2">Backend Unreachable</h2>
          <p className="text-slate-500 text-sm mb-4">
            Start the FastAPI server before opening the dashboard:
          </p>
          <code className="block bg-white/5 rounded-lg px-4 py-3 text-teal-400 text-sm">
            cd backend &amp;&amp; uvicorn main:app --reload
          </code>
          <button
            onClick={fetchAll}
            className="mt-4 px-4 py-2 rounded-lg bg-teal-400/15 border border-teal-400/30 text-teal-400 text-sm font-medium hover:bg-teal-400/25 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!splashGone) {
    return <IntroSplash loading={loading} onDone={() => setSplashGone(true)} />
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-[1340px] mx-auto px-10 pt-[34px] pb-20 flex flex-col gap-[30px]">
        {/* Decision first: tomorrow's forecast + what to do about it */}
        <RevealSection>
          <ForecastHero forecast={forecast} history={history} kpis={kpis} />
        </RevealSection>

        {/* KPI strip */}
        <RevealSection delay={80}>
          <KPIStrip kpis={kpis} />
        </RevealSection>

        {/* Schedule Advisor */}
        <RevealSection delay={120}>
          <SectionLabel>Load Scheduling</SectionLabel>
          <ScheduleAdvisor data={schedule} ebRate={kpis?.eb_rate} dgRate={kpis?.dg_rate} />
        </RevealSection>

        {/* History + Anomalies */}
        <RevealSection>
          <SectionLabel>Historical Analysis</SectionLabel>
          <div className="grid grid-cols-2 gap-5">
            <EnergyChart data={history} />
            <AnomalyChart data={anomalies} />
          </div>
        </RevealSection>

        {/* Simulation + Model quality */}
        <RevealSection>
          <SectionLabel>Simulation & Model Performance</SectionLabel>
          <div className="grid grid-cols-[3fr_2fr] gap-5">
            <WhatIfSimulator />
            <ModelMetricsCard data={metrics} />
          </div>
        </RevealSection>
      </main>
    </div>
  )
}
