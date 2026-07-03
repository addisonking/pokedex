import { useEffect, useState } from "react"
import { VERSION_LABELS } from "../data"
import { conditionLabel, evolutionHint, loadEncounters, methodLabel } from "../lib/encounters"
import { serebiiLocationUrl } from "../lib/serebii"
import type { EncounterRow, Game, GridEntry, VersionEncounters } from "../types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "./ui/dialog"
import { Skeleton } from "./ui/skeleton"

type Props = {
  game: Game
  version: string
  entry: GridEntry | null
  onClose: () => void
}

type Loaded = { state: "loading" } | { state: "ready"; rows: EncounterRow[] | undefined }

export function EncounterDialog({ game, version, entry, onClose }: Props) {
  const [data, setData] = useState<Loaded>({ state: "loading" })
  const pokemon = entry?.pokemon
  const pokemonId = pokemon?.id

  useEffect(() => {
    if (!pokemonId) return
    setData({ state: "loading" })
    let cancelled = false
    loadEncounters(version).then((map: VersionEncounters) => {
      if (cancelled) return
      setData({ state: "ready", rows: map[String(pokemonId)] })
    })
    return () => {
      cancelled = true
    }
  }, [version, pokemonId])

  const open = entry != null
  const name = pokemon ? pokemon.name[0].toUpperCase() + pokemon.name.slice(1) : ""
  const num = pokemon?.id
  const hint = pokemonId != null ? evolutionHint(pokemonId) : null

  const rows = data.state === "ready" ? data.rows : undefined
  const grouped = rows ? groupByLoc(rows) : undefined
  const hasRows = !!grouped?.length

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {pokemon && (
                <img src={`/sprites/${pokemon.id}.png`} alt="" className="size-12 object-contain" />
              )}
              <span>
                {name}{" "}
                <span className="font-mono text-sm font-normal text-muted-foreground">#{num}</span>
              </span>
            </DialogTitle>
            <DialogDescription>
              Encounters in {VERSION_LABELS[version] ?? version}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {data.state === "loading" && (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {data.state === "ready" && hasRows && (
              <div className="space-y-3">
                {grouped?.map(([loc, locRows]) => (
                  <div key={loc}>
                    <h3 className="mb-1 text-sm font-semibold">{loc}</h3>
                    <div className="space-y-1">
                      {locRows.map((r, i) => (
                        <Row key={`${loc}-${r.method}-${i}`} row={r} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.state === "ready" && !hasRows && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {hint ? (
                  <p>{hint}</p>
                ) : (
                  <p>
                    No wild encounters in {VERSION_LABELS[version] ?? version} — trade, event, or
                    breed.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3 sm:justify-start">
            {pokemonId != null && (
              <a
                href={serebiiLocationUrl(game, pokemonId, version)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Serebii ↗
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

function Row({ row }: { row: EncounterRow }) {
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-card px-2 py-1.5 text-xs">
      <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-primary">
        {methodLabel(row.method)}
      </span>
      <span className="font-mono text-muted-foreground">{row.chance}%</span>
      <span className="text-muted-foreground">
        Lv {row.min === row.max ? row.min : `${row.min}–${row.max}`}
      </span>
      {row.cond && row.cond.length > 0 && (
        <span className="ml-auto flex flex-wrap gap-1">
          {row.cond.map((c) => (
            <span
              key={c}
              className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
            >
              {conditionLabel(c)}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

function groupByLoc(rows: EncounterRow[]): [string, EncounterRow[]][] {
  const map = new Map<string, EncounterRow[]>()
  for (const r of rows) {
    const arr = map.get(r.loc)
    if (arr) arr.push(r)
    else map.set(r.loc, [r])
  }
  const out: [string, EncounterRow[]][] = []
  for (const [loc, rs] of map) {
    rs.sort((a, b) => a.method.localeCompare(b.method) || a.min - b.min)
    out.push([loc, rs])
  }
  out.sort((a, b) => a[0].localeCompare(b[0]))
  return out
}
