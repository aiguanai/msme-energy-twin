export default function Header() {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-10 py-[18px] border-b border-white/[0.06]"
      style={{ background: 'rgba(9,11,17,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
    >
      <div className="flex items-center gap-3.5">
        <img src="/logo_icon.png" alt="Watchtower" className="logo-glow w-[46px] h-[46px] object-contain" />
        <div className="flex flex-col items-start gap-[6px]">
          <img
            src="/logo_name.png"
            alt="Watchtower"
            className="wordmark-img h-[17px] w-auto self-start object-contain object-left"
          />
          <span className="text-[12px] text-[#5E6B7E]">
            AI energy intelligence for small manufacturing
          </span>
        </div>
      </div>

      <div className="text-right leading-tight">
        <div className="text-[12.5px] font-semibold text-[#C7D2DE]">{today}</div>
      </div>
    </header>
  )
}
