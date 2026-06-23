import { InfoCircle } from 'tabler-icons-react'

interface Props {
  text: string
  align?: 'left' | 'right'
}

export default function InfoTip({ text, align = 'right' }: Props) {
  return (
    <div className="relative group shrink-0 flex items-center">
      <button
        aria-label="More info"
        className="flex items-center text-slate-600 hover:text-teal-400 focus-visible:text-teal-400 transition-colors outline-none"
      >
        <InfoCircle className="w-4 h-4" />
      </button>
      <div
        role="tooltip"
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-[280px] z-50
                    glass-card p-3 shadow-2xl shadow-black/60
                    opacity-0 invisible translate-y-1 transition-all duration-150
                    group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
                    group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0`}
      >
        <p className="text-[12px] text-slate-300 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
