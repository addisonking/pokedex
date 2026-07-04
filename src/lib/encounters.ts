import { POKEMON_BY_ID } from "../data"
import evolutionsRaw from "../data/evolutions.json"
import type { Area, EncounterRow, Evolution, GridEntry, VersionEncounters } from "../types"

const evolutions = evolutionsRaw as Record<string, Evolution>

const encounterModules = import.meta.glob("../data/encounters/*.json")
const cache: Record<string, Promise<VersionEncounters>> = {}

export function loadEncounters(version: string): Promise<VersionEncounters> {
  const cached = cache[version]
  if (cached) return cached
  const key = `../data/encounters/${version}.json`
  const loader = encounterModules[key]
  const p: Promise<VersionEncounters> = loader
    ? loader().then((m) => (m as { default: VersionEncounters }).default)
    : Promise.resolve({})
  cache[version] = p
  return p
}

export function groupByArea(map: VersionEncounters, entries: GridEntry[]): Area[] {
  const byLoc = new Map<string, Map<number, { entry: GridEntry; rows: EncounterRow[] }>>()
  for (const entry of entries) {
    const rows = map[String(entry.pokemon.id)]
    if (!rows) continue
    for (const row of rows) {
      let loc = byLoc.get(row.loc)
      if (!loc) {
        loc = new Map()
        byLoc.set(row.loc, loc)
      }
      let ae = loc.get(entry.pokemon.id)
      if (!ae) {
        ae = { entry, rows: [] }
        loc.set(entry.pokemon.id, ae)
      }
      ae.rows.push(row)
    }
  }
  const out: Area[] = []
  for (const [loc, byId] of byLoc) {
    const areaEntries = [...byId.values()]
    for (const ae of areaEntries) {
      ae.rows.sort((a, b) => a.method.localeCompare(b.method) || a.min - b.min)
    }
    areaEntries.sort((a, b) => a.entry.pokemon.id - b.entry.pokemon.id)
    out.push({ loc, entries: areaEntries })
  }
  return out
}

export const METHOD_LABELS: Record<string, string> = {
  walk: "Walking",
  "old-rod": "Old Rod",
  "good-rod": "Good Rod",
  "super-rod": "Super Rod",
  surf: "Surfing",
  "rock-smash": "Rock Smash",
  headbutt: "Headbutt",
  "headbutt-low": "Headbutt (low)",
  "headbutt-normal": "Headbutt",
  "headbutt-high": "Headbutt (high)",
  gift: "Gift",
  egg: "Egg",
  "only-one": "Static",
  pokeflute: "Pokeflute",
  "overworld-special": "Overworld",
  "overworld-flying": "Overworld (flying)",
  overworld: "Overworld",
  "white-hole": "Wormhole",
  "yellow-wormhole": "Wormhole",
  "red-wormhole": "Wormhole",
  "green-wormhole": "Wormhole",
  "blue-wormhole": "Wormhole",
  trade: "Trade",
  "gift-egg": "Gift Egg",
  "sos-encounter": "SOS",
  "island-scan": "Island Scan",
  wander: "Wandering",
  shake: "Shaking",
  tree: "Tree",
  "shaking-grass": "Shaking Grass",
  "shaking-bush": "Shaking Bush",
  "shaking-cave": "Shaking Cave",
  ripple: "Ripple",
  "surf-fishing": "Surf/Fish",
  fishing: "Fishing",
  "dive-fishing": "Dive",
  phenomenon: "Phenomenon",
  slot2: "Slot-2",
  "roaming-hoenn": "Roaming",
  "roaming-kanto": "Roaming",
  "roaming-sinnoh": "Roaming",
  "roaming-johto": "Roaming",
  "roaming-unova": "Roaming",
  special: "Special",
  snag: "Snag",
  starter: "Starter",
  "electro-ball": "Electro Ball",
}

export const CONDITION_LABELS: Record<string, string> = {
  "time-morning": "Morning",
  "time-day": "Day",
  "time-night": "Night",
  "swarm-yes": "Swarm",
  "swarm-no": "No swarm",
  "radio-off": "No radio",
  "radio-hoenn": "Hoenn Sound",
  "radio-sinnoh": "Sinnoh Sound",
  "bug-catching-contest-yes": "Bug Contest",
  "bug-catching-contest-no": "No contest",
  "season-spring": "Spring",
  "season-summer": "Summer",
  "season-autumn": "Autumn",
  "season-winter": "Winter",
  "shoal-cave-low-tide": "Low tide",
  "shoal-cave-high-tide": "High tide",
  "slot2-none": "No slot-2",
}

export function methodLabel(method: string): string {
  return METHOD_LABELS[method] ?? titleCase(method)
}

export function conditionLabel(cond: string): string {
  return CONDITION_LABELS[cond] ?? titleCase(cond)
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

function triggerLabel(trigger: string): string {
  if (trigger === "level-up") return "Level up"
  return titleCase(trigger)
}

function itemLabel(item: string): string {
  // "fire-stone" → "Fire Stone"
  return titleCase(item)
}

export function evolutionHint(id: number): string | null {
  const evo = evolutions[String(id)]
  if (!evo) return null
  const from = POKEMON_BY_ID.get(evo.from)
  if (!from) return null
  const fromName = from.name[0].toUpperCase() + from.name.slice(1)
  const parts: string[] = [`Evolve ${fromName}`]
  if (evo.trigger === "level-up" && evo.level != null) {
    parts.push(`Lv ${evo.level}`)
  } else if (evo.trigger === "level-up" && !evo.level) {
    // happiness/time/etc — note carries the detail
    if (evo.note) parts.push(evo.note)
    else parts.push("Level up")
  } else if (evo.trigger === "trade") {
    parts.push("Trade")
    if (evo.item) parts.push(`holding ${itemLabel(evo.item)}`)
    if (evo.note) parts.push(`(${evo.note})`)
  } else if (evo.trigger === "use-item") {
    parts.push(evo.item ? itemLabel(evo.item) : "Use item")
    if (evo.note) parts.push(`(${evo.note})`)
  } else if (evo.trigger === "shed" || evo.trigger === "spin") {
    parts.push(titleCase(evo.trigger))
    if (evo.note) parts.push(`(${evo.note})`)
  } else {
    parts.push(triggerLabel(evo.trigger))
    if (evo.note) parts.push(`(${evo.note})`)
  }
  return parts.join(" — ")
}
