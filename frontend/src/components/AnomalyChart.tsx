import { AlertCircle, Check } from 'tabler-icons-react'
import type { AnomalyRecord } from '../api/client'
import InfoTip from './InfoTip'
import {
  CartesianGrid,
  ComposedChart,
  Line,
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
      <g key={`anomaly-${cx}-${cy}`} className="stroke-glow-magenta">
        <circle cx={cx} cy={cy} r={7} fill="#a78bfa20" stroke="#a78bfa" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={3.5} fill="#a78bfa" />
      </g>
    )
  }
  return <circle key={`normal-${cx}-${cy}`} cx={cx} cy={cy} r={2} fill="#2dd4bf" fillOpacity={0.5} />
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as AnomalyRecord
  return (
    <div className="glass-card p-3 text-xs space-y-1 min-w-[170px]">
      <p className="text-slate-400 mb-1">{d.date}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Actual</span>
        <span className="text-white font-semibold tabular-nums">
          {Math.round(d.energy).toLocaleString('en-IN')} kWh
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Expected</span>
        <span className="text-slate-300 tabular-nums">
          {Math.round(d.expected).toLocaleString('en-IN')} kWh
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Deviation</span>
        <span
          className={`font-medium tabular-nums ${
            d.anomaly ? 'text-violet-400' : 'text-slate-400'
          }`}
        >
          {d.deviation_pct > 0 ? '+' : ''}
          {d.deviation_pct.toFixed(1)}%
        </span>
      </div>
      {d.anomaly === 1 && (
        <div className="flex items-center gap-1 mt-1 font-medium text-violet-400">
          <AlertCircle className="w-4 h-4" />
          <p>Anomaly: far from expected</p>
        </div>
      )}
    </div>
  )
}

export default function AnomalyChart({ data }: Props) {
  const anomalyCount = data.filter((d) => d.anomaly === 1).length

  return (
    <div className="glass-card lift p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">Anomaly Detection</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Actual vs expected energy for each day's production level
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            <span className="text-slate-500">{anomalyCount} anomalies</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-4 h-0.5 bg-slate-500 inline-block" />
            <span className="text-slate-500">expected</span>
          </div>
          <InfoTip text="A cross-validated model predicts how much energy each day should have used given its production volume and weekday (dashed line). Days deviating more than 2 standard deviations from that expectation are flagged as anomalies." />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
            dataKey="expected"
            stroke="#64748b"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#2dd4bf"
            strokeWidth={1.5}
            strokeOpacity={0.7}
            className="stroke-glow-cyan"
            dot={<CustomDot />}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {anomalyCount === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-400/[0.08] border border-emerald-400/20 px-4 py-3">
          <Check className="text-emerald-400 w-5 h-5" />
          <p className="text-[12px] text-slate-300">
            No anomalies. Every day's consumption matches its production level.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-violet-400/[0.08] border border-violet-400/20 px-4 py-3">
          <AlertCircle className="text-violet-400 w-5 h-5" />
          <p className="text-[12px] text-slate-300">
            <span className="text-violet-400 font-semibold">{anomalyCount} anomalous days</span>{' '}
            where consumption was far from what production justified. Hover the highlighted points
            to compare actual vs expected.
          </p>
        </div>
      )}
    </div>
  )
}
