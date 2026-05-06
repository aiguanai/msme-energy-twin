import type { Schedule } from '../api/client'
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
  data: Schedule | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="glass-card p-3 text-xs max-w-[180px]">
      <p className="text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-white font-semibold">{entry.value}% load</p>
      {entry.payload.shifted && (
        <p className="text-amber-400 mt-1">⬇ Shifted to avoid DG trigger</p>
      )}
    </div>
  )
}

export default function ScheduleAdvisor({ data }: Props) {
  if (!data) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-48 bg-white/5 rounded" />
      </div>
    )
  }

  const { safe, slots, predicted_kwh } = data

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-semibold text-white">AI Schedule Advisor</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {safe
              ? 'Optimal production schedule — grid load within safe limits'
              : 'Recommended load distribution to avoid DG activation'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!safe && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="text-slate-500">Shifted slots</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-500">Normal load</span>
          </div>
          <span className="text-[11px] text-slate-500 bg-white/5 rounded-full px-3 py-1">
            {predicted_kwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh forecast
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={slots.map((s) => ({ ...s, name: s.slot }))}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barSize={32}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="slot"
            tick={{ fontSize: 9, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="recommended_load" radius={[5, 5, 0, 0]} animationDuration={800}>
            {slots.map((s, i) => (
              <Cell
                key={i}
                fill={s.shifted ? '#f59e0b' : '#00d4ff'}
                fillOpacity={s.shifted ? 0.7 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {!safe && (
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-[11px] text-slate-500">Peak Window</p>
            <p className="text-[13px] font-semibold text-cyan-400 mt-0.5">06:00 – 12:00</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-[11px] text-slate-500">Reduce Load</p>
            <p className="text-[13px] font-semibold text-amber-400 mt-0.5">12:00 – 18:00</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-[11px] text-slate-500">Strategy</p>
            <p className="text-[13px] font-semibold text-emerald-400 mt-0.5">Front-load shift</p>
          </div>
        </div>
      )}
    </div>
  )
}
