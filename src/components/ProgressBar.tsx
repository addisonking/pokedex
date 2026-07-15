import { pct } from "../lib/progress"

type Props = { caught: number; total: number; seen?: number }

export function ProgressBar({ caught, total, seen }: Props) {
  const p = pct(caught, total)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold">
          {caught} <span className="text-white/40">/ {total}</span>
          {seen !== undefined && seen > caught && (
            <span className="ml-2 text-xs font-normal text-amber-400/80">{seen} seen</span>
          )}
        </span>
        <span className="text-white/50">{p}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        {seen !== undefined && (
          <div
            className="absolute inset-y-0 left-0 bg-amber-400/40 transition-all"
            style={{ width: `${pct(seen, total)}%` }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500 transition-all"
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  )
}
