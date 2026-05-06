import type { AnomalyRecord } from '../api/client'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  data: AnomalyRecord[]
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  if (!payload) return null
  if (payload.anomaly) {
    return (
      <g key={`anomaly-${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={7} fill="#ef444420" stroke="#ef4444" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={3.5} fill="#ef4444" />
      </g>
    )
  }
  return <circle key={`normal-${cx}-${cy}`} cx={cx} cy={cy} r={2.5} fill="#00d4ff" fillOpacity={0.6} />
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as AnomalyRecord
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-slate-400 mb-1">{d.date}</p>
      <p className="text-white font-semibold">
        {Math.round(d.energy).toLocaleString('en-IN')} kWh
      </p>
      {d.anomaly === 1 && (
        <p className="text-rose-400 mt-1 font-medium">⚠ Anomaly detected</p>
      )}
    </div>
  )
}

export default function AnomalyChart({ data }: Props) {
  const anomalyCount = data.filter((d) => d.anomaly === 1).length

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Anomaly Detection</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Days with consumption deviating &gt;2σ from 7-day rolling mean
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-500">{anomalyCount} anomalies</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-500">{data.length - anomalyCount} normal</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(data.length / 8)}
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

          <Line
            type="monotone"
            dataKey="energy"
            stroke="#00d4ff"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            dot={<CustomDot />}
            activeDot={false}
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>

      {anomalyCount === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-400/8 border border-emerald-400/20 px-4 py-3">
          <span className="text-emerald-400">✓</span>
          <p className="text-[12px] text-slate-300">No anomalies detected in historical data.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-rose-400/8 border border-rose-400/20 px-4 py-3">
          <span className="text-rose-400 text-lg">⚠</span>
          <p className="text-[12px] text-slate-300">
            <span className="text-rose-400 font-semibold">{anomalyCount} anomalous days</span>{' '}
            detected. Review highlighted points for unusual consumption patterns.
          </p>
        </div>
      )}
    </div>
  )
}
