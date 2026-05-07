import type { Schedule } from '../api/client'
import {
  Bar,
  BarChart,
  CartesianGrid,
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
  const slot = entry.payload

  const actionMap: Record<string, string> = {
    'Night':           'Minimal activity. Run only essential systems.',
    'Early Morning':   'Warm-up phase. Begin light machinery.',
    'Morning Peak':    'Run all heavy machinery at full capacity.',
    'Mid Morning':     'Sustain peak production. Most efficient window.',
    'Afternoon':       slot.shifted ? 'Reduce heavy load — grid demand peaks here.' : 'Continue normal operations.',
    'Late Afternoon':  slot.shifted ? 'Shift energy-intensive tasks to earlier slots.' : 'Continue normal operations.',
    'Evening':         slot.shifted ? 'Wind down production to conserve grid capacity.' : 'Moderate operations.',
    'Night Shift':     'Light operations only. Prep for next day.',
  }

  return (
    <div className="glass-card p-3 text-xs max-w-[200px] space-y-1">
      <p className="text-slate-400 font-medium">{label}</p>
      <p className="text-white font-semibold">{entry.value}% production load</p>
      {slot.shifted && (
        <p className="text-amber-400 font-medium">⬇ Load shifted — avoid DG trigger</p>
      )}
      <p className="text-slate-400 mt-1">{actionMap[slot.label] ?? ''}</p>
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
  const shiftedCount = slots.filter((s) => s.shifted).length

  return (
    <div className="glass-card p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">AI Schedule Advisor</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Hour-by-hour production load recommendation based on tomorrow's energy forecast
          </p>
        </div>
        <span className="text-[11px] text-slate-500 bg-white/5 rounded-full px-3 py-1 shrink-0 ml-4">
          {predicted_kwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh forecast
        </span>
      </div>

      {/* Explanation banner */}
      {safe ? (
        <div className="flex gap-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
          <span className="text-emerald-400 text-lg shrink-0">✅</span>
          <div>
            <p className="text-[12px] font-semibold text-emerald-400">Grid capacity is sufficient</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Tomorrow's predicted demand is within the safe grid limit. No load shifting is needed —
              follow the standard production schedule at normal capacity across all shifts.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
          <span className="text-amber-400 text-lg shrink-0">⚠</span>
          <div>
            <p className="text-[12px] font-semibold text-amber-400">Load shifting recommended — {shiftedCount} slots adjusted</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Tomorrow's demand may exceed the safe grid limit, triggering the Diesel Generator (DG)
              at ₹15/kWh vs ₹6/kWh for grid. The AI has redistributed the production schedule below —
              concentrate heavy machinery in the morning and reduce afternoon load to stay on grid.
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
            <span className="text-slate-500">Normal load — run at recommended %</span>
          </div>
          {!safe && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              <span className="text-slate-500">Shifted down — reduce heavy operations</span>
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={slots.map((s) => ({ ...s, name: s.slot }))}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            barSize={36}
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
            <Bar
              dataKey="recommended_load"
              radius={[5, 5, 0, 0]}
              animationDuration={800}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props
                return (
                  <rect
                    x={x} y={y} width={width} height={height}
                    fill={payload.shifted ? '#f59e0b' : '#00d4ff'}
                    fillOpacity={0.75}
                    rx={5} ry={5}
                  />
                )
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-4 gap-3">
        {slots
          .filter((s) => ['Morning Peak', 'Mid Morning', 'Afternoon', 'Evening'].includes(s.label))
          .map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border p-3 ${
                s.shifted
                  ? 'bg-amber-500/8 border-amber-500/20'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}
            >
              <p className={`text-[10px] font-medium ${s.shifted ? 'text-amber-400' : 'text-slate-500'}`}>
                {s.slot}
              </p>
              <p className={`text-[18px] font-bold tabular-nums mt-0.5 ${s.shifted ? 'text-amber-400' : 'text-cyan-400'}`}>
                {s.recommended_load}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {s.shifted ? 'Reduce load' : 'Full capacity'}
              </p>
            </div>
          ))}
      </div>

      {!safe && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">📋 What this means for operations</p>
          <ul className="space-y-1">
            <li className="text-[11px] text-slate-500">
              <span className="text-cyan-400 font-medium">Morning (06:00–12:00)</span> — Schedule all energy-intensive tasks: heavy machinery, compressors, furnaces.
            </li>
            <li className="text-[11px] text-slate-500">
              <span className="text-amber-400 font-medium">Afternoon (12:00–18:00)</span> — Reduce heavy load. Use this time for lighter tasks, maintenance, quality checks.
            </li>
            <li className="text-[11px] text-slate-500">
              <span className="text-emerald-400 font-medium">Result</span> — Total energy demand stays within grid limit, avoiding DG activation and reducing cost per unit.
            </li>
          </ul>
        </div>
      )}

    </div>
  )
}
