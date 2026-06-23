import { AlertCircle, ArrowDown, ArrowUp, Check, ClipboardList, GasStation } from 'tabler-icons-react'
import type { Schedule } from '../api/client'
import InfoTip from './InfoTip'
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
  ebRate?: number
  dgRate?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const slot = entry.payload
  const delta = slot.recommended_load - slot.base_load

  let advice: string
  if (slot.shifted) {
    advice = `Load reduced from ${slot.base_load}%. Heavy tasks moved to off-peak slots to stay under the grid ceiling.`
  } else if (delta > 0.05) {
    advice = `Load raised from ${slot.base_load}%, absorbing work shifted out of peak hours.`
  } else {
    advice = 'No change: slot already within the grid ceiling.'
  }

  return (
    <div className="glass-card p-3 text-xs max-w-[220px] space-y-1">
      <p className="text-slate-400 font-medium">{label}</p>
      <p className="text-white font-semibold">{entry.value}% production load</p>
      {slot.shifted && (
        <p className="flex items-center gap-1 text-amber-400 font-medium">
          <ArrowDown className="w-3.5 h-3.5" /> Trimmed to avoid DG trigger
        </p>
      )}
      {!slot.shifted && delta > 0.05 && (
        <p className="flex items-center gap-1 text-emerald-400 font-medium">
          <ArrowUp className="w-3.5 h-3.5" /> Receiving shifted load
        </p>
      )}
      <p className="text-slate-400 mt-1">{advice}</p>
    </div>
  )
}

export default function ScheduleAdvisor({ data, ebRate = 6, dgRate = 15 }: Props) {
  if (!data) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-48 bg-white/5 rounded" />
      </div>
    )
  }

  const { safe, slots, predicted_kwh, grid_ceiling, generator_required } = data
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
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <span className="text-[11px] text-slate-500 bg-white/5 rounded-full px-3 py-1">
            {predicted_kwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh forecast
          </span>
          <InfoTip text="Turns tomorrow's forecast into an hour-by-hour production plan. If demand would breach the safe grid limit, peak slots are trimmed and the work moves to off-peak hours so the diesel generator stays off. Total production is conserved." />
        </div>
      </div>

      {/* Explanation banner */}
      {safe ? (
        <div className="flex gap-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
          <Check className="text-emerald-400 w-5 h-5 shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-emerald-400">Grid capacity is sufficient</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Tomorrow's predicted demand is within the safe grid limit. No load shifting is
              needed. Follow the standard production schedule at normal capacity across all shifts.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
          <AlertCircle className="text-amber-400 w-5 h-5 shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-amber-400">Load shifting recommended: {shiftedCount} peak slots trimmed</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Tomorrow's demand may exceed the safe grid limit, triggering the Diesel Generator (DG)
              at ₹{dgRate}/kWh vs ₹{ebRate}/kWh for grid. The AI has capped every slot at a
              {grid_ceiling != null ? ` ${grid_ceiling}%` : ''} grid ceiling: peak-hour load is
              trimmed and moved into off-peak slots (night and early morning) so total demand
              stays on grid. Total production is conserved, only rescheduled.
            </p>
          </div>
        </div>
      )}

      {/* DG unavoidable badge */}
      {generator_required && (
        <div className="flex gap-3 rounded-xl bg-rose-500/8 border border-rose-500/20 px-4 py-3">
          <GasStation className="text-rose-400 w-5 h-5 shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-rose-400">DG unavoidable</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              Even after shifting, demand exceeds total grid capacity for the day, so some diesel
              generation will be required. Remaining load is spread evenly across all slots.
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 inline-block" />
            <span className="text-slate-500">Normal / raised load: run at recommended %</span>
          </div>
          {!safe && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              <span className="text-slate-500">Trimmed: load moved to off-peak slots</span>
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
              isAnimationActive={false}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props
                return (
                  <rect
                    x={x} y={y} width={width} height={height}
                    fill={payload.shifted ? '#f59e0b' : '#2dd4bf'}
                    fillOpacity={0.75}
                    className={payload.shifted ? 'stroke-glow-amber' : 'stroke-glow-cyan'}
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
              <p className={`font-display text-[18px] font-bold tabular-nums mt-0.5 ${s.shifted ? 'text-amber-400' : 'text-teal-400'}`}>
                {s.recommended_load}%
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {s.shifted ? `Trimmed from ${s.base_load}%` : 'As planned'}
              </p>
            </div>
          ))}
      </div>

      {!safe && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-slate-400" />
            <p className="text-[11px] font-semibold text-slate-400">What this means for operations</p>
          </div>
          <ul className="space-y-1">
            <li className="text-[11px] text-slate-500">
              <span className="text-amber-400 font-medium">Peak hours (amber bars)</span>: Run heavy machinery below normal capacity; defer energy-intensive batches.
            </li>
            <li className="text-[11px] text-slate-500">
              <span className="text-teal-400 font-medium">Off-peak hours (raised cyan bars)</span>: Night and early-morning slots absorb the deferred work; schedule shifted batches here.
            </li>
            <li className="text-[11px] text-slate-500">
              <span className="text-emerald-400 font-medium">Result</span>: Every slot stays under the grid ceiling, avoiding DG activation at ₹{dgRate}/kWh and keeping energy at the ₹{ebRate}/kWh grid rate.
            </li>
          </ul>
        </div>
      )}

    </div>
  )
}
