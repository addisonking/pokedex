import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Filters } from "../components/Filters"
import { PokemonGrid } from "../components/PokemonGrid"
import { PokemonList } from "../components/PokemonList"
import { ProgressBar } from "../components/ProgressBar"
import { GAMES_BY_ID, GEN_CAP, POKEMON_BY_ID, VERSION_LABELS } from "../data"
import { cn } from "../lib/cn"
import { countCaught } from "../lib/progress"
import { serebiiLocationUrl } from "../lib/serebii"
import { useProgress } from "../lib/storage"
import type {
  CatchStatus,
  DexView,
  FilterStatus,
  Game,
  GridEntry,
  Pokemon,
  SortKey,
  TrackerMode,
  TrackerState,
  ViewMode,
} from "../types"

function parseRange(text: string): number[] {
  const out: number[] = []
  for (const chunk of text.split(",")) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    const m = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(trimmed)
    if (!m) continue
    const a = Number(m[1])
    const b = m[2] ? Number(m[2]) : a
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    for (let i = lo; i <= hi; i++) out.push(i)
  }
  return out
}

function buildEntries(
  game: Game | undefined,
  view: DexView,
  mode: TrackerMode,
  search: string,
  type: string,
  status: FilterStatus,
  sort: SortKey,
  version: string,
  state: TrackerState | undefined,
): GridEntry[] {
  if (!game) return []
  const q = search.trim().toLowerCase()
  const cap = GEN_CAP[game.gen]
  const source: { pokemon: Pokemon | undefined; regionalNumber?: number }[] = []
  if (view === "regional") {
    for (const d of game.dex) {
      source.push({ pokemon: POKEMON_BY_ID.get(d.n), regionalNumber: d.r })
    }
  } else {
    for (let i = 1; i <= cap; i++) source.push({ pokemon: POKEMON_BY_ID.get(i) })
  }
  const out: GridEntry[] = []
  for (const { pokemon, regionalNumber } of source) {
    if (!pokemon) continue
    if (type && !pokemon.types.includes(type)) continue
    const raw: CatchStatus = state?.[pokemon.id]?.s ?? 0
    const display: CatchStatus = mode === "caught" && raw === 1 ? 0 : raw
    if (status === "caught" && display !== 2) continue
    if (status === "uncaught" && display === 2) continue
    if (status === "seen" && display !== 1) continue
    if (status === "unseen" && display !== 0) continue
    if (q) {
      const matchesName = pokemon.name.includes(q)
      const matchesNational = String(pokemon.id).padStart(3, "0").includes(q)
      const matchesRegional = regionalNumber != null && String(regionalNumber).includes(q)
      if (!matchesName && !matchesNational && !matchesRegional) continue
    }
    out.push({
      pokemon,
      regionalNumber,
      serebiiUrl: serebiiLocationUrl(game, pokemon.id, version),
      status: display,
    })
  }
  if (sort === "name") {
    out.sort((a, b) => a.pokemon.name.localeCompare(b.pokemon.name))
  } else if (sort === "type") {
    out.sort((a, b) => {
      const ta = a.pokemon.types[0] ?? ""
      const tb = b.pokemon.types[0] ?? ""
      return ta === tb ? a.pokemon.name.localeCompare(b.pokemon.name) : ta.localeCompare(tb)
    })
  } else if (sort === "uncaught") {
    out.sort((a, b) => a.status - b.status)
  }
  return out
}

export function PlaythroughTracker() {
  const { id = "" } = useParams()
  const { playthroughs, progress, setMode, completeSetup, cycle, bulkSet } = useProgress()
  const playthrough = playthroughs.find((p) => p.id === id)
  const game = playthrough ? GAMES_BY_ID.get(playthrough.gameId) : undefined

  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [status, setStatus] = useState<FilterStatus>("all")
  const [dexView, setDexView] = useState<DexView>("regional")
  const [sort, setSort] = useState<SortKey>("dex")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [rangeText, setRangeText] = useState("")
  const [setupStatus, setSetupStatus] = useState<CatchStatus>(2)
  const [rangeMsg, setRangeMsg] = useState<string | null>(null)

  const state = playthrough ? progress[playthrough.id] : undefined
  const mode: TrackerMode = playthrough?.mode ?? "seen"
  const version = playthrough?.version ?? ""

  const entries = useMemo(
    () => buildEntries(game, dexView, mode, search, type, status, sort, version, state),
    [game, dexView, mode, search, type, status, sort, version, state],
  )

  if (!playthrough || !game) {
    return (
      <div className="p-8">
        Playthrough not found.{" "}
        <Link to="/" className="text-sky-400">
          Back home
        </Link>
      </div>
    )
  }

  const cap = GEN_CAP[game.gen]
  const regionalIds = game.dex.map((d) => d.n)
  const activeIds =
    dexView === "regional" ? regionalIds : Array.from({ length: cap }, (_, i) => i + 1)
  const caughtCount = countCaught(state, activeIds)
  const filteredCaught = entries.filter((e) => e.status === 2).length

  const handleModeChange = (m: TrackerMode) => {
    setMode(playthrough.id, m)
    setStatus("all")
    if (m === "caught") setSetupStatus(2)
  }

  const flashRangeMsg = (m: string) => {
    setRangeMsg(m)
    setTimeout(() => setRangeMsg(null), 2500)
  }

  const applyRange = () => {
    const nums = parseRange(rangeText)
    if (nums.length === 0) {
      flashRangeMsg("Couldn't parse any numbers.")
      return
    }
    let ids: number[]
    if (dexView === "regional") {
      const rToN = new Map(game.dex.map((d) => [d.r, d.n]))
      ids = nums.map((n) => rToN.get(n)).filter((n): n is number => n != null)
    } else {
      ids = nums.filter((n) => n >= 1 && n <= cap)
    }
    if (ids.length === 0) {
      flashRangeMsg("No matching entries in range.")
      return
    }
    bulkSet(playthrough.id, ids, setupStatus)
    flashRangeMsg(`Marked ${ids.length} as ${setupStatus === 2 ? "caught" : "seen"}.`)
    setRangeText("")
  }

  const markAllShown = (s: CatchStatus) => {
    const ids = entries.map((e) => e.pokemon.id)
    if (ids.length === 0) return
    bulkSet(playthrough.id, ids, s)
    flashRangeMsg(`Marked ${ids.length} shown as ${s === 2 ? "caught" : "seen"}.`)
  }

  const showTabs = game.dex.length !== cap
  const numberLabel = dexView === "regional" ? "regional" : "national"
  const regionalZeroBased = dexView === "regional" && game.dex[0]?.r === 0
  const rangeStart = regionalZeroBased ? 0 : 1

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <Link to="/" className="text-sm text-white/40 hover:text-white/70">
          ← All games
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{playthrough.name}</h1>
            <p className="text-sm text-white/50">
              {VERSION_LABELS[playthrough.version]} · {game.description}
            </p>
          </div>
          <div className="flex overflow-hidden rounded border border-white/10">
            <button
              type="button"
              onClick={() => handleModeChange("caught")}
              className={cn(
                "px-3 py-1.5 text-sm transition",
                mode === "caught" ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10",
              )}
            >
              Caught only
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("seen")}
              className={cn(
                "px-3 py-1.5 text-sm transition",
                mode === "seen" ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10",
              )}
            >
              Seen + caught
            </button>
          </div>
        </div>
      </div>

      {!playthrough.setupDone && (
        <div className="mb-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-sky-100">
              Setup mode — mark everything you've already seen/caught in this save.
            </p>
            <button
              type="button"
              onClick={() => completeSetup(playthrough.id)}
              className="rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-500"
            >
              Done
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={rangeText}
              onChange={(e) => setRangeText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyRange()
              }}
              placeholder={`e.g. ${rangeStart}-50, 63, 120-151 (${numberLabel} #s)`}
              className="min-w-0 flex-1 rounded border border-white/10 bg-[#16191f] px-3 py-1.5 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
            />
            {mode === "seen" && (
              <div className="flex overflow-hidden rounded border border-white/10">
                <button
                  type="button"
                  onClick={() => setSetupStatus(2)}
                  className={cn(
                    "px-3 py-1.5 text-sm transition",
                    setupStatus === 2
                      ? "bg-emerald-600 text-white"
                      : "bg-white/5 hover:bg-white/10",
                  )}
                >
                  Caught
                </button>
                <button
                  type="button"
                  onClick={() => setSetupStatus(1)}
                  className={cn(
                    "px-3 py-1.5 text-sm transition",
                    setupStatus === 1 ? "bg-amber-500 text-white" : "bg-white/5 hover:bg-white/10",
                  )}
                >
                  Seen
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={applyRange}
              className="rounded border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              Mark
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => markAllShown(2)}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              Mark all shown as caught
            </button>
            {mode === "seen" && (
              <button
                type="button"
                onClick={() => markAllShown(1)}
                className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
              >
                Mark all shown as seen
              </button>
            )}
            {rangeMsg && <span className="text-xs text-sky-200">{rangeMsg}</span>}
          </div>
        </div>
      )}

      <div className="mb-4">
        {showTabs ? (
          <div className="mb-3 flex overflow-hidden rounded border border-white/10">
            <button
              type="button"
              onClick={() => setDexView("regional")}
              className={cn(
                "px-3 py-1.5 text-sm transition",
                dexView === "regional" ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10",
              )}
            >
              Regional ({game.dex.length})
            </button>
            <button
              type="button"
              onClick={() => setDexView("national")}
              className={cn(
                "px-3 py-1.5 text-sm transition",
                dexView === "national" ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10",
              )}
            >
              National ({cap})
            </button>
          </div>
        ) : (
          <p className="mb-3 text-xs text-white/40">
            {game.description} dex — {game.dex.length} entries. Regional & national cover the same
            Pokémon.
          </p>
        )}
        <ProgressBar caught={caughtCount} total={activeIds.length} />
        {status !== "all" && (
          <p className="mt-1 text-xs text-white/40">
            {filteredCaught} / {entries.length} shown are caught
          </p>
        )}
      </div>

      <div className="mb-4">
        <Filters
          search={search}
          onSearch={setSearch}
          type={type}
          onType={setType}
          status={status}
          onStatus={setStatus}
          mode={mode}
          sort={sort}
          onSort={setSort}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
      </div>

      {viewMode === "list" ? (
        <PokemonList entries={entries} onCycle={(pid) => cycle(playthrough.id, pid)} />
      ) : (
        <PokemonGrid entries={entries} onCycle={(pid) => cycle(playthrough.id, pid)} />
      )}

      <p className="mt-6 text-xs text-white/30">
        Tracking {activeIds.length} Pokémon · Serebii links open in a new tab.
      </p>
    </div>
  )
}
