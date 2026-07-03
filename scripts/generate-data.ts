import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../src/data");
const ENCOUNTERS_DIR = resolve(OUT_DIR, "encounters");
const POKEAPI = "https://pokeapi.co/api/v2";
const MAX_ID = 649;

const SUPPORTED_VERSIONS = new Set([
  "red", "blue", "yellow",
  "gold", "silver", "crystal",
  "ruby", "sapphire", "emerald",
  "firered", "leafgreen",
  "diamond", "pearl", "platinum",
  "heartgold", "soulsilver",
  "black", "white",
  "black-2", "white-2",
]);

const REGION_PREFIX_RE = /^(kanto|johto|hoenn|sinnoh|unova|kalos|alola|galar|paldea|hisui)-/;

type GameDef = {
  id: string;
  name: string;
  shortName: string;
  gen: number;
  versions: string[];
  pokedexId: number;
  serebiiSuffix: string;
  description: string;
};

const GAMES: GameDef[] = [
  {
    id: "rby",
    name: "Red / Blue / Yellow",
    shortName: "RBY",
    gen: 1,
    versions: ["red", "blue", "yellow"],
    pokedexId: 2,
    serebiiSuffix: "",
    description: "Kanto",
  },
  {
    id: "gsc",
    name: "Gold / Silver / Crystal",
    shortName: "GSC",
    gen: 2,
    versions: ["gold", "silver", "crystal"],
    pokedexId: 3,
    serebiiSuffix: "gs",
    description: "Johto",
  },
  {
    id: "rse",
    name: "Ruby / Sapphire / Emerald",
    shortName: "RSE",
    gen: 3,
    versions: ["ruby", "sapphire", "emerald"],
    pokedexId: 4,
    serebiiSuffix: "rs",
    description: "Hoenn",
  },
  {
    id: "frlg",
    name: "FireRed / LeafGreen",
    shortName: "FRLG",
    gen: 3,
    versions: ["firered", "leafgreen"],
    pokedexId: 2,
    serebiiSuffix: "rs",
    description: "Kanto",
  },
  {
    id: "dpp",
    name: "Diamond / Pearl / Platinum",
    shortName: "DPPt",
    gen: 4,
    versions: ["diamond", "pearl", "platinum"],
    pokedexId: 6,
    serebiiSuffix: "dp",
    description: "Sinnoh",
  },
  {
    id: "hgss",
    name: "HeartGold / SoulSilver",
    shortName: "HGSS",
    gen: 4,
    versions: ["heartgold", "soulsilver"],
    pokedexId: 7,
    serebiiSuffix: "dp",
    description: "Johto",
  },
  {
    id: "bw",
    name: "Black / White",
    shortName: "BW",
    gen: 5,
    versions: ["black", "white"],
    pokedexId: 8,
    serebiiSuffix: "bw",
    description: "Unova",
  },
  {
    id: "b2w2",
    name: "Black 2 / White 2",
    shortName: "B2W2",
    gen: 5,
    versions: ["black-2", "white-2"],
    pokedexId: 9,
    serebiiSuffix: "bw",
    description: "Unova",
  },
];

function genForId(id: number): number {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  return 5;
}

async function fetchJson(url: string): Promise<any> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: size }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function buildNational(): Promise<
  { id: number; name: string; types: string[]; gen: number }[]
> {
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1);
  let done = 0;
  const data = await pool(ids, 15, async (id) => {
    const d = await fetchJson(`${POKEAPI}/pokemon/${id}`);
    const types = d.types
      .sort((a: any, b: any) => a.slot - b.slot)
      .map((t: any) => t.type.name);
    const out = { id, name: d.name as string, types, gen: genForId(id) };
    done++;
    if (done % 50 === 0) console.log(`  national ${done}/${MAX_ID}`);
    return out;
  });
  return data;
}

async function buildRegional(g: GameDef): Promise<{ r: number; n: number }[]> {
  const data = await fetchJson(`${POKEAPI}/pokedex/${g.pokedexId}/`);
  const raw: unknown[] = data.pokemon_entries;
  const entries: { r: number; n: number }[] = raw
    .map((e: any) => {
      const m = e.pokemon_species.url.match(/\/(\d+)\/$/);
      return { r: Number(e.entry_number), n: m ? Number(m[1]) : 0 };
    })
    .filter((e: { r: number; n: number }) => e.n > 0 && e.n <= MAX_ID);
  entries.sort((a, b) => a.r - b.r);
  return entries;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function prettifyLocation(slug: string): string {
  let s = slug.replace(/-area$/, "").replace(REGION_PREFIX_RE, "");
  return titleCase(s);
}

type EncRow = {
  loc: string;
  method: string;
  chance: number;
  min: number;
  max: number;
  cond?: string[];
};

type VersionEncounters = Record<string, EncRow[]>;

type RawEncounter = {
  location_area: { name: string };
  version_details: {
    version: { name: string };
    encounter_details: {
      chance: number;
      min_level: number;
      max_level: number;
      method: { name: string };
      condition_values: { name: string }[];
    }[];
  }[];
};

function aggregateEncounters(raw: RawEncounter[]): VersionEncounters {
  const byVersion: Record<string, Map<string, EncRow>> = {};
  for (const area of raw) {
    const loc = prettifyLocation(area.location_area.name);
    for (const vd of area.version_details) {
      const v = vd.version.name;
      if (!SUPPORTED_VERSIONS.has(v)) continue;
      const map = (byVersion[v] ??= new Map());
      for (const ed of vd.encounter_details) {
        const method = ed.method.name;
        const conds = ed.condition_values.map((c) => c.name).sort();
        const key = `${loc}\u0000${method}\u0000${conds.join(",")}`;
        const existing = map.get(key);
        if (existing) {
          existing.chance = Math.min(100, existing.chance + ed.chance);
          existing.min = Math.min(existing.min, ed.min_level);
          existing.max = Math.max(existing.max, ed.max_level);
        } else {
          map.set(key, {
            loc,
            method,
            chance: Math.min(100, ed.chance),
            min: ed.min_level,
            max: ed.max_level,
            cond: conds.length ? conds : undefined,
          });
        }
      }
    }
  }
  const out: VersionEncounters = {};
  for (const [v, map] of Object.entries(byVersion)) {
    out[v] = Array.from(map.values());
  }
  return out;
}

async function buildEncounters(): Promise<void> {
  await rm(ENCOUNTERS_DIR, { recursive: true, force: true });
  await mkdir(ENCOUNTERS_DIR, { recursive: true });
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1);
  let done = 0;
  const perPokemon: VersionEncounters[] = await pool(ids, 15, async (id) => {
    const raw = (await fetchJson(`${POKEAPI}/pokemon/${id}/encounters`)) as
      | RawEncounter[]
      | null;
    done++;
    if (done % 50 === 0) console.log(`  encounters ${done}/${MAX_ID}`);
    if (!Array.isArray(raw)) return {};
    return aggregateEncounters(raw);
  });
  for (const v of SUPPORTED_VERSIONS) {
    const fileMap: Record<string, EncRow[]> = {};
    for (let i = 0; i < perPokemon.length; i++) {
      const rows = perPokemon[i]?.[v];
      if (rows && rows.length) fileMap[String(ids[i])] = rows;
    }
    await writeFile(
      resolve(ENCOUNTERS_DIR, `${v}.json`),
      JSON.stringify(fileMap, null, 0),
    );
    console.log(`  wrote encounters/${v}.json (${Object.keys(fileMap).length} pokemon)`);
  }
}

type EvoChain = {
  chain: {
    species: { name: string; url: string };
    evolves_to: {
      species: { name: string; url: string };
      evolution_details: Record<string, unknown>[];
      evolves_to: EvoChain["chain"]["evolves_to"];
    }[];
  };
};

function idFromSpeciesUrl(url: string): number {
  const m = url.match(/\/(\d+)\/$/);
  return m ? Number(m[1]) : 0;
}

function describeEvoDetail(d: Record<string, unknown>): { trigger: string; level?: number; item?: string; note?: string } | null {
  const trigger = (d.trigger as { name?: string } | undefined)?.name ?? "unknown";
  const level = typeof d.min_level === "number" ? d.min_level : undefined;
  const item = (d.item as { name?: string } | undefined)?.name;
  const notes: string[] = [];
  if (typeof d.min_happiness === "number") notes.push("high friendship");
  if (typeof d.time_of_day === "string" && d.time_of_day) notes.push(d.time_of_day);
  if (typeof d.held_item === "object" && d.held_item) notes.push(`held ${titleCase((d.held_item as { name: string }).name)}`);
  if (typeof d.known_move === "object" && d.known_move) notes.push(`knows ${titleCase((d.known_move as { name: string }).name)}`);
  if (typeof d.known_move_type === "object" && d.known_move_type) notes.push(`knows ${titleCase((d.known_move_type as { name: string }).name)}-type move`);
  if (typeof d.min_beauty === "number") notes.push("high beauty");
  if (typeof d.gender === "number") notes.push(d.gender === 1 ? "female" : "male");
  if (typeof d.location === "object" && d.location) notes.push(`at ${titleCase((d.location as { name: string }).name)}`);
  if (d.needs_overworld_rain === true) notes.push("in rain");
  if (typeof d.turn_upside_down === "boolean" && d.turn_upside_down) notes.push("turn device upside down");
  const note = notes.length ? notes.join(", ") : undefined;
  return { trigger, level, item: item as string | undefined, note };
}

async function buildEvolutions(): Promise<void> {
  const ids = Array.from({ length: MAX_ID }, (_, i) => i + 1);
  let speciesDone = 0;
  const chainUrls: string[] = await pool(ids, 15, async (id) => {
    const sp = await fetchJson(`${POKEAPI}/pokemon-species/${id}`);
    speciesDone++;
    if (speciesDone % 50 === 0) console.log(`  species ${speciesDone}/${MAX_ID}`);
    return (sp.evolution_chain as { url: string }).url;
  });
  const uniqueChainUrls = Array.from(new Set(chainUrls));
  console.log(`  ${uniqueChainUrls.length} unique evolution chains`);
  let chainDone = 0;
  const chains: EvoChain[] = await pool(uniqueChainUrls, 15, async (url) => {
    const c = (await fetchJson(url)) as EvoChain;
    chainDone++;
    if (chainDone % 50 === 0) console.log(`  chains ${chainDone}/${uniqueChainUrls.length}`);
    return c;
  });
  const out: Record<string, { from: number; trigger: string; level?: number; item?: string; note?: string }> = {};
  function walk(node: EvoChain["chain"], fromId: number): void {
    for (const child of node.evolves_to) {
      const childId = idFromSpeciesUrl(child.species.url);
      if (childId > 0 && childId <= MAX_ID) {
        const detail = child.evolution_details[0];
        if (detail) {
          const desc = describeEvoDetail(detail);
          if (desc) out[String(childId)] = { from: fromId, ...desc };
        }
        walk(child, childId);
      }
    }
  }
  for (const c of chains) {
    const rootId = idFromSpeciesUrl(c.chain.species.url);
    if (rootId > 0 && rootId <= MAX_ID) walk(c.chain, rootId);
  }
  await writeFile(resolve(OUT_DIR, "evolutions.json"), JSON.stringify(out, null, 0));
  console.log(`  wrote evolutions.json (${Object.keys(out).length} entries)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log("building national dex (1-649)...");
  const national = await buildNational();
  await writeFile(
    resolve(OUT_DIR, "pokemon.json"),
    JSON.stringify(national, null, 0),
  );
  console.log(`  wrote ${national.length} pokemon`);

  console.log("building regional dexes...");
  const games = [];
  for (const g of GAMES) {
    const dex = await buildRegional(g);
    games.push({
      id: g.id,
      name: g.name,
      shortName: g.shortName,
      gen: g.gen,
      versions: g.versions,
      serebiiSuffix: g.serebiiSuffix,
      description: g.description,
      dex,
    });
    console.log(`  ${g.id}: ${dex.length} entries`);
  }
  await writeFile(resolve(OUT_DIR, "games.json"), JSON.stringify(games, null, 0));
  console.log("done.");

  console.log("building encounter data (1-649)...");
  await buildEncounters();

  console.log("building evolution chains (1-649)...");
  await buildEvolutions();

  console.log("all done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
