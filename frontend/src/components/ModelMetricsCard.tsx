import type { ModelMetrics } from '../api/client'
import InfoTip from './InfoTip'

interface Props {
  data: ModelMetrics | null
}

function MaeBar({
  label,
  mae,
  max,
  highlight,
}: {
  label: string
  mae: number
  max: number
  highlight?: boolean
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className={highlight ? 'text-teal-400 font-medium' : 'text-slate-500'}>{label}</span>
        <span className="text-slate-400 tabular-nums">{Math.round(mae)} kWh</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${highlight ? 'bg-teal-400' : 'bg-slate-600'}`}
          style={{ width: `${Math.min((mae / max) * 100, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function ModelMetricsCard({ data }: Props) {
  if (!data) {
    return (
      <div className="glass-card p-6 animate-pulse h-full">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
        <div className="h-40 bg-white/5 rounded" />
      </div>
    )
  }

  const maxMae = Math.max(data.lstm_mae, data.naive_mae, data.ma7_mae)
  const best = Math.min(data.lstm_mae, data.naive_mae, data.ma7_mae)

  return (
    <div className="glass-card lift p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Model Performance</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Evaluated on held-out data
          </p>
        </div>
        <InfoTip text="All numbers are measured on held-out days the models never trained on, so they reflect real predictive skill. The benchmark compares the LSTM forecaster against two simple baselines; lower error is better." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[11px] text-slate-500">Energy prediction error</p>
          <p className="font-display text-[20px] font-bold tabular-nums text-teal-400 mt-1">
            ±{Math.round(data.rf_mae)} <span className="text-[12px] text-slate-500">kWh</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">Random Forest · MAE</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
          <p className="text-[11px] text-slate-500">DG prediction accuracy</p>
          <p className="font-display text-[20px] font-bold tabular-nums text-emerald-400 mt-1">
            {(data.rf_dg_accuracy * 100).toFixed(0)}
            <span className="text-[12px] text-slate-500">%</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">Random Forest · classifier</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] text-slate-500 font-medium tracking-widest uppercase">
          Forecaster benchmark · lower is better
        </p>
        <MaeBar label="LSTM (3-day lookback)" mae={data.lstm_mae} max={maxMae} highlight={data.lstm_mae === best} />
        <MaeBar label="Naive (tomorrow = today)" mae={data.naive_mae} max={maxMae} highlight={data.naive_mae === best} />
        <MaeBar label="7-day moving average" mae={data.ma7_mae} max={maxMae} highlight={data.ma7_mae === best} />
      </div>

      <p className="text-[11px] text-slate-600 mt-auto">
        Forecast uncertainty band uses σ = {Math.round(data.forecast_sigma)} kWh from one-step
        training residuals.
      </p>
    </div>
  )
}
