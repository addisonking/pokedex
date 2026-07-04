import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LayoutGrid, List, MapPin } from "lucide-react"
import { cn } from "../lib/cn"
import { ALL_TYPES } from "../lib/typeColors"
import type { FilterStatus, SortKey, TrackerMode, ViewMode } from "../types"

type Props = {
  search: string
  onSearch: (v: string) => void
  type: string
  onType: (v: string) => void
  status: FilterStatus
  onStatus: (v: FilterStatus) => void
  mode: TrackerMode
  sort: SortKey
  onSort: (v: SortKey) => void
  viewMode: ViewMode
  onViewMode: (v: ViewMode) => void
  hideMythical: boolean
  onToggleMythical: () => void
}

const CAUGHT_STATUSES: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "caught", label: "Caught" },
  { id: "uncaught", label: "Uncaught" },
]

const SEEN_STATUSES: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "caught", label: "Caught" },
  { id: "seen", label: "Seen" },
  { id: "unseen", label: "Unseen" },
]

export function Filters({
  search,
  onSearch,
  type,
  onType,
  status,
  onStatus,
  mode,
  sort,
  onSort,
  viewMode,
  onViewMode,
  hideMythical,
  onToggleMythical,
}: Props) {
  const statuses = mode === "seen" ? SEEN_STATUSES : CAUGHT_STATUSES
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search name or #…"
        className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm outline-none placeholder:text-white/30 focus:border-sky-500/60"
      />
      <Select value={type || "all"} onValueChange={(v) => onType(v === "all" ? "" : v)}>
        <SelectTrigger size="sm" className="w-[8.5rem] capitalize">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {ALL_TYPES.map((t) => (
            <SelectItem key={t} value={t} className="capitalize">
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
        <SelectTrigger size="sm" className="w-[8.5rem]">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dex">Dex order</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="type">Type</SelectItem>
          <SelectItem value="uncaught">Uncaught first</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex overflow-hidden rounded border border-white/10">
        {statuses.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStatus(s.id)}
            className={cn(
              "px-3 py-1.5 text-sm transition",
              status === s.id ? "bg-sky-600 text-white" : "bg-white/5 hover:bg-white/10",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onToggleMythical}
        className={cn(
          "rounded border px-3 py-1.5 text-sm transition",
          hideMythical
            ? "border-sky-600 bg-sky-600/20 text-sky-300"
            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
        )}
      >
        {hideMythical ? "Mythicals hidden" : "Show mythicals"}
      </button>
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(v) => {
          if (v) onViewMode(v as ViewMode)
        }}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view">
          <List />
        </ToggleGroupItem>
        <ToggleGroupItem value="areas" aria-label="Areas view">
          <MapPin />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
