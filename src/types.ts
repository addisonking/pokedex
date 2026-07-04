export type Pokemon = {
  id: number
  name: string
  types: string[]
  gen: number
}

export type DexEntry = { r: number; n: number }

export type Game = {
  id: string
  name: string
  shortName: string
  gen: number
  versions: string[]
  serebiiSuffix: string
  description: string
  dex: DexEntry[]
}

export type CatchStatus = 0 | 1 | 2 // unseen / seen / caught
export type TrackerMode = "caught" | "seen"
export type DexView = "regional" | "national"
export type SortKey = "dex" | "name" | "type" | "uncaught"
export type ViewMode = "grid" | "list"

export type Playthrough = {
  id: string // crypto.randomUUID()
  gameId: string // games.json id, e.g. "gsc"
  version: string // e.g. "gold"
  name: string // user label, defaults to version label
  mode: TrackerMode
  createdAt: number
  setupDone: boolean
}

export type DexRecord = { s: CatchStatus; t?: number } // t = last status change; absent = setup baseline
export type TrackerState = Record<number, DexRecord> // sparse: only s=1|2 stored

export type Store = {
  playthroughs: Playthrough[]
  progress: Record<string, TrackerState> // keyed by playthrough id
}

export type FilterStatus = "all" | "caught" | "uncaught" | "seen" | "unseen"

export type EncounterRow = {
  loc: string
  method: string
  chance: number
  min: number
  max: number
  cond?: string[]
}

export type VersionEncounters = Record<string, EncounterRow[]>

export type Evolution = {
  from: number
  trigger: string
  level?: number
  item?: string
  note?: string
}

export type GridEntry = {
  pokemon: Pokemon
  regionalNumber?: number
  status: CatchStatus // mode-adjusted for display (seen→0 in caught mode)
}

export type AreaEntry = { entry: GridEntry; rows: EncounterRow[] }
export type Area = { loc: string; entries: AreaEntry[] }
