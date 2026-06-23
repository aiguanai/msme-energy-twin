import type { HistoryRecord } from '../api/client'
import InfoTip from './InfoTip'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  data: HistoryRecord[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs space-y-1.5 min-w-[160px]">
      <p className="text-slate-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-semibold tabular-nums">
            {Math.round(p.value).toLocaleString('en-IN')} kWh
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EnergyChart({ data }: Props) {
  const display = data.slice(-30)

  return (
    <div className="glass-card lift p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Energy Trend</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">Last {display.length} days: EB, DG & Total consumption</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 bg-white/5 rounded-full px-3 py-1">Daily · kWh</span>
          <InfoTip text="Daily consumption history split by source: grid supply (EB), diesel generator supply (DG), and their total. DG area rising above zero marks the expensive days." />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={display} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradDG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

          <XAxis
            dataKey="Date"
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: string) => v.split(' ').slice(0, 2).join(' ')}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
            width={36}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            formatter={(value) => (
              <span style={{ color: '#94a3b8' }}>{value}</span>
            )}
          />

          <Area
            type="monotone"
            dataKey="Total_Energy"
            name="Total"
            stroke="#2dd4bf"
            strokeWidth={2}
            className="stroke-glow-cyan"
            fill="url(#gradTotal)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="EB_Units"
            name="Grid (EB)"
            stroke="#10b981"
            strokeWidth={1.5}
            className="stroke-glow-emerald"
            fill="url(#gradEB)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="DG_Units"
            name="DG"
            stroke="#f59e0b"
            strokeWidth={1.5}
            className="stroke-glow-amber"
            fill="url(#gradDG)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
