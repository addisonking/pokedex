import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { CatchStatus, Playthrough, Store, TrackerMode, TrackerState } from "../types"

const KEY = "pokedex"

function emptyStore(): Store {
  return { playthroughs: [], progress: {} }
}

const MODES: TrackerMode[] = ["caught", "seen"]

function isPlaythrough(v: unknown): v is Playthrough {
  if (typeof v !== "object" || v === null) return false
  const p = v as Record<string, unknown>
  return (
    typeof p.id === "string" &&
    typeof p.gameId === "string" &&
    typeof p.version === "string" &&
    typeof p.name === "string" &&
    typeof p.mode === "string" &&
    (MODES as string[]).includes(p.mode) &&
    typeof p.createdAt === "number" &&
    typeof p.setupDone === "boolean"
  )
}

function isTrackerState(v: unknown): v is TrackerState {
  if (typeof v !== "object" || v === null) return false
  for (const rec of Object.values(v as Record<string, unknown>)) {
    if (typeof rec !== "object" || rec === null) return false
    const r = rec as Record<string, unknown>
    if (r.s !== 0 && r.s !== 1 && r.s !== 2) return false
    if (r.t !== undefined && typeof r.t !== "number") return false
  }
  return true
}

function isValidStore(v: unknown): v is Store {
  if (typeof v !== "object" || v === null) return false
  const s = v as Record<string, unknown>
  if (!Array.isArray(s.playthroughs) || !s.playthroughs.every(isPlaythrough)) return false
  if (typeof s.progress !== "object" || s.progress === null) return false
  for (const ts of Object.values(s.progress as Record<string, unknown>)) {
    if (!isTrackerState(ts)) return false
  }
  return true
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw)
    if (!isValidStore(parsed)) return emptyStore()
    return parsed
  } catch {
    return emptyStore()
  }
}

type Ctx = {
  playthroughs: Playthrough[]
  progress: Record<string, TrackerState>
  addPlaythrough: (gameId: string, version: string, name: string) => string
  removePlaythrough: (id: string) => void
  setMode: (id: string, mode: TrackerMode) => void
  completeSetup: (id: string) => void
  cycle: (playthroughId: string, pokemonId: number) => void
  bulkSet: (playthroughId: string, pokemonIds: number[], status: CatchStatus) => void
  loadSave: (playthroughId: string, seen: number[], caught: number[]) => void
  exportJson: () => string
  importJson: (text: string) => boolean
  reset: () => void
}

const C = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => load())

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store))
    } catch {
      // storage may be unavailable (private mode); ignore
    }
  }, [store])

  const addPlaythrough = useCallback((gameId: string, version: string, name: string) => {
    const id = crypto.randomUUID()
    const now = Date.now()
    const pt: Playthrough = {
      id,
      gameId,
      version,
      name,
      mode: "seen",
      createdAt: now,
      setupDone: false,
    }
    setStore((s) => ({
      playthroughs: [...s.playthroughs, pt],
      progress: { ...s.progress, [id]: {} },
    }))
    return id
  }, [])

  const removePlaythrough = useCallback((id: string) => {
    setStore((s) => {
      const progress = { ...s.progress }
      delete progress[id]
      return {
        playthroughs: s.playthroughs.filter((p) => p.id !== id),
        progress,
      }
    })
  }, [])

  const setMode = useCallback((id: string, mode: TrackerMode) => {
    setStore((s) => ({
      ...s,
      playthroughs: s.playthroughs.map((p) => (p.id === id ? { ...p, mode } : p)),
    }))
  }, [])

  const completeSetup = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      playthroughs: s.playthroughs.map((p) => (p.id === id ? { ...p, setupDone: true } : p)),
    }))
  }, [])

  const cycle = useCallback((playthroughId: string, pokemonId: number) => {
    setStore((s) => {
      const pt = s.playthroughs.find((p) => p.id === playthroughId)
      if (!pt) return s
      const state: TrackerState = { ...(s.progress[playthroughId] ?? {}) }
      const cur = state[pokemonId]?.s ?? 0
      const stamp = pt.setupDone ? { t: Date.now() } : {}
      if (pt.mode === "caught") {
        // caught mode: 2 → delete, else → 2 (preserve any stored seen on others)
        if (cur === 2) delete state[pokemonId]
        else state[pokemonId] = { s: 2, ...stamp }
      } else {
        // seen mode: 0 → 1 → 2 → delete
        if (cur === 0) state[pokemonId] = { s: 1, ...stamp }
        else if (cur === 1) state[pokemonId] = { s: 2, ...stamp }
        else delete state[pokemonId]
      }
      return { ...s, progress: { ...s.progress, [playthroughId]: state } }
    })
  }, [])

  const bulkSet = useCallback(
    (playthroughId: string, pokemonIds: number[], status: CatchStatus) => {
      setStore((s) => {
        const pt = s.playthroughs.find((p) => p.id === playthroughId)
        if (!pt) return s
        const state: TrackerState = { ...(s.progress[playthroughId] ?? {}) }
        const stamp = pt.setupDone ? { t: Date.now() } : {}
        for (const pid of pokemonIds) {
          if (status === 0) delete state[pid]
          else state[pid] = { s: status, ...stamp }
        }
        return { ...s, progress: { ...s.progress, [playthroughId]: state } }
      })
    },
    [],
  )

  const loadSave = useCallback((playthroughId: string, seen: number[], caught: number[]) => {
    setStore((s) => {
      const pt = s.playthroughs.find((p) => p.id === playthroughId)
      if (!pt) return s
      const stamp = pt.setupDone ? { t: Date.now() } : {}
      const state: TrackerState = {}
      const caughtSet = new Set(caught)
      for (const pid of seen) {
        if (!caughtSet.has(pid)) state[pid] = { s: 1, ...stamp }
      }
      for (const pid of caught) {
        state[pid] = { s: 2, ...stamp }
      }
      return { ...s, progress: { ...s.progress, [playthroughId]: state } }
    })
  }, [])

  const exportJson = useCallback(() => JSON.stringify(store, null, 2), [store])

  const importJson = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text)
      if (!isValidStore(parsed)) return false
      setStore(parsed)
      return true
    } catch {
      return false
    }
  }, [])

  const reset = useCallback(() => setStore(emptyStore()), [])

  const value = useMemo(
    () => ({
      playthroughs: store.playthroughs,
      progress: store.progress,
      addPlaythrough,
      removePlaythrough,
      setMode,
      completeSetup,
      cycle,
      bulkSet,
      loadSave,
      exportJson,
      importJson,
      reset,
    }),
    [
      store,
      addPlaythrough,
      removePlaythrough,
      setMode,
      completeSetup,
      cycle,
      bulkSet,
      loadSave,
      exportJson,
      importJson,
      reset,
    ],
  )

  return <C.Provider value={value}>{children}</C.Provider>
}

export function useProgress(): Ctx {
  const ctx = useContext(C)
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider")
  return ctx
}
