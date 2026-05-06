import type { Forecast, KPIs } from '../api/client'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  forecast: Forecast | null
  kpis: KPIs | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">
        ₹ {Math.round(payload[0].value).toLocaleString('en-IN')}
      </p>
    </div>
  )
}

export default function LoadBalance({ forecast, kpis }: Props) {
  if (!forecast || !kpis) {
    return (
      <div className="glass-card p-6 animate-pulse h-full">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
        <div className="h-48 bg-white/5 rounded" />
      </div>
    )
  }

  const { safe, projected_cost, recommendation } = forecast
  const { eb_rate, dg_rate, safe_grid_limit } = kpis

  const chartData = recommendation
    ? [
        { name: 'Current Plan', cost: recommendation.cost_without_shifting, type: 'warn' },
        { name: 'Optimized Plan', cost: recommendation.cost_after_shifting, type: 'good' },
        { name: 'Savings', cost: recommendation.savings, type: 'save' },
      ]
    : [
        { name: 'EB Rate', cost: eb_rate * 1000, type: 'good', label: `₹${eb_rate}/kWh` },
        { name: 'DG Rate', cost: dg_rate * 1000, type: 'warn', label: `₹${dg_rate}/kWh` },
        { name: "Tomorrow's Cost", cost: projected_cost, type: 'neutral', label: '₹' + Math.round(projected_cost).toLocaleString('en-IN') },
      ]

  const colorMap: Record<string, string> = {
    warn: '#f59e0b',
    good: '#10b981',
    save: '#00d4ff',
    neutral: '#8b5cf6',
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Load Balancing</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {safe ? 'Cost breakdown — grid optimal' : 'Cost impact of load-shift optimization'}
          </p>
        </div>
        <span className="text-[11px] text-slate-500 bg-white/5 rounded-full px-3 py-1">
          {safe ? `Limit: ${safe_grid_limit.toLocaleString('en-IN')} kWh` : 'Savings analysis'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`
            }
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="cost" radius={[6, 6, 0, 0]} animationDuration={900}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={colorMap[entry.type]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {recommendation && (
        <div className="flex items-center gap-2 rounded-xl bg-cyan-400/8 border border-cyan-400/20 px-4 py-3 mt-auto">
          <span className="text-cyan-400 text-lg">💡</span>
          <p className="text-[12px] text-slate-300">
            Shifting load saves{' '}
            <span className="text-cyan-400 font-bold">
              ₹ {recommendation.savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>{' '}
            today by avoiding DG activation.
          </p>
        </div>
      )}

      {safe && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-400/8 border border-emerald-400/20 px-4 py-3 mt-auto">
          <span className="text-emerald-400 text-lg">✅</span>
          <p className="text-[12px] text-slate-300">
            Grid is sufficient. No DG required tomorrow. Projected cost:{' '}
            <span className="text-emerald-400 font-bold">
              ₹ {projected_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
