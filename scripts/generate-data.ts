import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../src/data");
const POKEAPI = "https://pokeapi.co/api/v2";
const MAX_ID = 649;

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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
