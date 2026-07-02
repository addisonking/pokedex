import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { CatchStatus, Playthrough, Store, TrackerMode, TrackerState } from "../types"
import { useAuth } from "./auth"
import {
  bulkUpsertDexEntries,
  completePlaythroughSetup,
  createPlaythrough,
  deletePlaythrough,
  fetchAllDexEntries,
  fetchPlaythroughs,
  replaceDexEntries,
  updatePlaythroughMode,
  upsertDexEntry,
} from "./db"

function emptyStore(): Store {
  return { playthroughs: [], progress: {} }
}

type Ctx = {
  playthroughs: Playthrough[]
  progress: Record<string, TrackerState>
  loading: boolean
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
  const { user } = useAuth()
  const [store, setStore] = useState<Store>(emptyStore())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setStore(emptyStore())
      setLoading(false)
      return
    }
    setLoading(true)
    fetchPlaythroughs(user.id)
      .then(async (playthroughs) => {
        const ids = playthroughs.map((p) => p.id)
        const progress = ids.length > 0 ? await fetchAllDexEntries(ids) : {}
        setStore({ playthroughs, progress })
      })
      .catch((e) => console.error("Failed to load playthroughs:", e))
      .finally(() => setLoading(false))
  }, [user])

  const addPlaythrough = useCallback(
    (gameId: string, version: string, name: string) => {
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
      if (user) {
        createPlaythrough(user.id, gameId, version, name).catch((e) =>
          console.error("Failed to create playthrough:", e),
        )
      }
      return id
    },
    [user],
  )

  const removePlaythrough = useCallback((id: string) => {
    setStore((s) => {
      const progress = { ...s.progress }
      delete progress[id]
      return {
        playthroughs: s.playthroughs.filter((p) => p.id !== id),
        progress,
      }
    })
    deletePlaythrough(id).catch((e) => console.error("Failed to delete playthrough:", e))
  }, [])

  const setMode = useCallback((id: string, mode: TrackerMode) => {
    setStore((s) => ({
      ...s,
      playthroughs: s.playthroughs.map((p) => (p.id === id ? { ...p, mode } : p)),
    }))
    updatePlaythroughMode(id, mode).catch((e) => console.error("Failed to update mode:", e))
  }, [])

  const completeSetup = useCallback((id: string) => {
    setStore((s) => ({
      ...s,
      playthroughs: s.playthroughs.map((p) => (p.id === id ? { ...p, setupDone: true } : p)),
    }))
    completePlaythroughSetup(id).catch((e) => console.error("Failed to complete setup:", e))
  }, [])

  const cycle = useCallback((playthroughId: string, pokemonId: number) => {
    setStore((s) => {
      const pt = s.playthroughs.find((p) => p.id === playthroughId)
      if (!pt) return s
      const state: TrackerState = { ...(s.progress[playthroughId] ?? {}) }
      const cur = state[pokemonId]?.s ?? 0
      const stamp = pt.setupDone ? { t: Date.now() } : {}
      let newStatus: CatchStatus = 0
      if (pt.mode === "caught") {
        if (cur === 2) {
          delete state[pokemonId]
          newStatus = 0
        } else {
          state[pokemonId] = { s: 2, ...stamp }
          newStatus = 2
        }
      } else {
        if (cur === 0) {
          state[pokemonId] = { s: 1, ...stamp }
          newStatus = 1
        } else if (cur === 1) {
          state[pokemonId] = { s: 2, ...stamp }
          newStatus = 2
        } else {
          delete state[pokemonId]
          newStatus = 0
        }
      }
      upsertDexEntry(playthroughId, pokemonId, newStatus, pt.setupDone).catch((e) =>
        console.error("Failed to upsert dex entry:", e),
      )
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
        bulkUpsertDexEntries(playthroughId, pokemonIds, status, pt.setupDone).catch((e) =>
          console.error("Failed to bulk upsert:", e),
        )
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
      replaceDexEntries(playthroughId, seen, caught, pt.setupDone).catch((e) =>
        console.error("Failed to replace dex entries:", e),
      )
      return { ...s, progress: { ...s.progress, [playthroughId]: state } }
    })
  }, [])

  const exportJson = useCallback(() => JSON.stringify(store, null, 2), [store])

  const importJson = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text)
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
      loading,
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
      loading,
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
