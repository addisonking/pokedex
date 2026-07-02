import type { CatchStatus, Playthrough, TrackerMode, TrackerState } from "../types"
import { supabase } from "./supabase"

type DbPlaythrough = {
  id: string
  user_id: string
  game_id: string
  version: string
  name: string
  mode: string
  created_at: string
  setup_done: boolean
}

type DbDexEntry = {
  playthrough_id: string
  pokemon_id: number
  status: number
  changed_at: string | null
}

function toPlaythrough(r: DbPlaythrough): Playthrough {
  return {
    id: r.id,
    gameId: r.game_id,
    version: r.version,
    name: r.name,
    mode: r.mode as TrackerMode,
    createdAt: new Date(r.created_at).getTime(),
    setupDone: r.setup_done,
  }
}

export async function fetchPlaythroughs(userId: string): Promise<Playthrough[]> {
  const { data, error } = await supabase
    .from("playthroughs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data as DbPlaythrough[]).map(toPlaythrough)
}

export async function fetchDexEntries(playthroughId: string): Promise<TrackerState> {
  const { data, error } = await supabase
    .from("dex_entries")
    .select("*")
    .eq("playthrough_id", playthroughId)
  if (error) throw error
  const state: TrackerState = {}
  for (const r of data as DbDexEntry[]) {
    state[r.pokemon_id] = {
      s: r.status as CatchStatus,
      ...(r.changed_at ? { t: new Date(r.changed_at).getTime() } : {}),
    }
  }
  return state
}

export async function fetchAllDexEntries(
  playthroughIds: string[],
): Promise<Record<string, TrackerState>> {
  if (playthroughIds.length === 0) return {}
  const { data, error } = await supabase
    .from("dex_entries")
    .select("*")
    .in("playthrough_id", playthroughIds)
  if (error) throw error
  const result: Record<string, TrackerState> = {}
  for (const r of data as DbDexEntry[]) {
    if (!result[r.playthrough_id]) result[r.playthrough_id] = {}
    result[r.playthrough_id][r.pokemon_id] = {
      s: r.status as CatchStatus,
      ...(r.changed_at ? { t: new Date(r.changed_at).getTime() } : {}),
    }
  }
  return result
}

export async function createPlaythrough(
  userId: string,
  gameId: string,
  version: string,
  name: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("playthroughs")
    .insert({ user_id: userId, game_id: gameId, version, name, mode: "seen", setup_done: false })
    .select("id")
    .single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function deletePlaythrough(id: string): Promise<void> {
  const { error } = await supabase.from("playthroughs").delete().eq("id", id)
  if (error) throw error
}

export async function updatePlaythroughMode(id: string, mode: TrackerMode): Promise<void> {
  const { error } = await supabase.from("playthroughs").update({ mode }).eq("id", id)
  if (error) throw error
}

export async function completePlaythroughSetup(id: string): Promise<void> {
  const { error } = await supabase.from("playthroughs").update({ setup_done: true }).eq("id", id)
  if (error) throw error
}

export async function upsertDexEntry(
  playthroughId: string,
  pokemonId: number,
  status: CatchStatus,
  setupDone: boolean,
): Promise<void> {
  if (status === 0) {
    const { error } = await supabase
      .from("dex_entries")
      .delete()
      .eq("playthrough_id", playthroughId)
      .eq("pokemon_id", pokemonId)
    if (error) throw error
    return
  }
  const { error } = await supabase.from("dex_entries").upsert({
    playthrough_id: playthroughId,
    pokemon_id: pokemonId,
    status,
    changed_at: setupDone ? new Date().toISOString() : null,
  })
  if (error) throw error
}

export async function bulkUpsertDexEntries(
  playthroughId: string,
  pokemonIds: number[],
  status: CatchStatus,
  setupDone: boolean,
): Promise<void> {
  if (status === 0) {
    const { error } = await supabase
      .from("dex_entries")
      .delete()
      .in("pokemon_id", pokemonIds)
      .eq("playthrough_id", playthroughId)
    if (error) throw error
    return
  }
  const changedAt = setupDone ? new Date().toISOString() : null
  const rows = pokemonIds.map((pid) => ({
    playthrough_id: playthroughId,
    pokemon_id: pid,
    status,
    changed_at: changedAt,
  }))
  const { error } = await supabase.from("dex_entries").upsert(rows)
  if (error) throw error
}

export async function replaceDexEntries(
  playthroughId: string,
  seen: number[],
  caught: number[],
  setupDone: boolean,
): Promise<void> {
  const { error: delErr } = await supabase
    .from("dex_entries")
    .delete()
    .eq("playthrough_id", playthroughId)
  if (delErr) throw delErr

  const changedAt = setupDone ? new Date().toISOString() : null
  const caughtSet = new Set(caught)
  const rows: {
    playthrough_id: string
    pokemon_id: number
    status: number
    changed_at: string | null
  }[] = []

  for (const pid of seen) {
    if (!caughtSet.has(pid)) {
      rows.push({
        playthrough_id: playthroughId,
        pokemon_id: pid,
        status: 1,
        changed_at: changedAt,
      })
    }
  }
  for (const pid of caught) {
    rows.push({ playthrough_id: playthroughId, pokemon_id: pid, status: 2, changed_at: changedAt })
  }

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("dex_entries").insert(rows)
    if (insErr) throw insErr
  }
}
