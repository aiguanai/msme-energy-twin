import { useEffect, useState } from 'react'

export default function Header() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-cyan-500/20">
          ⚡
        </div>
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-white leading-none">
            MSME Digital Twin
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">AI Energy Intelligence Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-[13px] font-medium text-white tabular-nums">
            {time.toLocaleTimeString('en-IN', { hour12: false })}
          </p>
          <p className="text-[11px] text-slate-500">
            {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-medium text-emerald-400">System Live</span>
        </div>
      </div>
    </header>
  )
}
