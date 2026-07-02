import { cn } from "../lib/cn"
import { TYPE_COLORS } from "../lib/typeColors"
import type { GridEntry } from "../types"

type Props = {
  entries: GridEntry[]
  onCycle: (pokemonId: number) => void
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const STATUS_LABEL: Record<number, string> = { 0: "Not seen", 1: "Seen", 2: "Caught" }

export function PokemonList({ entries, onCycle }: Props) {
  if (entries.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">No Pokémon match your filters.</div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {entries.map((e) => {
        const num = e.regionalNumber ?? e.pokemon.id
        const bar =
          e.status === 2 ? "bg-emerald-500" : e.status === 1 ? "bg-amber-400" : "bg-transparent"
        return (
          <div
            key={e.pokemon.id}
            className="group flex items-center gap-2 border-b border-border bg-card px-2 py-1.5 transition last:border-b-0 hover:bg-accent"
          >
            <button
              type="button"
              onClick={() => onCycle(e.pokemon.id)}
              aria-label={`${cap(e.pokemon.name)} #${num} — ${STATUS_LABEL[e.status]}`}
              title={STATUS_LABEL[e.status]}
              className="flex flex-1 items-center gap-2 text-left"
            >
              <span className={cn("h-7 w-1 shrink-0 rounded-full", bar)} />
              <img
                src={`/sprites/${e.pokemon.id}.png`}
                alt=""
                loading="lazy"
                className="size-7 shrink-0 object-contain"
              />
              <span className="w-9 shrink-0 font-mono text-xs text-muted-foreground">#{num}</span>
              <span className="text-sm font-medium">{cap(e.pokemon.name)}</span>
              <span className="flex gap-1">
                {e.pokemon.types.map((t) => (
                  <span
                    key={t}
                    className="size-2 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[t] ?? "#777" }}
                    title={t}
                  />
                ))}
              </span>
            </button>
            <a
              href={e.serebiiUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="shrink-0 text-xs text-sky-400/80 hover:text-sky-300"
            >
              Location ↗
            </a>
          </div>
        )
      })}
    </div>
  )
}
