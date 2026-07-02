import { pct } from "../lib/progress"

type Props = { caught: number; total: number }

export function ProgressBar({ caught, total }: Props) {
  const p = pct(caught, total)
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold">
          {caught} <span className="text-white/40">/ {total}</span>
        </span>
        <span className="text-white/50">{p}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}
