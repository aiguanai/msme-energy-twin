export interface KPIs {
  total_energy_kwh: number
  total_cost_rs: number
  co2_kg: number
  grid_pct: number
  dg_days: number
  total_days: number
  eb_rate: number
  dg_rate: number
  safe_grid_limit: number
}

export interface HistoryRecord {
  Date: string
  EB_Units: number
  DG_Units: number
  Total_Energy: number
  DG_Active: number
}

export interface Recommendation {
  action: string
  cost_without_shifting: number
  cost_after_shifting: number
  savings: number
}

export interface HorizonPoint {
  day: number
  date: string
  predicted_kwh: number
  lo: number
  hi: number
}

export interface Forecast {
  predicted_kwh: number
  safe: boolean
  projected_cost: number
  safe_grid_limit: number
  recommendation: Recommendation | null
  horizon: HorizonPoint[]
}

export interface ScheduleSlot {
  slot: string
  label: string
  base_load: number
  recommended_load: number
  shifted: boolean
}

export interface Schedule {
  predicted_kwh: number
  safe: boolean
  grid_ceiling: number | null
  generator_required: boolean
  slots: ScheduleSlot[]
}

export interface WhatIf {
  production: number
  predicted_energy_kwh: number
  dg_needed: boolean
  dg_probability: number
  projected_cost_rs: number
  co2_kg: number
  safe: boolean
}

export interface AnomalyRecord {
  date: string
  energy: number
  expected: number
  deviation_pct: number
  anomaly: number
}

export interface ModelMetrics {
  rf_mae: number
  rf_dg_accuracy: number
  lstm_mae: number
  naive_mae: number
  ma7_mae: number
  n_test: number
  forecast_sigma: number
}

const get = <T>(path: string): Promise<T> =>
  fetch(path).then((r) => {
    if (!r.ok) throw new Error(`${path} → ${r.status}`)
    return r.json() as Promise<T>
  })

export const api = {
  kpis: () => get<KPIs>('/api/kpis'),
  history: () => get<HistoryRecord[]>('/api/history'),
  forecast: () => get<Forecast>('/api/forecast'),
  schedule: () => get<Schedule>('/api/schedule'),
  anomalies: () => get<AnomalyRecord[]>('/api/anomalies'),
  whatif: (production: number, dayOfWeek = 2) =>
    get<WhatIf>(`/api/whatif?production=${production}&day_of_week=${dayOfWeek}`),
  metrics: () => get<ModelMetrics>('/api/models/metrics'),
}
