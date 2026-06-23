import { useEffect, useRef, useState } from 'react'

interface Props {
  /** True while the dashboard data is still loading. */
  loading: boolean
  /** Called once the splash has fully faded out and can be unmounted. */
  onDone: () => void
}

const MIN_VISIBLE_MS = 1600
const FADE_MS = 600

export default function IntroSplash({ loading, onDone }: Props) {
  const [minElapsed, setMinElapsed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!loading && minElapsed) setLeaving(true)
  }, [loading, minElapsed])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(() => onDoneRef.current(), FADE_MS)
    return () => clearTimeout(t)
  }, [leaving])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-9
                  transition-opacity duration-500
                  ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: '#0C0F16' }}
      aria-hidden={leaving}
    >
      <div className="relative grid h-[260px] w-[260px] place-items-center">
        {/* Static concentric rings */}
        <div className="absolute rounded-full border border-white/[0.05]" style={{ inset: 6 }} />
        <div className="absolute rounded-full border border-white/[0.04]" style={{ inset: 60 }} />

        {/* Rotating scan group: conic wedge + leading beam + blip */}
        <div className="absolute inset-0 animate-radar-sweep">
          <div className="radar-sweep absolute inset-0 overflow-hidden" />
          <div
            className="absolute top-0"
            style={{
              left: 'calc(50% - 1px)',
              width: 2,
              height: '50%',
              background: 'linear-gradient(180deg, #5EEAD4, transparent)',
              boxShadow: '0 0 12px rgba(45,212,191,0.85)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: 'calc(50% - 3.5px)',
              top: -1,
              width: 7,
              height: 7,
              background: '#5EEAD4',
              boxShadow: '0 0 14px rgba(45,212,191,0.95)',
            }}
          />
        </div>

        {/* Tower mark, centered */}
        <img
          src="/logo_icon.png"
          alt="Watchtower"
          className="logo-glow relative h-[150px] w-[150px] object-contain"
          style={{ zIndex: 3 }}
        />
      </div>

      <div className="flex flex-col items-center gap-4">
        <img src="/logo_name.png" alt="Watchtower" className="wordmark-img h-[21px] object-contain" />
        <div className="flex items-center gap-2.5">
          <span
            className="animate-wt-pulse inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: '#2DD4BF' }}
          />
          <span className="text-[11px] uppercase tracking-[0.28em] text-[#5E6B7E]">
            Scanning grid telemetry
          </span>
        </div>
      </div>
    </div>
  )
}
