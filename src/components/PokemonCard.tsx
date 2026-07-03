import { MapPin } from "lucide-react"
import { cn } from "../lib/cn"
import { TYPE_COLORS } from "../lib/typeColors"
import type { CatchStatus, Pokemon } from "../types"

type Props = {
  pokemon: Pokemon
  regionalNumber?: number
  status: CatchStatus
  onCycle: () => void
  onLocation: () => void
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const STATUS_LABEL: Record<CatchStatus, string> = { 0: "Not seen", 1: "Seen", 2: "Caught" }

export function PokemonCard({ pokemon, regionalNumber, status, onCycle, onLocation }: Props) {
  const num = regionalNumber != null ? regionalNumber : pokemon.id
  const label = `${cap(pokemon.name)} #${num} — ${STATUS_LABEL[status]}`
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-lg border p-2 text-center transition",
        status === 2
          ? "border-emerald-500/60 bg-emerald-500/10"
          : status === 1
            ? "border-amber-400/60 bg-amber-400/10"
            : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10",
      )}
    >
      <button
        type="button"
        onClick={onCycle}
        aria-label={label}
        title={STATUS_LABEL[status]}
        className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      />
      <span className="pointer-events-none absolute left-1.5 top-1.5 font-mono text-[10px] text-white/40">
        #{num}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
          status === 2
            ? "bg-emerald-500 text-white"
            : status === 1
              ? "bg-amber-400 text-white"
              : "bg-white/10 text-white/25",
        )}
      >
        {status === 2 ? (
          "✓"
        ) : status === 1 ? (
          <svg
            viewBox="0 0 24 24"
            className="h-2.5 w-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Seen"
          >
            <title>Seen</title>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        ) : (
          ""
        )}
      </span>
      <img
        loading="lazy"
        src={`/sprites/${pokemon.id}.png`}
        alt={pokemon.name}
        className={cn(
          "pointer-events-none relative z-10 h-16 w-16 object-contain",
          status === 0
            ? "opacity-50 transition group-hover:opacity-90"
            : status === 1
              ? "opacity-75"
              : "",
        )}
      />
      <div className="pointer-events-none relative z-10 mt-1 text-xs font-medium leading-tight">
        {cap(pokemon.name)}
      </div>
      <div className="pointer-events-none relative z-10 mt-1 flex flex-wrap justify-center gap-1">
        {pokemon.types.map((t) => (
          <span
            key={t}
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[t] ?? "#777" }}
            title={t}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onLocation}
        aria-label={`${cap(pokemon.name)} encounters`}
        title="Encounters"
        className="absolute bottom-1 right-1 z-20 rounded p-1.5 text-white/40 opacity-0 transition hover:text-sky-300 focus:opacity-100 focus:text-sky-300 focus:outline-none group-hover:opacity-100"
      >
        <MapPin className="size-3.5" />
      </button>
    </div>
  )
}
