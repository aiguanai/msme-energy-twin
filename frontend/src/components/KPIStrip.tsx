import { useEffect, useRef, useState } from 'react'
import { Bolt, Flask, Leaf, Plug } from 'tabler-icons-react'
import type { KPIs } from '../api/client'
import InfoTip from './InfoTip'

interface Props {
  kpis: KPIs | null
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

function Stat({
  label,
  value,
  unit,
  icon,
  tint,
  format,
}: {
  label: string
  value: number
  unit: string
  icon: React.ReactNode
  tint: string
  format?: (v: number) => string
}) {
  const animated = useCountUp(value)
  const display = format ? format(animated) : Math.round(animated).toLocaleString('en-IN')

  return (
    <div className="px-6 py-5 first:pl-7 last:pr-7">
      <div className="flex items-center gap-2 mb-2.5">
        <span className={tint}>{icon}</span>
        <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">{label}</p>
      </div>
      <p className="font-display text-[27px] leading-none font-bold tabular-nums tracking-tight text-[#F4F8FB]">
        {display}
      </p>
      <p className="text-[11px] text-slate-500 mt-1.5">{unit}</p>
    </div>
  )
}

export default function KPIStrip({ kpis }: Props) {
  if (!kpis) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-14 bg-white/5 rounded" />
      </div>
    )
  }

  return (
    <div className="glass-card relative">
      <div className="absolute top-3 right-3 z-10">
        <InfoTip text="Totals computed from the full recorded history: energy consumed, money spent, total CO2 emitted (grid electricity plus diesel generator), the share of energy served by the grid, and the number of days the generator had to run." />
      </div>
      <div className="grid grid-cols-5 divide-x divide-white/[0.06]">
      <Stat
        label="Energy"
        value={kpis.total_energy_kwh}
        unit={`kWh over ${kpis.total_days} days`}
        icon={<Bolt className="w-4 h-4" />}
        tint="text-teal-400"
        format={(v) => `${(v / 1000).toFixed(1)}K`}
      />
      <Stat
        label="Cost"
        value={kpis.total_cost_rs}
        unit="Indian Rupees"
        icon={<span className="text-[13px] font-semibold">₹</span>}
        tint="text-violet-400"
        format={(v) => `${(v / 100000).toFixed(2)}L`}
      />
      <Stat
        label="Total CO₂"
        value={kpis.co2_kg}
        unit="kg (grid + diesel)"
        icon={<Leaf className="w-4 h-4" />}
        tint="text-rose-400"
        format={(v) => `${(v / 1000).toFixed(1)}K`}
      />
      <Stat
        label="Grid Share"
        value={kpis.grid_pct}
        unit="% energy via EB grid"
        icon={<Plug className="w-4 h-4" />}
        tint="text-emerald-400"
        format={(v) => `${v.toFixed(1)}%`}
      />
      <Stat
        label="DG Days"
        value={kpis.dg_days}
        unit="days generator ran"
        icon={<Flask className="w-4 h-4" />}
        tint="text-amber-400"
      />
      </div>
    </div>
  )
}
