import { useEffect, useRef, useState } from 'react'

interface Props {
  label: string
  value: number
  unit: string
  icon: string
  color: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet'
  format?: (v: number) => string
  subtitle?: string
}

const colorMap = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', glow: 'shadow-cyan-500/10' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', glow: 'shadow-emerald-500/10' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', glow: 'shadow-amber-500/10' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', glow: 'shadow-rose-500/10' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20', glow: 'shadow-violet-500/10' },
}

function useCountUp(target: number, duration = 1200) {
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

export default function KPICard({ label, value, unit, icon, color, format, subtitle }: Props) {
  const animated = useCountUp(value)
  const c = colorMap[color]
  const display = format ? format(animated) : Math.round(animated).toLocaleString('en-IN')

  return (
    <div className={`gradient-border shadow-xl ${c.glow}`}>
      <div className="gradient-border-inner p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center text-xl`}>
            {icon}
          </div>
          {subtitle && (
            <span className="text-[11px] text-slate-500 bg-white/5 rounded-full px-2 py-0.5">
              {subtitle}
            </span>
          )}
        </div>

        <p className={`text-3xl font-bold tabular-nums tracking-tight ${c.text}`}>{display}</p>
        <p className="text-[12px] text-slate-400 mt-0.5">{unit}</p>
        <p className="text-[13px] text-slate-500 mt-3 font-medium">{label}</p>
      </div>
    </div>
  )
}
