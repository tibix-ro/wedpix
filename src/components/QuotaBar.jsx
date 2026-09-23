export default function QuotaBar({ used, limit, className = '' }) {
  const unlimited = limit === null || limit === undefined
  const pct       = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const color     = pct >= 90 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-taupe font-sans">
          {unlimited ? `${used} fotografii` : `${used} / ${limit} fotografii`}
        </span>
        {!unlimited && (
          <span className={`text-[11px] font-semibold font-sans
            ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {pct}%
          </span>
        )}
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-cream rounded-full overflow-hidden border border-rose-gold/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
