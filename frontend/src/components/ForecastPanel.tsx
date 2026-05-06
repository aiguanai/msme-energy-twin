import type { Forecast } from '../api/client'

interface Props {
  data: Forecast | null
}

export default function ForecastPanel({ data }: Props) {
  if (!data) {
    return (
      <div className="glass-card p-6 animate-pulse h-64">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-16 bg-white/5 rounded w-2/3" />
      </div>
    )
  }

  const { predicted_kwh, safe, projected_cost, safe_grid_limit, recommendation } = data
  const pct = Math.min((predicted_kwh / safe_grid_limit) * 100, 120)

  return (
    <div className="glass-card p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">AI Forecast</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">Tomorrow's predicted demand</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${
            safe
              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
              : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
          }`}
        >
          {safe ? '✓ Grid Safe' : '⚠ DG Risk'}
        </span>
      </div>

      <div>
        <p className={`text-5xl font-bold tabular-nums tracking-tight ${safe ? 'text-emerald-400' : 'text-amber-400'}`}>
          {predicted_kwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
        <p className="text-[13px] text-slate-500 mt-1">kWh predicted demand</p>
      </div>

      {/* Grid bar */}
      <div>
        <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
          <span>0 kWh</span>
          <span className="text-slate-400">Safe limit: {safe_grid_limit.toLocaleString('en-IN')} kWh</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              safe
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : 'bg-gradient-to-r from-amber-500 to-red-500'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1">{pct.toFixed(1)}% of grid limit</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
        <div>
          <p className="text-[11px] text-slate-500">Projected Cost</p>
          <p className="text-[18px] font-bold text-white tabular-nums">
            ₹ {projected_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
        {safe && (
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Status</p>
            <p className="text-[13px] text-emerald-400 font-semibold">Grid Sufficient</p>
          </div>
        )}
      </div>

      {recommendation && (
        <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4 space-y-2">
          <p className="text-[12px] font-semibold text-amber-400">🔄 Load-Shift Recommendation</p>
          <p className="text-[12px] text-slate-400">{recommendation.action}</p>
          <div className="flex gap-4 pt-1">
            <div>
              <p className="text-[10px] text-slate-500">Without shift</p>
              <p className="text-[13px] font-semibold text-white">
                ₹ {recommendation.cost_without_shifting.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">After shift</p>
              <p className="text-[13px] font-semibold text-emerald-400">
                ₹ {recommendation.cost_after_shifting.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">Savings</p>
              <p className="text-[13px] font-bold text-cyan-400">
                ₹ {recommendation.savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
