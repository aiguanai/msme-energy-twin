import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'tabler-icons-react'
import { api, type WhatIf } from '../api/client'
import InfoTip from './InfoTip'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function WhatIfSimulator() {
  const [production, setProduction] = useState(4500)
  const [dayOfWeek, setDayOfWeek] = useState(2)
  const [result, setResult] = useState<WhatIf | null>(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      const id = ++requestId.current
      api.whatif(production, dayOfWeek).then((d) => {
        if (id !== requestId.current) return // stale response, newer request in flight
        setResult(d)
        setLoading(false)
      })
    }, 280)
    return () => clearTimeout(t)
  }, [production, dayOfWeek])

  return (
    <div className="glass-card lift p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-white">What-If Simulator</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Adjust production target. AI predicts energy demand & costs in real-time
          </p>
        </div>
        <InfoTip text="A Random Forest trained on production volume and weekday predicts energy demand. Move the slider to see predicted demand, the cost split between grid and diesel, total CO2 (grid plus diesel), and whether the diesel generator is needed — i.e., whether demand exceeds the safe grid limit — for any scenario." />
      </div>

      {/* Controls */}
      <div className="space-y-5">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[12px] text-slate-400 font-medium">Production Target</label>
            <span className="text-[13px] font-bold text-teal-400 tabular-nums">
              {production.toLocaleString('en-IN')} units
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={8000}
            step={50}
            value={production}
            onChange={(e) => setProduction(+e.target.value)}
            className="w-full"
            aria-label="Production target in units"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-600">1,000</span>
            <span className="text-[10px] text-slate-600">8,000 units</span>
          </div>
        </div>

        <div>
          <label className="text-[12px] text-slate-400 font-medium block mb-2">Day of Week</label>
          <div className="flex flex-row gap-1">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => setDayOfWeek(i)}
                aria-label={d}
                aria-pressed={dayOfWeek === i}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                  dayOfWeek === i
                    ? 'bg-teal-400/20 border border-teal-400/40 text-teal-400'
                    : 'bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300'
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={`grid grid-cols-2 gap-3 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
        <ResultCard
          label="Predicted Energy"
          value={result ? `${result.predicted_energy_kwh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kWh` : '–'}
          color={result?.safe ? 'emerald' : 'amber'}
        />
        <ResultCard
          label="DG Needed?"
          value={result ? (result.dg_needed ? 'YES' : 'NO') : '–'}
          color={result?.dg_needed ? 'rose' : 'emerald'}
        />
        <ResultCard
          label="Projected Cost"
          value={result ? `₹ ${result.projected_cost_rs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '–'}
          color="cyan"
        />
        <ResultCard
          label="CO₂ Emissions"
          value={result ? `${result.co2_kg.toFixed(1)} kg` : '–'}
          color={result && result.dg_needed ? 'rose' : 'emerald'}
        />
      </div>

      {result && !result.safe && (
        <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <p className="text-[12px] text-amber-400 font-semibold">Grid Limit Exceeded</p>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            At {production.toLocaleString('en-IN')} units, predicted demand exceeds the safe grid
            limit. DG will activate at higher cost.
          </p>
        </div>
      )}
    </div>
  )
}

function ResultCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: 'cyan' | 'emerald' | 'amber' | 'rose'
}) {
  const textMap = { cyan: 'text-teal-400', emerald: 'text-emerald-400', amber: 'text-amber-400', rose: 'text-rose-400' }
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className={`font-display text-[16px] font-bold tabular-nums mt-1 ${textMap[color]}`}>{value}</p>
    </div>
  )
}
