import { MapPin } from "lucide-react"
import { cn } from "../lib/cn"
import { conditionLabel, methodLabel } from "../lib/encounters"
import type { Area, EncounterRow, ViewMode } from "../types"
import { PokemonCard } from "./PokemonCard"

type Props = {
  areas: Area[]
  loading: boolean
  viewMode: ViewMode
  onCycle: (pokemonId: number) => void
  onLocation: (pokemonId: number) => void
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const STATUS_LABEL: Record<number, string> = { 0: "Not seen", 1: "Seen", 2: "Caught" }

export function AreaView({ areas, loading, viewMode, onCycle, onLocation }: Props) {
  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Loading encounters…</div>
  }
  if (areas.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Nothing left to catch here — no areas with needed Pokémon.
      </div>
    )
  }
  return (
    <div className="space-y-4">
      {areas.map((area) => {
        return (
          <div key={area.loc} className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-white/5 px-3 py-2">
              <h3 className="text-sm font-semibold">{area.loc}</h3>
              <span className="rounded bg-brand/15 px-1.5 py-0.5 font-mono text-[11px] text-brand">
                {area.entries.length} needed
              </span>
            </div>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-2 p-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                {area.entries.map(({ entry }) => (
                  <PokemonCard
                    key={entry.pokemon.id}
                    pokemon={entry.pokemon}
                    regionalNumber={entry.regionalNumber}
                    status={entry.status}
                    onCycle={() => onCycle(entry.pokemon.id)}
                    onLocation={() => onLocation(entry.pokemon.id)}
                  />
                ))}
              </div>
            ) : (
              area.entries.map(({ entry, rows }) => {
                const bar = entry.status === 1 ? "bg-amber-400" : "bg-transparent"
                return (
                  <div
                    key={entry.pokemon.id}
                    className="group flex items-center gap-2 border-b border-border bg-card px-2 py-1.5 transition last:border-b-0 hover:bg-accent"
                  >
                    <button
                      type="button"
                      onClick={() => onCycle(entry.pokemon.id)}
                      aria-label={`${cap(entry.pokemon.name)} — ${STATUS_LABEL[entry.status]}`}
                      title={STATUS_LABEL[entry.status]}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className={cn("h-7 w-1 shrink-0 rounded-full", bar)} />
                      <img
                        src={`/sprites/${entry.pokemon.id}.png`}
                        alt=""
                        loading="lazy"
                        className="size-7 shrink-0 object-contain"
                      />
                      <span className="w-24 shrink-0 truncate text-sm font-medium">
                        {cap(entry.pokemon.name)}
                      </span>
                      <span className="flex min-w-0 flex-wrap items-center gap-1">
                        {rows.map((r, i) => (
                          <RowChip key={`${r.method}-${i}`} row={r} />
                        ))}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onLocation(entry.pokemon.id)
                      }}
                      aria-label={`${cap(entry.pokemon.name)} encounters`}
                      title="Encounters"
                      className="shrink-0 rounded p-1.5 text-white/40 opacity-0 transition hover:text-sky-300 focus:opacity-100 focus:text-sky-300 group-hover:opacity-100"
                    >
                      <MapPin className="size-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}

function RowChip({ row }: { row: EncounterRow }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px]">
      <span className="font-medium text-primary">{methodLabel(row.method)}</span>
      <span className="font-mono text-muted-foreground">{row.chance}%</span>
      <span className="text-muted-foreground">
        Lv {row.min === row.max ? row.min : `${row.min}–${row.max}`}
      </span>
      {row.cond?.map((c) => (
        <span
          key={c}
          className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
        >
          {conditionLabel(c)}
        </span>
      ))}
    </span>
  )
}
