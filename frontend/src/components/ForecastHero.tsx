import { AlertCircle, ArrowsShuffle, Check } from 'tabler-icons-react'
import type { Forecast, HistoryRecord, KPIs } from '../api/client'
import InfoTip from './InfoTip'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  forecast: Forecast | null
  history: HistoryRecord[]
  kpis: KPIs | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-card p-3 text-xs space-y-1 min-w-[150px]">
      <p className="text-slate-400 font-medium">{label}</p>
      {d.actual != null && (
        <p className="text-white font-semibold tabular-nums">
          {Math.round(d.actual).toLocaleString('en-IN')} kWh actual
        </p>
      )}
      {d.predicted != null && d.actual == null && (
        <>
          <p className="text-teal-300 font-semibold tabular-nums">
            {Math.round(d.predicted).toLocaleString('en-IN')} kWh forecast
          </p>
          {d.band && (
            <p className="text-slate-500 tabular-nums">
              {Math.round(d.band[0]).toLocaleString('en-IN')} – {Math.round(d.band[1]).toLocaleString('en-IN')} likely range
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function ForecastHero({ forecast, history, kpis }: Props) {
  if (!forecast || !kpis) {
    return (
      <div className="glass-card p-8 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-1/4 mb-6" />
        <div className="h-56 bg-white/5 rounded" />
      </div>
    )
  }

  const { predicted_kwh, safe, projected_cost, safe_grid_limit, recommendation, horizon } = forecast
  const pct = (predicted_kwh / safe_grid_limit) * 100

  const recent = history.slice(-7).map((h, i, arr) => ({
    date: h.Date.split(' ').slice(0, 2).join(' '),
    actual: h.Total_Energy,
    // connect the dashed forecast line to the last actual point
    predicted: i === arr.length - 1 ? h.Total_Energy : null,
    band: null as [number, number] | null,
  }))
  const future = horizon.map((h) => ({
    date: h.date,
    actual: null as number | null,
    predicted: h.predicted_kwh,
    band: [h.lo, h.hi] as [number, number],
  }))
  const chartData = [...recent, ...future]

  const numberGradient = safe
    ? 'linear-gradient(135deg, #5EEAD4 0%, #2DD4BF 45%, #818CF8 130%)'
    : 'linear-gradient(135deg, #FCD34D 0%, #FBBF24 45%, #FB7185 130%)'

  return (
    <div
      className="grid grid-cols-[360px_1fr] gap-0 rounded-[22px] overflow-hidden border border-white/[0.08]"
      style={{
        background: 'linear-gradient(165deg,#161B24 0%,#0E121A 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 70px -30px rgba(45,212,191,0.4), 0 34px 70px -40px rgba(0,0,0,0.9)',
      }}
    >
      {/* Left: headline figure */}
      <div
        className="flex flex-col gap-[22px] p-[34px] border-r border-white/[0.06]"
        style={{ background: 'linear-gradient(180deg,rgba(45,212,191,0.05),transparent 40%)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold tracking-[0.22em] uppercase text-[#5E6B7E]">
            Tomorrow's Forecast
          </span>
          <span
            className={`flex items-center gap-1.5 px-[11px] py-1 rounded-full text-[11.5px] font-bold border ${
              safe
                ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/[0.28]'
                : 'text-amber-400 bg-amber-400/10 border-amber-400/[0.28]'
            }`}
          >
            {safe ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {safe ? 'Grid Safe' : 'DG Risk'}
          </span>
        </div>

        <div>
          <p
            className="font-display text-[74px] leading-[0.9] font-bold tabular-nums"
            style={{
              letterSpacing: '-0.03em',
              background: numberGradient,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 26px ${safe ? 'rgba(45,212,191,0.4)' : 'rgba(251,191,36,0.4)'})`,
            }}
          >
            {predicted_kwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[13px] text-[#7C8A99] mt-2">
            kWh predicted demand · <span className="text-[#A9B6C5]">{horizon[0]?.date}</span>
          </p>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-[#7C8A99] mb-[7px] whitespace-nowrap">
            <span>
              <span className="text-teal-300 font-semibold">{pct.toFixed(1)}%</span> of limit
            </span>
            <span>{safe_grid_limit.toLocaleString('en-IN')} kWh ceiling</span>
          </div>
          <div
            className="h-[9px] rounded-full bg-white/5 overflow-hidden"
            role="progressbar"
            aria-label="Grid utilization"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: safe
                  ? 'linear-gradient(90deg,#2DD4BF,#5EEAD4)'
                  : 'linear-gradient(90deg,#FBBF24,#FB7185)',
                boxShadow: safe ? '0 0 16px rgba(45,212,191,0.7)' : '0 0 16px rgba(251,191,36,0.5)',
              }}
            />
          </div>
        </div>

        <div className="mt-auto pt-5 border-t border-white/[0.07] flex justify-between items-end">
          <div>
            <p className="text-[10.5px] tracking-[0.12em] uppercase text-[#5E6B7E]">Projected Cost</p>
            <p className="font-display text-[26px] font-semibold text-[#F4F8FB] tabular-nums mt-1">
              ₹{projected_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] tracking-[0.12em] uppercase text-[#5E6B7E]">Source</p>
            <p
              className="text-[13px] font-semibold mt-1.5"
              style={{ color: safe ? '#6EE7B7' : '#FBBF24' }}
            >
              {safe ? `Grid · ₹${kpis.eb_rate}/kWh` : `Grid + DG · ₹${kpis.dg_rate}/kWh`}
            </p>
          </div>
        </div>
      </div>

      {/* Right: 7-day band chart */}
      <div className="flex flex-col" style={{ padding: '30px 32px' }}>
        <div className="flex items-start justify-between mb-[18px]">
          <div>
            <div className="text-[15px] font-semibold text-[#F4F8FB]">7-Day Outlook</div>
            <div className="text-[12px] text-[#7C8A99] mt-[3px]">
              Shaded band shows the 95% likely range · widens further out
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 h-0.5 rounded-sm bg-[#C7D2DE]" />
              <span className="text-[11px] text-[#7C8A99]">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3.5 border-t-2 border-dashed border-teal-300" />
              <span className="text-[11px] text-[#7C8A99]">Forecast</span>
            </div>
            <span className="text-[10.5px] font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/25 rounded-full px-[9px] py-[3px]">
              LSTM
            </span>
            <InfoTip text="An LSTM neural network reads the last 3 days of consumption and projects the next 7. The shaded band is the 95% likely range; it widens further out because each prediction feeds the next. The strip below shows the cheapest action for tomorrow." />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5E6B7E' }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#5E6B7E' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
              width={36}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={safe_grid_limit}
              stroke="#fb7185"
              strokeDasharray="6 4"
              strokeOpacity={0.6}
              label={{ value: 'Grid limit', position: 'insideTopRight', fill: '#fb7185', fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="band"
              stroke="none"
              fill="url(#bandGrad)"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#C7D2DE"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#C7D2DE', strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#2dd4bf"
              strokeWidth={2}
              strokeDasharray="5 4"
              className="stroke-glow-cyan"
              dot={{ r: 3, fill: '#2dd4bf', strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendation / status strip spans the full width */}
      {recommendation ? (
        <div
          className="col-span-2 flex items-center gap-3 px-8 py-[15px] border-t border-amber-500/[0.18]"
          style={{ background: 'rgba(251,191,36,0.07)' }}
        >
          <ArrowsShuffle className="text-amber-400 w-[18px] h-[18px] shrink-0" />
          <p className="text-[13px] text-[#C7D2DE] flex-1">{recommendation.action}</p>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-[10px] text-[#5E6B7E]">Without shift</p>
              <p className="font-display text-[13px] font-semibold text-white tabular-nums">
                ₹{recommendation.cost_without_shifting.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#5E6B7E]">After shift</p>
              <p className="font-display text-[13px] font-semibold text-emerald-400 tabular-nums">
                ₹{recommendation.cost_after_shifting.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#5E6B7E]">Savings</p>
              <p className="font-display text-[13px] font-bold text-teal-300 tabular-nums">
                ₹{recommendation.savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="col-span-2 flex items-center gap-3 px-8 py-[15px] border-t border-emerald-500/[0.18]"
          style={{ background: 'rgba(52,211,153,0.07)' }}
        >
          <Check className="text-emerald-300 w-[18px] h-[18px] shrink-0" />
          <p className="text-[13px] text-[#C7D2DE]">
            Grid is sufficient.{' '}
            <span className="text-[#9AA7B8]">
              No diesel generation expected tomorrow, and energy stays at the ₹{kpis.eb_rate}/kWh grid
              rate.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
