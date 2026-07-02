# Graph Report - .  (2026-07-02)

## Corpus Check
- Corpus is ~22,387 words - fits in a single context window. You may not need a graph.

## Summary
- 182 nodes · 269 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Pokémon Display & Filtering UI|Pokémon Display & Filtering UI]]
- [[_COMMUNITY_Biome LinterFormatter Config|Biome Linter/Formatter Config]]
- [[_COMMUNITY_Project Architecture & Data Pipeline|Project Architecture & Data Pipeline]]
- [[_COMMUNITY_Game Progress UI Components|Game Progress UI Components]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Package Dependencies & Scripts|Package Dependencies & Scripts]]
- [[_COMMUNITY_App Root & State Management|App Root & State Management]]
- [[_COMMUNITY_Data Generation Script|Data Generation Script]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Build & Typecheck Commands|Build & Typecheck Commands]]
- [[_COMMUNITY_Dev Server|Dev Server]]
- [[_COMMUNITY_Dependency Installation|Dependency Installation]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `useProgress()` - 11 edges
3. `Pokédex Tracker App` - 10 edges
4. `scripts` - 8 edges
5. `formatter` - 6 edges
6. `cn()` - 6 edges
7. `countCaught()` - 5 edges
8. `PlaythroughTracker()` - 5 edges
9. `vcs` - 4 edges
10. `formatter` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Pokéball icon (SVG: red top half, white bottom, central button)` --conceptually_related_to--> `Pokédex Tracker App`  [INFERRED]
  public/pokeball.svg → AGENTS.md
- `/src/main.tsx (entry module)` --implements--> `Pokédex Tracker App`  [INFERRED]
  index.html → AGENTS.md
- `favicon /pokeball.svg link` --references--> `Pokéball icon (SVG: red top half, white bottom, central button)`  [EXTRACTED]
  index.html → public/pokeball.svg
- `GameCard()` --calls--> `useProgress()`  [EXTRACTED]
  src/components/GameCard.tsx → src/lib/storage.tsx
- `PlaythroughTracker()` --calls--> `countCaught()`  [EXTRACTED]
  src/pages/PlaythroughTracker.tsx → src/lib/progress.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **PokeAPI → generate-data.ts → pokemon.json + games.json data pipeline** — agents_pokeapi, agents_generate_data_ts, agents_pokemon_json, agents_games_json [INFERRED 0.95]
- **Pokedex app stack: Vite + React 18 + TypeScript + Tailwind v4 + Biome + HashRouter** — agents_pokedexapp, agents_vite, agents_react18, agents_typescript, agents_tailwindv4, agents_biome, agents_reactrouter_hashrouter [INFERRED 0.85]

## Communities (13 total, 3 thin omitted)

### Community 0 - "Pokémon Display & Filtering UI"
Cohesion: 0.11
Nodes (26): CAUGHT_STATUSES, Filters(), Props, SEEN_STATUSES, cap(), PokemonCard(), Props, STATUS_LABEL (+18 more)

### Community 1 - "Biome Linter/Formatter Config"
Cohesion: 0.08
Nodes (24): files, ignoreUnknown, formatter, enabled, indentStyle, indentWidth, lineEnding, lineWidth (+16 more)

### Community 2 - "Project Architecture & Data Pipeline"
Cohesion: 0.10
Nodes (21): Biome (linter/formatter), bun run format (biome format --write src), bun run generate (regenerate src/data/*.json from PokeAPI), bun run lint (biome check src), Game → regional dex source mapping (PokeAPI pokedex ids), src/data/games.json (8 games with serebiiSuffix + dex), scripts/generate-data.ts (data generator), localStorage progress state (pokedex-progress-v1) (+13 more)

### Community 3 - "Game Progress UI Components"
Cohesion: 0.15
Nodes (16): Props, GameCard(), Props, ProgressBar(), Props, GAMES, GAMES_BY_ID, GEN_CAP (+8 more)

### Community 4 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 5 - "Package Dependencies & Scripts"
Cohesion: 0.12
Nodes (16): dependencies, react, react-dom, react-router-dom, name, private, scripts, build (+8 more)

### Community 6 - "App Root & State Management"
Cohesion: 0.21
Nodes (12): App(), AddGameModal(), Settings(), C, Ctx, emptyStore(), load(), ProgressProvider() (+4 more)

### Community 7 - "Data Generation Script"
Cohesion: 0.25
Nodes (9): buildNational(), buildRegional(), __dirname, fetchJson(), GameDef, GAMES, main(), OUT_DIR (+1 more)

### Community 8 - "Dev Dependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @biomejs/biome, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript (+2 more)

## Knowledge Gaps
- **93 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `Package Dependencies & Scripts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `useProgress()` connect `App Root & State Management` to `Pokémon Display & Filtering UI`, `Game Progress UI Components`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Pokédex Tracker App` (e.g. with `/src/main.tsx (entry module)` and `Pokéball icon (SVG: red top half, white bottom, central button)`) actually correct?**
  _`Pokédex Tracker App` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Pokémon Display & Filtering UI` be split into smaller, more focused modules?**
  _Cohesion score 0.11092436974789915 - nodes in this community are weakly interconnected._
- **Should `Biome Linter/Formatter Config` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Project Architecture & Data Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._