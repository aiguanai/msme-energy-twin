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

export interface Forecast {
  predicted_kwh: number
  safe: boolean
  projected_cost: number
  safe_grid_limit: number
  recommendation: Recommendation | null
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
  anomaly: number
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
  whatif: (production: number) =>
    get<WhatIf>(`/api/whatif?production=${production}`),
}
